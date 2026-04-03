import React, { useState } from 'react';
import LegalLayout from '../../components/LegalLayout';
import { Check, ShieldCheck, CreditCard, Zap } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { APP_NAME } from '@/src/lib/constants';

export default function BillingPolicy() {
  const [agreed, setAgreed] = useState(false);

  return (
    <LegalLayout title="Billing Policy" lastUpdated="26th March 2026">
      <section className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-cyan-400/5 border border-cyan-400/20 p-4 rounded-xl text-center">
            <Zap className="mx-auto text-cyan-400 mb-2" size={24} />
            <h3 className="text-cyan-400 font-black uppercase tracking-widest text-[10px]">AI Quota</h3>
            <p className="text-slate-400 text-xs mt-1">Monthly usage limits apply based on your selected tier.</p>
          </div>
          <div className="bg-cyan-400/5 border border-cyan-400/20 p-4 rounded-xl text-center">
            <ShieldCheck className="mx-auto text-cyan-400 mb-2" size={24} />
            <h3 className="text-cyan-400 font-black uppercase tracking-widest text-[10px]">Auto-Renewal</h3>
            <p className="text-slate-400 text-xs mt-1">Subscriptions renew automatically unless cancelled.</p>
          </div>
          <div className="bg-cyan-400/5 border border-cyan-400/20 p-4 rounded-xl text-center">
            <CreditCard className="mx-auto text-cyan-400 mb-2" size={24} />
            <h3 className="text-cyan-400 font-black uppercase tracking-widest text-[10px]">Secure Billing</h3>
            <p className="text-slate-400 text-xs mt-1">Payments are processed via encrypted third-party providers.</p>
          </div>
        </div>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">1. Subscription Tiers</h2>
        <p>
          {APP_NAME} offers various subscription tiers (Free, Starter, Pro, Advanced, Growth, Enterprise). 
          Each tier provides a specific set of features and AI processing quotas.
        </p>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">2. Auto-Renewal</h2>
        <p>
          All paid subscriptions are set to auto-renew at the end of each billing cycle (monthly or annually). 
          You can disable auto-renewal at any time through your account settings.
        </p>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">3. Upgrades and Downgrades</h2>
        <p>
          You can upgrade your plan at any time. Downgrades will take effect at the end of your current billing cycle. 
          Refunds are not provided for partial months or unused AI quotas.
        </p>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">4. AI Quota and Overages</h2>
        <p>
          Each plan includes a monthly AI processing quota. If you exceed this quota, you may be prompted to upgrade 
          or purchase additional credits. Unused quota does not roll over to the next month.
        </p>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">5. Cancellation Policy</h2>
        <p>
          You may cancel your subscription at any time. Upon cancellation, you will continue to have access to 
          your plan's features until the end of the current billing cycle.
        </p>

        <div className="mt-16 pt-8 border-t border-cyan-400/10">
          <div className="bg-slate-900/80 border border-cyan-400/30 rounded-2xl p-8 space-y-6">
            <div className="flex items-start gap-4">
              <button
                onClick={() => setAgreed(!agreed)}
                className={cn(
                  "mt-1 w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-300 shrink-0",
                  agreed ? "bg-cyan-400 border-transparent shadow-[0_0_15px_rgba(34,211,238,0.4)]" : "border-cyan-400/30 hover:border-cyan-400/60"
                )}
              >
                {agreed && <Check size={16} className="text-slate-900 font-black" />}
              </button>
              <p className="text-slate-200 font-black uppercase tracking-widest text-sm leading-relaxed">
                I UNDERSTAND AND AGREE to the {APP_NAME} Billing Policy, including the auto-renewal terms and AI quota limitations.
              </p>
            </div>

            <button
              disabled={!agreed}
              className={cn(
                "w-full py-4 rounded-xl font-black uppercase tracking-[0.3em] text-sm transition-all duration-500 shadow-2xl",
                agreed 
                  ? "bg-cyan-400 text-slate-900 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]" 
                  : "bg-slate-800 text-slate-600 cursor-not-allowed grayscale"
              )}
            >
              Confirm & Proceed to Payment
            </button>
          </div>
        </div>
      </section>
    </LegalLayout>
  );
}
