import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, Mail, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CONTACT_EMAIL } from '../../lib/constants';
import { auth } from '../../lib/firebase';

interface PremiumUnavailableModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
}

export default function PremiumUnavailableModal({ isOpen, onClose, planName }: PremiumUnavailableModalProps) {
  const navigate = useNavigate();

  const handleContinueFree = () => {
    const user = auth.currentUser;
    if (user) {
      navigate('/analyze');
    } else {
      navigate('/auth');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#001220]/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-[#001220] border border-white/10 rounded-3xl p-10 relative z-10 shadow-[0_0_50px_rgba(0,255,255,0.1)]"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-[#8A2BE2]/10 rounded-full flex items-center justify-center mb-8 border border-[#8A2BE2]/20">
                <AlertCircle className="text-[#00FFFF] animate-pulse" size={40} />
              </div>

              <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                {planName} Plan
              </h3>
              <p className="text-[#00FFFF] text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                Infrastructure Status: Pending Verification
              </p>
              
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-10 w-full">
                <p className="text-white/60 text-sm font-medium leading-relaxed">
                  Payments are temporarily unavailable while Questect's Stripe verification is being finalized. This paid plan will be available soon.
                </p>
              </div>

              <div className="flex flex-col gap-4 w-full">
                <button 
                  onClick={handleContinueFree}
                  className="w-full py-4 bg-gradient-to-r from-[#00FFFF] to-[#8A2BE2] text-[#001220] rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Continue with Free Plan
                  <ArrowRight size={14} />
                </button>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={onClose}
                    className="py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Close
                  </button>
                  <a 
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Mail size={12} />
                    Support
                  </a>
                </div>
              </div>
              
              <p className="mt-8 text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">
                Questect Intelligent Infrastructure
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
