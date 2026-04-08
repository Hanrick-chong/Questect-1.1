import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Scan, Target, BarChart3, Layers, Globe } from 'lucide-react';
import { APP_NAME } from '../lib/constants';
import { useLanguage } from '../lib/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Features() {
  const { t } = useLanguage();
  const features = [
    {
      title: t('feat_hybrid_title'),
      desc: t('feat_hybrid_desc'),
      icon: Cpu,
      size: "md:col-span-2"
    },
    {
      title: t('feat_ocr_title'),
      desc: t('feat_ocr_desc'),
      icon: Scan,
      size: "md:col-span-1"
    },
    {
      title: t('feat_syllabus_title'),
      desc: t('feat_syllabus_desc'),
      icon: Globe,
      size: "md:col-span-1"
    },
    {
      title: t('feat_feedback_title'),
      desc: t('feat_feedback_desc'),
      icon: Target,
      size: "md:col-span-2"
    },
    {
      title: t('feat_profiling_title'),
      desc: t('feat_profiling_desc'),
      icon: BarChart3,
      size: "md:col-span-1"
    },
    {
      title: t('feat_analytics_title'),
      desc: t('feat_analytics_desc'),
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
          <div className="flex justify-end mb-8">
            <LanguageSwitcher />
          </div>
          <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter uppercase">{t('features_title')}</h2>
          <p className="text-white/40 text-lg font-black uppercase tracking-[0.4em] mb-10">{APP_NAME} {t('features_subtitle')}</p>
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
