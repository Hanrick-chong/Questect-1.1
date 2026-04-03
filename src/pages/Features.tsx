import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Scan, Target, BarChart3, Layers, Globe } from 'lucide-react';
import { APP_NAME } from '../lib/constants';

export default function Features() {
  const features = [
    {
      title: "Hybrid Scoring Engine",
      desc: "Combines strict marking schemes with deep logical reasoning for human-like accuracy.",
      icon: Cpu,
      size: "md:col-span-2"
    },
    {
      title: "Smart Scan (OCR)",
      desc: "Advanced handwriting recognition that turns messy scripts into structured data.",
      icon: Scan,
      size: "md:col-span-1"
    },
    {
      title: "Syllabus Sync",
      desc: "Native support for SPM, IGCSE, and regional standards with automatic logic alignment.",
      icon: Globe,
      size: "md:col-span-1"
    },
    {
      title: "Fine-Grained Feedback",
      desc: "Detailed point-by-point analysis showing exactly where marks were earned or lost.",
      icon: Target,
      size: "md:col-span-2"
    },
    {
      title: "Student Profiling",
      desc: "AI-driven progress tracking and weakness identification across multiple assessments.",
      icon: BarChart3,
      size: "md:col-span-1"
    },
    {
      title: "Class Analytics",
      desc: "Instant reports on class-wide performance trends and common misconception areas.",
      icon: Layers,
      size: "md:col-span-2"
    }
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 relative overflow-hidden bg-oxford-blue">
      {/* Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] glow-ambient-purple blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] glow-ambient-cyan blur-[150px] opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter uppercase">The Muscle</h2>
          <p className="text-white/40 text-lg font-black uppercase tracking-[0.4em] mb-10">{APP_NAME} Core Technology</p>
          <p className="text-white/40 text-xl font-medium tracking-wide">Precision-engineered tools for the modern educator.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={f.size + " brand-gradient-border group"}
            >
              <div className="glass-card p-10 h-full border border-white/5">
                <f.icon className="text-electric-purple mb-8 group-hover:scale-110 transition-transform" size={40} />
                <h3 className="text-2xl font-black mb-4 text-electric-cyan tracking-tighter uppercase">{f.title}</h3>
                <p className="text-white/50 leading-relaxed font-medium">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
