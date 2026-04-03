import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  children: React.ReactNode;
  lastUpdated?: string;
}

export default function LegalLayout({ title, children, lastUpdated }: LegalLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#001220] text-slate-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Navigation */}
      <div className="fixed top-0 left-0 w-full p-6 z-50">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 px-4 py-2 border border-cyan-400/30 rounded-lg text-cyan-400 font-black uppercase tracking-widest text-xs hover:bg-cyan-400/10 transition-all active:scale-95"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Close / Back
        </button>
      </div>

      {/* Content */}
      <div className="pt-24 pb-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[800px] mx-auto bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-8 md:p-12 shadow-2xl shadow-cyan-900/20"
        >
          <header className="mb-12 border-b border-cyan-400/10 pb-8">
            <h1 className="text-cyan-400 font-black uppercase tracking-[0.2em] text-3xl md:text-4xl mb-4">
              {title}
            </h1>
            {lastUpdated && (
              <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">
                Last Updated: {lastUpdated}
              </p>
            )}
          </header>

          <div className="prose prose-invert prose-cyan max-w-none text-lg leading-relaxed space-y-6">
            {children}
          </div>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <footer className="py-12 text-center border-t border-cyan-400/5">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">
            QUESTECT LEGAL DEPARTMENT
          </span>
        </div>
      </footer>
    </div>
  );
}
