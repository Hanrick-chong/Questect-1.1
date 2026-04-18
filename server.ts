import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import fs from 'fs';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('[Server] Starting Questect backend...');

// Load Firebase Config
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
if (!fs.existsSync(firebaseConfigPath)) {
  console.error('[Server] firebase-applet-config.json not found!');
  process.exit(1);
}
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));

// Initialize Firebase Admin
let adminApp;
try {
  adminApp = getApps().length === 0 
    ? initializeApp({ projectId: firebaseConfig.projectId })
    : getApp();
  console.log('[Firebase] Admin initialized for project:', firebaseConfig.projectId);
} catch (err) {
  console.error('[Firebase] Initialization error:', err);
  process.exit(1);
}

// Use a getter for Firestore to ensure it's initialized correctly
let _db: any = null;
function getDb() {
  if (!_db) {
    try {
      _db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
      console.log('[Firestore] Database initialized:', firebaseConfig.firestoreDatabaseId);
    } catch (err) {
      console.error('[Firestore] Initialization error:', err);
      throw err;
    }
  }
  return _db;
}

let stripeClient: Stripe | null = null;
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn('[Stripe] STRIPE_SECRET_KEY is missing. Stripe features will be disabled.');
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: '2025-02-24-preview' as any,
    });
    console.log('[Stripe] Client initialized');
  }
  return stripeClient;
}

/**
 * Helper to map Stripe data to Questect plans
 */
async function getPlanFromStripeObject(obj: any): Promise<string | null> {
  try {
    const stripe = getStripe();
    // 1. Check metadata first
    if (obj.metadata?.plan) return obj.metadata.plan.toLowerCase();

    // 2. If it's a session, check line items
    if (obj.object === 'checkout.session') {
      const lineItems = await stripe.checkout.sessions.listLineItems(obj.id);
      const description = lineItems.data[0]?.description?.toLowerCase() || '';
      if (description.includes('starter')) return 'starter';
      if (description.includes('pro')) return 'pro';
      if (description.includes('advanced')) return 'advanced';
      if (description.includes('growth')) return 'growth';
    }

    // 3. If it's a subscription, check items
    if (obj.object === 'subscription') {
      const productId = obj.items.data[0].plan.product as string;
      const product = await stripe.products.retrieve(productId);
      const name = product.name.toLowerCase();
      if (name.includes('starter')) return 'starter';
      if (name.includes('pro')) return 'pro';
      if (name.includes('advanced')) return 'advanced';
      if (name.includes('growth')) return 'growth';
    }
  } catch (err) {
    console.error('[Stripe] Error mapping plan:', err);
  }

  return null;
}

/**
 * Update user plan in Firestore
 */
async function updateUserPlan(uid: string, plan: string, stripeCustomerId?: string, stripeSubscriptionId?: string) {
  try {
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const updateData: any = {
      plan: plan,
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (stripeCustomerId) updateData.stripeCustomerId = stripeCustomerId;
    if (stripeSubscriptionId) updateData.stripeSubscriptionId = stripeSubscriptionId;

    await userRef.update(updateData);
    console.log(`[Firestore] Updated user ${uid} to plan: ${plan}`);
  } catch (err) {
    console.error(`[Firestore] Error updating user ${uid}:`, err);
  }
}

/**
 * Log payment event
 */
async function logPaymentEvent(uid: string, eventType: string, data: any) {
  try {
    const db = getDb();
    await db.collection('payment_events').add({
      userId: uid,
      type: eventType,
      stripeEventId: data.eventId,
      stripeSessionId: data.sessionId || null,
      stripeSubscriptionId: data.subscriptionId || null,
      amount: data.amount || 0,
      currency: data.currency || 'myr',
      status: data.status || 'succeeded',
      plan: data.plan || null,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('[Firestore] Error logging payment event:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Stripe Webhook Endpoint (Must be before express.json())
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      const stripe = getStripe();
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not set');
      }
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const uid = session.client_reference_id;
          const plan = await getPlanFromStripeObject(session);

          if (uid && plan) {
            await updateUserPlan(uid, plan, session.customer as string, session.subscription as string);
            await logPaymentEvent(uid, 'checkout_completed', {
              eventId: event.id,
              sessionId: session.id,
              subscriptionId: session.subscription,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              currency: session.currency,
              plan
            });
          }
          break;
        }

        case 'invoice.paid': {
          const invoice = event.data.object as any; // Use any to avoid strict type issues with subscription property
          if (invoice.subscription) {
            const stripe = getStripe();
            const db = getDb();
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            const uid = subscription.metadata.userId || (await db.collection('users').where('stripeCustomerId', '==', invoice.customer).get()).docs[0]?.id;
            const plan = await getPlanFromStripeObject(subscription);

            if (uid && plan) {
              await updateUserPlan(uid, plan);
              await logPaymentEvent(uid, 'invoice_paid', {
                eventId: event.id,
                subscriptionId: invoice.subscription as string,
                amount: invoice.amount_paid / 100,
                currency: invoice.currency,
                plan
              });
            }
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const db = getDb();
          const uid = (await db.collection('users').where('stripeCustomerId', '==', invoice.customer).get()).docs[0]?.id;
          if (uid) {
            await logPaymentEvent(uid, 'payment_failed', {
              eventId: event.id,
              status: 'failed',
              amount: invoice.amount_due / 100,
              currency: invoice.currency
            });
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const db = getDb();
          const uid = subscription.metadata.userId || (await db.collection('users').where('stripeCustomerId', '==', subscription.customer).get()).docs[0]?.id;
          const plan = await getPlanFromStripeObject(subscription);

          if (uid && plan) {
            if (subscription.status === 'active') {
              await updateUserPlan(uid, plan);
            }
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const db = getDb();
          const uid = subscription.metadata.userId || (await db.collection('users').where('stripeCustomerId', '==', subscription.customer).get()).docs[0]?.id;
          
          if (uid) {
            await updateUserPlan(uid, 'free');
            await logPaymentEvent(uid, 'subscription_cancelled', {
              eventId: event.id,
              subscriptionId: subscription.id,
              status: 'cancelled'
            });
          }
          break;
        }
      }
    } catch (error) {
      console.error(`[Webhook Handler Error] ${event.type}:`, error);
    }

    res.json({ received: true });
  });

  // Regular API routes
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      stripe: !!process.env.STRIPE_SECRET_KEY,
      webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
      env: process.env.NODE_ENV
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist', 'client');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
