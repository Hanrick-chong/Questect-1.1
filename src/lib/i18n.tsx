import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'zh' | 'bm';

interface Translations {
  [key: string]: {
    [K in Language]: string;
  };
}

const translations: Translations = {
  // Navigation
  nav_dashboard: { en: 'Dashboard', zh: '控制面板', bm: 'Papan Pemuka' },
  nav_workspace: { en: 'Workspace', zh: '工作区', bm: 'Ruang Kerja' },
  nav_history: { en: 'History', zh: '历史记录', bm: 'Sejarah' },
  nav_billing: { en: 'Billing', zh: '账单', bm: 'Pengebilan' },
  nav_pricing: { en: 'Pricing', zh: '价格', bm: 'Harga' },
  nav_features: { en: 'Features', zh: '功能', bm: 'Ciri-ciri' },
  nav_about: { en: 'About', zh: '关于', bm: 'Tentang' },
  nav_login: { en: 'Login', zh: '登录', bm: 'Log Masuk' },
  nav_signup: { en: 'Sign Up', zh: '注册', bm: 'Daftar' },
  nav_logout: { en: 'Logout', zh: '退出', bm: 'Log Keluar' },
  nav_get_started: { en: 'Get Started', zh: '开始使用', bm: 'Mula Sekarang' },
  nav_sign_out: { en: 'Sign Out', zh: '登出', bm: 'Log Keluar' },

  // Common
  common_share: { en: 'Share', zh: '分享', bm: 'Kongsi' },
  common_copied: { en: 'Copied!', zh: '已复制！', bm: 'Disalin!' },

  // Home Page
  home_hero_title: { en: 'Global Standards. Local Precision.', zh: '全球标准。本地精度。', bm: 'Standard Global. Ketepatan Tempatan.' },
  home_hero_subtitle: { en: 'The intelligent minimalist grading platform for modern educators. Empowering teachers with AI-driven insights and unparalleled efficiency.', zh: '为现代教育工作者打造的智能极简评分平台。通过人工智能驱动的洞察力和无与伦比的效率为教师赋能。', bm: 'Platform pemarkahan minimalis pintar untuk pendidik moden. Memperkasakan guru dengan wawasan dipacu AI dan kecekapan yang tiada tandingan.' },
  home_start_grading: { en: 'Start Grading', zh: '开始评分', bm: 'Mula Menanda' },
  home_explore_features: { en: 'Explore Features', zh: '探索功能', bm: 'Terokai Ciri' },
  home_analyze_title: { en: 'Unlimited Full Page Grader', zh: '无限全页评分器', bm: 'Penanda Halaman Penuh Tanpa Had' },
  home_analyze_desc: { en: 'Upload as many photos or PDFs as you want. Our AI provides meticulous, question-by-question feedback for every page with zero limits and maximum efficiency.', zh: '随心所欲上传照片或 PDF。我们的人工智能为每一页提供细致的、逐题的反馈，零限制，效率最高。', bm: 'Muat naik seberapa banyak foto atau PDF yang anda mahu. AI kami memberikan maklum balas yang teliti, soalan demi soalan untuk setiap halaman dengan sifar had dan kecekapan maksimum.' },
  home_system_title: { en: 'Full Paper Examination System', zh: '全卷考试系统', bm: 'Sistem Peperiksaan Kertas Penuh' },
  home_system_desc: { en: 'Advanced support for multi-page uploads and high-complexity exam structures. Comprehensive grading for full-length papers, perfectly aligned with SPM, IGCSE, and more.', zh: '对多页上传和高复杂度考试结构的先进支持。对全长试卷进行全面评分，与 SPM、IGCSE 等完美契合。', bm: 'Sokongan lanjutan untuk muat naik berbilang halaman dan struktur peperiksaan yang kompleks. Pemarkahan komprehensif untuk kertas kerja penuh, sejajar dengan SPM, IGCSE dan banyak lagi.' },

  // Dashboard
  dash_title: { en: 'Questect Dashboard', zh: 'Questect 控制面板', bm: 'Papan Pemuka Questect' },
  dash_inst_title: { en: 'Institution Control', zh: '机构管理', bm: 'Kawalan Institusi' },
  dash_back_workspace: { en: 'Back to Workspace', zh: '返回工作区', bm: 'Kembali ke Ruang Kerja' },
  dash_tier: { en: 'tier', zh: '等级', bm: 'tahap' },
  dash_last_30: { en: 'Last 30 Days', zh: '最近30天', bm: '30 Hari Terakhir' },
  dash_export: { en: 'Export Report', zh: '导出报告', bm: 'Eksport Laporan' },
  
  // Modules
  mod_quick_grading: { en: 'Quick Grading', zh: '快速批改', bm: 'Gred Pantas' },
  mod_exam_grader: { en: 'Exam Grader', zh: '考试批改', bm: 'Gred Peperiksaan' },
  mod_usage_panel: { en: 'Usage Panel', zh: '使用面板', bm: 'Panel Penggunaan' },
  mod_history_archive: { en: 'Grading Archive', zh: '批改存档', bm: 'Arkib Gred' },
  mod_basic_history: { en: 'Basic History', zh: '基础历史', bm: 'Sejarah Asas' },
  mod_analytics: { en: 'Performance Trends', zh: '表现趋势', bm: 'Trend Prestasi' },
  mod_team: { en: 'Team Management', zh: '团队管理', bm: 'Pengurusan Pasukan' },
  
  // Buttons/Actions
  btn_open_quick: { en: 'Open Quick Grader', zh: '打开快速批改', bm: 'Buka Gred Pantas' },
  btn_launch_workspace: { en: 'Launch Workspace', zh: '启动工作区', bm: 'Lancar Ruang Kerja' },
  btn_try_exam: { en: 'Try Exam Grader', zh: '尝试考试批改', bm: 'Cuba Gred Peperiksaan' },
  btn_upgrade: { en: 'Upgrade', zh: '升级', bm: 'Naik Taraf' },
  btn_view_options: { en: 'View Upgrade Options', zh: '查看升级选项', bm: 'Lihat Pilihan Naik Taraf' },
  
  // Status/Labels
  status_full_access: { en: 'Full Access', zh: '完全访问', bm: 'Akses Penuh' },
  status_limited_access: { en: 'Limited Access', zh: '有限访问', bm: 'Akses Terhad' },
  label_today_audits: { en: "Today's Audits", zh: '今日审核', bm: 'Audit Hari Ini' },
  label_no_recent: { en: 'No recent audits', zh: '暂无最近审核', bm: 'Tiada audit baru' },
  
  // Grader Page
  grader_smart_scan: { en: 'Smart Scan', zh: '智能扫描', bm: 'Imbasan Pintar' },
  grader_my_device: { en: 'My Device', zh: '我的设备', bm: 'Peranti Saya' },
  grader_upload_work: { en: "Upload Student Work", zh: '上传学生作业', bm: 'Muat Naik Kerja Pelajar' },
  grader_upload_skema: { en: "Upload Marking Scheme", zh: '上传评分标准', bm: 'Muat Naik Skema Pemarkahan' },
  grader_launch_analysis: { en: 'Launch Analysis', zh: '开始分析', bm: 'Lancar Analisis' },
  grader_launch_smart_scan: { en: 'Launch Smart Scan', zh: '开始智能扫描', bm: 'Lancar Imbasan Pintar' },
  
  // Common
  common_loading: { en: 'Loading...', zh: '加载中...', bm: 'Memuatkan...' },
  common_error: { en: 'Error', zh: '错误', bm: 'Ralat' },
  common_success: { en: 'Success', zh: '成功', bm: 'Berjaya' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('questect_lang');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('questect_lang', lang);
  };

  const t = (key: string): string => {
    if (!translations[key]) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
