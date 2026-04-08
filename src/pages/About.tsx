import React from 'react';
import { motion } from 'motion/react';
import { Heart, ShieldCheck, Sparkles } from 'lucide-react';
import { APP_NAME } from '../lib/constants';
import { useLanguage } from '../lib/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function About() {
  const { t } = useLanguage();
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
          <div className="flex justify-end mb-8">
            <LanguageSwitcher />
          </div>
          <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter uppercase">{t('about_title')}</h2>
          <p className="text-electric-cyan text-2xl font-black italic tracking-tighter">"{t('home_hero_title')}"</p>
        </motion.div>

        <div className="space-y-24">
          <section>
            <div className="flex items-center gap-6 mb-8">
              <div className="w-14 h-14 bg-electric-purple/10 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="text-electric-purple" size={28} />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase">{t('about_mission_title')}</h3>
            </div>
            <p className="text-white/60 text-xl leading-relaxed font-medium">
              {t('about_mission_desc').replace('{appName}', APP_NAME)}
            </p>
          </section>

          <section>
            <div className="flex items-center gap-6 mb-8">
              <div className="w-14 h-14 bg-electric-purple/10 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="text-electric-purple" size={28} />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase">{t('about_tech_title')}</h3>
            </div>
            <p className="text-white/60 text-xl leading-relaxed font-medium">
              {t('about_tech_desc').replace('{appName}', APP_NAME)}
            </p>
          </section>

          <section className="brand-gradient-border glow-purple">
            <div className="glass-card p-12 border border-white/5">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-14 h-14 bg-electric-purple/10 rounded-2xl flex items-center justify-center shadow-lg">
                  <ShieldCheck className="text-electric-purple" size={28} />
                </div>
                <h3 className="text-3xl font-black text-white tracking-tighter uppercase">{t('about_product_title')}</h3>
              </div>
              <p className="text-white/60 text-xl leading-relaxed font-medium">
                {t('about_product_desc').replace('{appName}', APP_NAME)}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
