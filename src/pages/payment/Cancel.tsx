import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';

export default function Cancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-oxford-blue flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-cyan/5 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-card p-10 text-center border border-white/10 relative z-10"
      >
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/30">
          <XCircle size={40} className="text-red-500" />
        </div>
        
        <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase">Payment Cancelled</h2>
        <p className="text-white/60 mb-8 text-sm uppercase tracking-widest leading-relaxed">
          Your payment process was cancelled or incomplete. No charges were made, and your account remains on the <span className="text-white font-black">Free</span> tier.
        </p>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => navigate('/pricing')}
            className="btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-3 group"
          >
            <CreditCard size={16} />
            <span className="uppercase tracking-widest text-xs font-black">Return to Pricing</span>
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 rounded-xl flex items-center justify-center gap-3 text-white/40 hover:text-white transition-colors border border-white/5 hover:bg-white/5"
          >
            <ArrowLeft size={16} />
            <span className="uppercase tracking-widest text-xs font-black">Continue with Free Plan</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
