import React from 'react';
import { motion } from 'motion/react';
import { Heart, ShieldCheck, Sparkles } from 'lucide-react';
import { APP_NAME } from '../lib/constants';

export default function About() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 relative overflow-hidden bg-oxford-blue">
      {/* Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] glow-ambient-purple blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] glow-ambient-cyan blur-[150px] opacity-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-24"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter uppercase">The Soul</h2>
          <p className="text-electric-cyan text-2xl font-black italic tracking-tighter">"Global Standards. Local Precision."</p>
        </motion.div>

        <div className="space-y-24">
          <section>
            <div className="flex items-center gap-6 mb-8">
              <div className="w-14 h-14 bg-electric-purple/10 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="text-electric-purple" size={28} />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Mission Statement</h3>
            </div>
            <p className="text-white/60 text-xl leading-relaxed font-medium">
              {APP_NAME} was born from a simple observation: teachers are drowning in paperwork. 
              Our mission is to liberate educators from the mechanical burden of grading, 
              allowing them to return to what truly matters—inspiring and communicating with students. 
              We believe that by automating the "what" and "how much," we give teachers back the time to focus on the "why."
            </p>
          </section>

          <section>
            <div className="flex items-center gap-6 mb-8">
              <div className="w-14 h-14 bg-electric-purple/10 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="text-electric-purple" size={28} />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Tech Purity</h3>
            </div>
            <p className="text-white/60 text-xl leading-relaxed font-medium">
              We don't just use AI; we refine it. {APP_NAME} leverages custom-optimized models like DeepSeek, 
              specifically tuned for the educational vertical. Our models are trained to understand 
              not just the correctness of an answer, but the pedagogical intent behind it. 
              This ensures that our feedback is as constructive as it is accurate.
            </p>
          </section>

          <section className="brand-gradient-border glow-purple">
            <div className="glass-card p-12 border border-white/5">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-14 h-14 bg-electric-purple/10 rounded-2xl flex items-center justify-center shadow-lg">
                  <ShieldCheck className="text-electric-purple" size={28} />
                </div>
                <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Product-First Independence</h3>
              </div>
              <p className="text-white/60 text-xl leading-relaxed font-medium">
                {APP_NAME} is a purely product-focused entity. We are independent of external agencies 
                or institutional bureaucracies. This independence allows us to move fast, 
                innovate without compromise, and keep our focus exactly where it belongs: 
                on the teachers and students who use our platform every day.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
