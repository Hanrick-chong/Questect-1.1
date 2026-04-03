import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2, ShieldCheck, Activity, ArrowRight } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Processing() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying payment with Stripe...');
  const [isUpgraded, setIsUpgraded] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/auth');
      return;
    }

    // Listen for real-time plan updates in Firestore
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.plan && data.plan !== 'free') {
          setIsUpgraded(true);
          setStatus('Account upgraded successfully!');
          // No auto-navigation, let the user click the button
        }
      }
    });

    // Fallback message after some time
    const timer = setTimeout(() => {
      if (!isUpgraded) {
        setStatus('Still waiting for payment confirmation. This may take a few minutes depending on your bank.');
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [navigate, isUpgraded]);

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
        <div className="flex flex-col items-center gap-8">
          {isUpgraded ? (
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
              <ShieldCheck className="text-green-400" size={40} />
            </div>
          ) : (
            <div className="relative">
              <Loader2 className="w-20 h-20 text-[#00FFFF] animate-spin opacity-20" />
              <Activity className="absolute inset-0 m-auto text-[#00FFFF] animate-pulse" size={32} />
            </div>
          )}
          
          <div className="space-y-4">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
              {isUpgraded ? 'Upgrade Complete' : 'Processing Upgrade'}
            </h2>
            <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em] leading-relaxed min-h-[3em]">
              {status}
            </p>
          </div>

          {!isUpgraded && (
            <div className="w-full space-y-4">
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#00FFFF] to-transparent"
                />
              </div>
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                Do not refresh this page. Your session is being monitored.
              </p>
            </div>
          )}

          {isUpgraded && (
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-3 group"
            >
              <span className="uppercase tracking-widest text-xs font-black">Enter Dashboard</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
