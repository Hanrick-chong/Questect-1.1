import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  History, 
  Zap, 
  Shield, 
  Crown, 
  Building, 
  Globe,
  Loader2
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, onSnapshot, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { APP_NAME } from '../lib/constants';

interface UserProfile {
  plan: string;
  email: string;
}

interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  isActive: boolean;
}

interface SubscriptionData {
  plan: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export default function Billing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripeConfig, setStripeConfig] = useState<StripeConfig | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [showCheckout, setShowCheckout] = useState<string | null>(null);
  const isAdmin = auth.currentUser?.email === 'cbumsteak@gmail.com';

  // Define stripeLinks at the component level for accessibility
  const stripeLinks: Record<string, string | undefined> = {
    STARTER: (import.meta as any).env.NEXT_PUBLIC_STRIPE_STARTER_LINK,
    PRO: (import.meta as any).env.NEXT_PUBLIC_STRIPE_PRO_LINK,
    ADVANCED: (import.meta as any).env.NEXT_PUBLIC_STRIPE_ADVANCED_LINK,
    GROWTH: (import.meta as any).env.NEXT_PUBLIC_STRIPE_GROWTH_LINK,
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch Stripe Config if Admin
      if (isAdmin) {
        getDoc(doc(db, 'system', 'stripe_config')).then(doc => {
          if (doc.exists()) {
            setStripeConfig(doc.data() as StripeConfig);
          } else {
            setStripeConfig({
              publishableKey: '',
              secretKey: '',
              webhookSecret: '',
              isActive: false
            });
          }
        });
      }

      // Listen to user profile for plan changes
      const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          setUserPlan(doc.data().plan || 'free');
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

      // Listen to subscription data
      const q = query(collection(db, 'subscriptions'), where('userId', '==', user.uid));
      const unsubscribeSub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data() as SubscriptionData;
          setSubscription(data);
        } else {
          setSubscription(null);
        }
        setLoading(false);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'subscriptions'));

      return () => {
        unsubscribeUser();
        unsubscribeSub();
      };
    });

    return () => unsubscribeAuth();
  }, [navigate, isAdmin]);

  const handleSaveStripeConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeConfig) return;
    setIsSavingConfig(true);
    try {
      await setDoc(doc(db, 'system', 'stripe_config'), stripeConfig);
      alert("Stripe Configuration Saved Successfully.");
    } catch (err) {
      console.error("Error saving config:", err);
      alert("Failed to save configuration.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleUpgrade = async (planName: string) => {
    if (!auth.currentUser) return;
    const planNameLower = planName.toLowerCase();
    
    if (planNameLower === userPlan) {
      navigate('/analyze');
      return;
    }

    if (planName === 'Starter') window.location.href = "https://buy.stripe.com/eVq00jaA0afIb7fdMm5gc04";
    else if (planName === 'Pro') window.location.href = "https://buy.stripe.com/8x27sLeQgdrUejr8s25gc05";
    else if (planName === 'Advanced') window.location.href = "https://buy.stripe.com/aFa6oH9vWevYa3b23E5gc00";
    else if (planName === 'Growth') window.location.href = "https://buy.stripe.com/14AdR99vWcnQ6QZeQq5gc03";
    else if (planName === 'Enterprise') navigate('/enterprise-inquiry');
    else if (planName === 'Free') {
      // Free plan logic
      setLoading(true);
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          plan: 'free'
        });
        setUserPlan('free');
        alert("Switched to Free plan successfully.");
      } catch (err) {
        console.error("Error switching to free plan:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const plans = [
    { 
      name: 'Free', 
      price: 0, 
      icon: Zap, 
      color: 'text-green-400',
      features: [
        'Quick Grading (Analyze-A)',
        '5 Daily Exam Grader Trials',
        'Basic History (10 Records)',
        'Smart Scan Technology'
      ]
    },
    { 
      name: 'Starter', 
      price: 19, 
      icon: Shield, 
      color: 'text-electric-cyan',
      features: [
        '10 Daily Exam Grader Trials',
        'Basic Dashboard Analytics',
        'Enhanced History (50 Records)',
        'Priority Email Support'
      ]
    },
    { 
      name: 'Pro', 
      price: 49, 
      icon: Crown, 
      color: 'text-electric-purple',
      features: [
        'Unlimited Exam Grader (System-S)',
        'Advanced Activity Trends',
        'Unlimited History Storage',
        'PDF Report Exports'
      ]
    },
    { 
      name: 'Advanced', 
      price: 99, 
      icon: Building, 
      color: 'text-red-400',
      features: [
        'Premium Analytics Engine',
        'Predictive Grade Distribution',
        'Batch Processing Optimization',
        '24/7 Priority Support'
      ]
    },
    { 
      name: 'Growth', 
      price: 299, 
      icon: Building, 
      color: 'text-orange-400',
      features: [
        'Institutional Dashboard',
        'Multi-Teacher Tracking',
        'Department-wide Trends',
        'Automated School Reporting'
      ]
    },
    { 
      name: 'Enterprise', 
      price: 'Custom Pricing', 
      icon: Globe, 
      color: 'text-electric-cyan',
      features: [
        'Custom Dashboard Modules',
        'Dedicated Account Manager',
        'On-premise Deployment Opt.',
        'SLA & Custom Contracts'
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-oxford-blue flex items-center justify-center">
        <Loader2 className="text-electric-cyan animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-oxford-blue relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] glow-ambient-purple blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] glow-ambient-cyan blur-[150px] opacity-10 pointer-events-none" />

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-oxford-blue/90 backdrop-blur-md"
            onClick={() => setShowCheckout(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-card w-full max-w-md p-10 border border-white/10 relative z-10"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl brand-gradient-bg flex items-center justify-center text-oxford-blue">
                {showCheckout.toLowerCase() === 'free' ? <Zap size={24} /> : <CreditCard size={24} />}
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-widest">
                  {showCheckout.toLowerCase() === 'free' ? 'Switch Plan' : 'Complete Upgrade'}
                </h3>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                  {showCheckout.toLowerCase() === 'free' ? `${APP_NAME} Free Tier` : 'Secure Checkout Powered by Stripe'}
                </p>
              </div>
            </div>

            <div className="space-y-6 mb-10">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  {React.createElement(plans.find(p => p.name === showCheckout)?.icon || Zap, { size: 16, className: plans.find(p => p.name === showCheckout)?.color })}
                  <span className="text-sm font-black text-white uppercase tracking-widest">{showCheckout} Plan</span>
                </div>
                <span className="text-lg font-black text-white tracking-tighter">
                  {showCheckout.toLowerCase() === 'free' ? 'Free' : `RM${plans.find(p => p.name === showCheckout)?.price}/mo`}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white/60">
                  <Check size={14} className="text-electric-cyan" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {showCheckout.toLowerCase() === 'free' ? 'Basic Features' : 'Instant Feature Activation'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <Check size={14} className="text-electric-cyan" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">No Credit Card Required</span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <Check size={14} className="text-electric-cyan" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Switch Anytime</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // Prevent parent click interception
                  handleUpgrade(showCheckout);
                }}
                className="btn-primary py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <ArrowRight size={16} />
                {showCheckout.toLowerCase() === 'free' ? 'Confirm Switch' : 'Confirm & Pay'}
              </button>
              <button
                onClick={() => setShowCheckout(null)}
                className="py-4 rounded-xl text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">Billing & Plans</h1>
          <p className="text-white/40 text-lg font-medium tracking-wide uppercase">Manage your {APP_NAME.toLowerCase()} subscription.</p>
        </motion.div>

        <div className="grid gap-8">
          {/* Current Plan Status */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="brand-gradient-border"
          >
            <div className="glass-card p-8 border border-white/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl brand-gradient-bg flex items-center justify-center shadow-lg">
                    <CreditCard className="text-oxford-blue" size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Current Plan</p>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                      {userPlan}
                      <span className="text-[10px] px-3 py-1 rounded-full bg-electric-cyan/20 text-electric-cyan border border-electric-cyan/30">
                        {subscription?.status || 'Active'}
                      </span>
                    </h2>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Next Billing Date</p>
                  <p className="text-lg font-black text-white uppercase tracking-widest">
                    {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Plan Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan, i) => {
              const isCurrent = userPlan.toLowerCase() === plan.name.toLowerCase();
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "brand-gradient-border group transition-all duration-300",
                    isCurrent ? "glow-cyan opacity-100" : "opacity-60 hover:opacity-100"
                  )}
                >
                  <div className="glass-card p-6 border border-white/5 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <plan.icon className={cn(plan.color)} size={24} />
                        <div>
                          <h3 className="text-lg font-black text-white uppercase tracking-widest">{plan.name}</h3>
                          <p className="text-xs text-white/40 font-bold uppercase tracking-widest">
                            {plan.price === 'Custom Pricing' ? 'Custom Pricing' : `RM${plan.price}/mo`}
                          </p>
                        </div>
                      </div>
                      {isCurrent ? (
                        <div className="flex items-center gap-2 text-electric-cyan">
                          <Check size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Current</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => plan.name === 'Enterprise' ? navigate('/enterprise-inquiry') : setShowCheckout(plan.name)}
                          disabled={loading}
                          className={cn(
                            "px-4 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all",
                            plan.name === 'Enterprise'
                              ? "bg-electric-cyan text-oxford-blue border-electric-cyan hover:scale-105" 
                              : "bg-white/5 hover:bg-white/10 border-white/10"
                          )}
                        >
                          {plan.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade'}
                        </button>
                      )}
                    </div>

                    {/* Feature List */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <Check size={12} className={cn(plan.color, "opacity-50")} />
                          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Honesty Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-4"
          >
            <AlertCircle className="text-yellow-500 shrink-0" size={20} />
            <div>
              <p className="text-xs font-black text-yellow-500 uppercase tracking-widest mb-1">Billing System Status</p>
              <p className="text-[10px] text-yellow-500/80 font-medium leading-relaxed uppercase tracking-wider">
                The {APP_NAME.toLowerCase()} billing foundation is active. Live payment processing requires your Stripe API keys. 
                Currently, upgrades are simulated for development purposes.
                <br />
                <span className="text-white/40 mt-2 block">
                  Stripe Status: {stripeConfig?.isActive ? 'LIVE' : 'SIMULATED'}
                </span>
              </p>
            </div>
          </motion.div>

          {/* Admin Stripe Configuration */}
          {isAdmin && stripeConfig && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-10 border border-electric-purple/30 mb-12 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Shield size={120} className="text-electric-purple" />
              </div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-electric-purple/10 border border-electric-purple/20 flex items-center justify-center text-electric-purple">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest">Admin: Stripe Activation</h3>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Connect your Stripe account to receive payments</p>
                </div>
              </div>

              <form onSubmit={handleSaveStripeConfig} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Publishable Key</label>
                    <input 
                      type="text"
                      value={stripeConfig.publishableKey}
                      onChange={(e) => setStripeConfig({...stripeConfig, publishableKey: e.target.value})}
                      placeholder="pk_live_..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-xs text-white focus:outline-none focus:border-electric-purple/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Secret Key</label>
                    <input 
                      type="password"
                      value={stripeConfig.secretKey}
                      onChange={(e) => setStripeConfig({...stripeConfig, secretKey: e.target.value})}
                      placeholder="sk_live_..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-xs text-white focus:outline-none focus:border-electric-purple/50 transition-all"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Webhook Secret</label>
                  <input 
                    type="password"
                    value={stripeConfig.webhookSecret}
                    onChange={(e) => setStripeConfig({...stripeConfig, webhookSecret: e.target.value})}
                    placeholder="whsec_..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-xs text-white focus:outline-none focus:border-electric-purple/50 transition-all"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox"
                        checked={stripeConfig.isActive}
                        onChange={(e) => setStripeConfig({...stripeConfig, isActive: e.target.checked})}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-all border ${stripeConfig.isActive ? 'bg-electric-purple border-electric-purple' : 'bg-white/5 border-white/10'}`} />
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${stripeConfig.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">
                      Activate Live Payments
                    </span>
                  </label>
                </div>

                <button 
                  type="submit"
                  disabled={isSavingConfig}
                  className="btn-primary py-4 px-10 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3"
                >
                  {isSavingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield size={16} />}
                  Save Configuration
                </button>
              </form>
            </motion.div>
          )}

          {/* Billing History Placeholder */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
              <History size={20} className="text-electric-cyan" />
              Billing History
            </h3>
            <div className="glass-card p-8 border border-white/5 text-center">
              <p className="text-white/20 text-xs font-black uppercase tracking-widest">No recent transactions found.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
