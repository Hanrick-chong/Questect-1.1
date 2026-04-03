import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Loader2, Clock } from 'lucide-react';
import { APP_NAME, PLAN_NAMES, UserPlan } from '../../lib/constants';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

export default function Success() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const formattedPlanName = planName ? (PLAN_NAMES[planName as UserPlan] || planName) : '';

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/auth');
      return;
    }

    // Initial check
    const checkStatus = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.plan && data.plan !== 'free') {
          setPlanName(data.plan);
          setLoading(false);
        } else {
          setIsSyncing(true);
          setLoading(false);
        }
      }
    };

    checkStatus();

    // Real-time listener for sync
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.plan && data.plan !== 'free') {
          setPlanName(data.plan);
          setIsSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#001220] flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8A2BE2]/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00FFFF]/10 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-card p-10 text-center border border-white/10 relative z-10"
      >
        {loading ? (
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="w-16 h-16 text-[#00FFFF] animate-spin" />
            <h2 className="text-2xl font-black uppercase tracking-tighter">Verifying Status...</h2>
          </div>
        ) : isSyncing ? (
          <>
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
              <Clock size={40} className="text-[#00FFFF] animate-pulse" />
            </div>
            
            <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase">Payment Received</h2>
            <p className="text-white/60 mb-8 text-sm uppercase tracking-widest leading-relaxed">
              Your payment has been received and is being reviewed. Your account upgrade is still syncing with our infrastructure. 
              This usually takes less than a minute.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center gap-2 text-[10px] font-black text-[#00FFFF] uppercase tracking-widest">
                <Loader2 size={12} className="animate-spin" />
                Syncing in background...
              </div>
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 rounded-xl text-white/40 hover:text-white transition-colors border border-white/5 hover:bg-white/5 uppercase tracking-widest text-xs font-black"
              >
                Go to Dashboard (Free Tier)
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/30">
              <CheckCircle2 size={40} className="text-green-400" />
            </div>
            
            <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase">Payment Successful</h2>
            <p className="text-white/60 mb-8 text-sm uppercase tracking-widest leading-relaxed">
              Welcome to the <span className="text-[#00FFFF] font-black">{formattedPlanName}</span> tier. Your account has been upgraded and all features are now unlocked.
            </p>

            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-3 group"
            >
              <span className="uppercase tracking-widest text-xs font-black">Enter Dashboard</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
