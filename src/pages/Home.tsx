import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, FileText, CheckCircle, Camera, FolderOpen } from 'lucide-react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { APP_NAME } from '../lib/constants';

export default function Home() {
  const navigate = useNavigate();
  const [particles, setParticles] = useState<{ id: number; left: string; duration: string; delay: string }[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/analyze');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${5 + Math.random() * 10}s`,
      delay: `${Math.random() * 5}s`,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="relative min-h-screen pt-20 overflow-hidden bg-oxford-blue">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] glow-ambient-purple blur-[120px] opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] glow-ambient-cyan blur-[150px] opacity-20 pointer-events-none" />
      
      {/* Background Particles */}
      <div className="absolute inset-0 z-0">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              bottom: '-20px',
              animationDuration: p.duration,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 brand-gradient-bg blur-[90px] opacity-20 animate-pulse" />
            <img 
              src="/questect-favicon-v3.svg" 
              alt={`${APP_NAME} Logo`} 
              className="w-28 h-28 relative z-10 mx-auto rounded-3xl shadow-[0_0_70px_rgba(208,51,255,0.45)]" 
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-tight">
            Global Standards. <br />
            <span className="text-transparent bg-clip-text brand-gradient-bg">Local Precision.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-10 font-medium leading-relaxed tracking-tight">
            The intelligent minimalist grading platform for modern educators. 
            Empowering teachers with AI-driven insights and unparalleled efficiency.
          </p>

          {/* Model Authority Section */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-12 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">Powered by</span>
              <span className="text-sm font-black text-white tracking-widest">GEMINI 3.1 PRO</span>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block" />
            <div className="flex flex-col items-center gap-2">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">Enhanced with</span>
              <span className="text-sm font-black text-white tracking-widest">GPT-4O</span>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block" />
            <div className="flex flex-col items-center gap-2">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">Optimized by</span>
              <span className="text-sm font-black text-white tracking-widest">DEEPSEEK V3</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/auth" className="btn-primary flex items-center gap-4 w-full sm:w-auto justify-center py-4 px-12 text-base">
              Start Grading <ArrowRight size={20} />
            </Link>
            <Link to="/features" className="btn-secondary w-full sm:w-auto justify-center py-4 px-12 text-base">
              Explore Features
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Entry Points (Bento Grid) */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-4">
        <motion.div
          whileHover={{ scale: 1.01, y: -2 }}
          className="brand-gradient-border group cursor-pointer glow-purple/10"
        >
          <div className="glass-card p-8 h-full flex flex-col border border-white/5">
            <div className="w-10 h-10 bg-electric-purple/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-electric-purple/20 transition-all duration-300 shadow-[0_0_20px_rgba(208,51,255,0.1)]">
              <Zap className="text-electric-purple" size={20} />
            </div>
            <h3 className="text-xl font-black mb-1 text-white tracking-tight uppercase">{APP_NAME}-A (Analyze)</h3>
            <p className="text-electric-cyan text-[11px] font-black mb-4 uppercase tracking-[0.2em]">Unlimited Full Page Grader</p>
            
            <p className="text-white/70 font-bold mb-6 text-sm md:text-[15px] leading-relaxed tracking-tight flex-grow">
              Upload as many photos or PDFs as you want. Our AI provides meticulous, question-by-question feedback for every page with zero limits and maximum efficiency.
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              <span className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                <Camera size={8} className="text-electric-cyan" /> Full-Page Scan
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                <FolderOpen size={8} className="text-electric-purple" /> Batch Upload
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                <FileText size={8} className="text-white" /> Detailed Feedback
              </span>
            </div>

            <Link to="/analyze" className="text-electric-cyan font-black flex items-center gap-2 group-hover:translate-x-2 transition-transform uppercase text-[10px] tracking-widest mt-auto">
              Launch Analyze <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01, y: -2 }}
          className="brand-gradient-border group cursor-pointer glow-cyan/10"
        >
          <div className="glass-card p-8 h-full flex flex-col border border-white/5">
            <div className="w-10 h-10 bg-electric-cyan/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-electric-cyan/20 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
              <FileText className="text-electric-cyan" size={20} />
            </div>
            <h3 className="text-xl font-black mb-1 text-white tracking-tight uppercase">{APP_NAME}-S (System)</h3>
            <p className="text-white/40 text-[11px] font-black mb-4 uppercase tracking-[0.2em]">Full Paper Examination System</p>
            <p className="text-white/70 font-bold mb-6 text-sm md:text-[15px] leading-relaxed tracking-tight flex-grow">
              Advanced support for multi-page uploads and high-complexity exam structures. Comprehensive grading for full-length papers, perfectly aligned with SPM, IGCSE, and more.
            </p>
            
            <div className="h-[26px] mb-8" /> {/* Spacer to align with badges in the left card */}

            <Link to="/system" className="text-white/70 font-black flex items-center gap-2 group-hover:translate-x-2 transition-transform group-hover:text-white uppercase text-[10px] tracking-widest mt-auto">
              Launch System <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
