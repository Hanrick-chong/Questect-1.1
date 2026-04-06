import React from 'react';
import { useLanguage } from '../lib/i18n';
import { Globe } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'zh', label: '中文' },
    { code: 'bm', label: 'BM' },
  ];

  return (
    <div className="flex items-center gap-3">
      <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code as any)}
            className={cn(
              "px-3 py-1.5 rounded-md text-[10px] font-black tracking-widest transition-all",
              language === lang.code 
                ? "bg-[#00FFFF] text-[#001220] shadow-[0_0_15px_rgba(0,255,255,0.3)]" 
                : "text-white/40 hover:text-white/80"
            )}
          >
            {lang.label}
          </button>
        ))}
      </div>
      <Globe size={14} className="text-white/20" />
    </div>
  );
}
