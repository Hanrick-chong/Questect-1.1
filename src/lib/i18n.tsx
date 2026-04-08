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

  // Pricing Page
  pricing_title: { en: 'The Metabolism', zh: '运行机制', bm: 'Metabolisme' },
  pricing_subtitle: { en: 'Questect Infrastructure Plans', zh: 'Questect 基础设施计划', bm: 'Pelan Infrastruktur Questect' },
  pricing_tier_educator: { en: 'Individual Educator', zh: '个人教育者', bm: 'Pendidik Individu' },
  pricing_tier_institution: { en: 'School Institution', zh: '学校机构', bm: 'Institusi Sekolah' },
  pricing_current_plan: { en: 'Current Plan', zh: '当前计划', bm: 'Pelan Semasa' },
  pricing_contact_sales: { en: 'Contact Sales', zh: '联系销售', bm: 'Hubungi Jualan' },
  pricing_view_availability: { en: 'View Availability', zh: '查看可用性', bm: 'Lihat Ketersediaan' },
  pricing_choose_plan: { en: 'Choose {plan}', zh: '选择 {plan}', bm: 'Pilih {plan}' },
  pricing_popular: { en: 'Popular', zh: '热门', bm: 'Popular' },
  pricing_per_month: { en: '/mo', zh: '/月', bm: '/bln' },

  // Features Page
  features_title: { en: 'Advanced Capabilities', zh: '先进功能', bm: 'Keupayaan Lanjutan' },
  features_subtitle: { en: 'Engineered for Precision Grading', zh: '专为精准评分而设计', bm: 'Direka untuk Pemarkahan Tepat' },
  feat_hybrid_title: { en: 'Hybrid Scoring Engine', zh: '混合评分引擎', bm: 'Enjin Pemarkahan Hibrid' },
  feat_hybrid_desc: { en: 'Combines strict marking schemes with deep logical reasoning for human-like accuracy.', zh: '将严格的评分标准与深层逻辑推理相结合，实现类人精度。', bm: 'Menggabungkan skema pemarkahan yang ketat dengan penaakulan logik yang mendalam untuk ketepatan seperti manusia.' },
  feat_ocr_title: { en: 'Smart Scan (OCR)', zh: '智能扫描 (OCR)', bm: 'Imbasan Pintar (OCR)' },
  feat_ocr_desc: { en: 'Advanced handwriting recognition that turns messy scripts into structured data.', zh: '先进的手写识别技术，将凌乱的手稿转化为结构化数据。', bm: 'Pengecaman tulisan tangan lanjutan yang menukar skrip yang tidak kemas kepada data berstruktur.' },
  feat_syllabus_title: { en: 'Syllabus Sync', zh: '教学大纲同步', bm: 'Penyelarasan Sukatan Pelajaran' },
  feat_syllabus_desc: { en: 'Native support for SPM, IGCSE, and regional standards with automatic logic alignment.', zh: '原生支持 SPM、IGCSE 和区域标准，并具有自动逻辑对齐功能。', bm: 'Sokongan asli untuk SPM, IGCSE, dan piawaian serantau dengan penyelarasan logik automatik.' },
  feat_feedback_title: { en: 'Fine-Grained Feedback', zh: '细粒度反馈', bm: 'Maklum Balas Terperinci' },
  feat_feedback_desc: { en: 'Detailed point-by-point analysis showing exactly where marks were earned or lost.', zh: '详细的逐点分析，准确显示得分或失分的地方。', bm: 'Analisis terperinci mengikut mata menunjukkan dengan tepat di mana markah diperoleh atau hilang.' },
  feat_profiling_title: { en: 'Student Profiling', zh: '学生画像', bm: 'Pemprofilan Pelajar' },
  feat_profiling_desc: { en: 'AI-driven progress tracking and weakness identification across multiple assessments.', zh: '人工智能驱动的进度跟踪和跨多项评估的弱点识别。', bm: 'Penjejakan kemajuan dipacu AI dan pengenalpastian kelemahan merentas pelbagai penilaian.' },
  feat_analytics_title: { en: 'Class Analytics', zh: '班级分析', bm: 'Analisis Kelas' },
  feat_analytics_desc: { en: 'Instant reports on class-wide performance trends and common misconception areas.', zh: '关于全班表现趋势和常见误区领域的即时报告。', bm: 'Laporan segera mengenai trend prestasi seluruh kelas dan kawasan salah faham biasa.' },

  // About Page
  about_title: { en: 'Our Mission', zh: '我们的使命', bm: 'Misi Kami' },
  about_subtitle: { en: 'Revolutionizing Education through AI', zh: '通过人工智能革新教育', bm: 'Merevolusikan Pendidikan melalui AI' },
  about_mission_title: { en: 'Mission Statement', zh: '使命宣言', bm: 'Kenyataan Misi' },
  about_mission_desc: { en: '{appName} was born from a simple observation: teachers are drowning in paperwork. Our mission is to liberate educators from the mechanical burden of grading, allowing them to return to what truly matters—inspiring and communicating with students. We believe that by automating the "what" and "how much," we give teachers back the time to focus on the "why."', zh: '{appName} 源于一个简单的观察：教师们正淹没在文书工作中。我们的使命是将教育工作者从机械的评分负担中解放出来，让他们回到真正重要的事情上——启发学生并与学生交流。我们相信，通过自动化“什么”和“多少”，我们让教师有时间专注于“为什么”。', bm: '{appName} lahir daripada pemerhatian mudah: guru-guru lemas dalam kerja kertas. Misi kami adalah untuk membebaskan pendidik daripada beban mekanikal pemarkahan, membolehkan mereka kembali kepada perkara yang benar-benar penting—memberi inspirasi dan berkomunikasi dengan pelajar. Kami percaya bahawa dengan mengautomasikan "apa" dan "berapa banyak," kami memberi guru kembali masa untuk fokus pada "mengapa".' },
  about_tech_title: { en: 'Tech Purity', zh: '技术纯度', bm: 'Ketulenan Teknologi' },
  about_tech_desc: { en: "We don't just use AI; we refine it. {appName} leverages custom-optimized models like DeepSeek, specifically tuned for the educational vertical. Our models are trained to understand not just the correctness of an answer, but the pedagogical intent behind it. This ensures that our feedback is as constructive as it is accurate.", zh: "我们不只是使用人工智能；我们还在完善它。{appName} 利用 DeepSeek 等定制优化的模型，专门针对教育垂直领域进行了调整。我们的模型经过训练，不仅能理解答案的正确性，还能理解其背后的教学意图。这确保了我们的反馈既建设性又准确。", bm: "Kami bukan sahaja menggunakan AI; kami memperhalusinya. {appName} memanfaatkan model yang dioptimumkan tersuai seperti DeepSeek, ditala khusus untuk vertikal pendidikan. Model kami dilatih untuk memahami bukan sahaja ketepatan jawapan, tetapi niat pedagogi di sebaliknya. Ini memastikan maklum balas kami adalah membina dan tepat." },
  about_product_title: { en: 'Product-First Independence', zh: '产品优先的独立性', bm: 'Kemerdekaan Utamakan Produk' },
  about_product_desc: { en: "{appName} is a purely product-focused entity. We are independent of external agencies or institutional bureaucracies. This independence allows us to move fast, innovate without compromise, and keep our focus exactly where it belongs: on the teachers and students who use our platform every day.", zh: "{appName} 是一个纯粹以产品为中心的实体。我们独立于外部机构或机构官僚机构。这种独立性使我们能够快速行动，在不妥协的情况下进行创新，并将我们的重点准确地放在它所属的地方：每天使用我们平台的教师和学生身上。", bm: "{appName} ialah entiti yang memfokuskan produk semata-mata. Kami bebas daripada agensi luar atau birokrasi institusi. Kemerdekaan ini membolehkan kami bergerak pantas, berinovasi tanpa kompromi, dan mengekalkan fokus kami tepat pada tempatnya: pada guru dan pelajar yang menggunakan platform kami setiap hari." },

  // Auth Page
  auth_welcome_back: { en: 'Welcome Back', zh: '欢迎回来', bm: 'Selamat Kembali' },
  auth_create_account: { en: 'Create Account', zh: '创建账户', bm: 'Cipta Akaun' },
  auth_sign_in_google: { en: 'Sign in with Google', zh: '使用 Google 登录', bm: 'Log masuk dengan Google' },
  auth_email_label: { en: 'Email Address', zh: '电子邮件地址', bm: 'Alamat Emel' },
  auth_password_label: { en: 'Password', zh: '密码', bm: 'Kata Laluan' },
  auth_forgot_password: { en: 'Forgot Password?', zh: '忘记密码？', bm: 'Lupa Kata Laluan?' },

  // Dashboard
  dash_title: { en: 'Questect Dashboard', zh: 'Questect 控制面板', bm: 'Papan Pemuka Questect' },
  dash_inst_title: { en: 'Institution Control', zh: '机构管理', bm: 'Kawalan Institusi' },
  dash_back_workspace: { en: 'Back to Workspace', zh: '返回工作区', bm: 'Kembali ke Ruang Kerja' },
  dash_tier: { en: 'tier', zh: '等级', bm: 'tahap' },
  dash_last_30: { en: 'Last 30 Days', zh: '最近30天', bm: '30 Hari Terakhir' },
  dash_export: { en: 'Export Report', zh: '导出报告', bm: 'Eksport Laporan' },
  dash_plan_free: { en: 'Basic Access Node', zh: '基础访问节点', bm: 'Nod Akses Asas' },
  dash_plan_starter: { en: 'Starter Data Center', zh: '入门级数据中心', bm: 'Pusat Data Permulaan' },
  dash_plan_pro: { en: 'Pro Analytics Engine', zh: '专业分析引擎', bm: 'Enjin Analitis Pro' },
  dash_plan_advanced: { en: 'Advanced Predictive Dashboard', zh: '高级预测控制面板', bm: 'Papan Pemuka Ramalan Lanjutan' },
  dash_plan_inst: { en: 'Institutional Analytics Engine', zh: '机构分析引擎', bm: 'Enjin Analitis Institusi' },
  dash_upsell_title: { en: 'Elevate Your Grading Infrastructure', zh: '提升您的评分基础设施', bm: 'Tingkatkan Infrastruktur Pemarkahan Anda' },
  dash_upsell_desc: { en: 'You are currently on the {plan}. Unlock full exam grading, historical archives, and advanced analytics to save up to 15 hours per week.', zh: '您目前处于 {plan}。解锁完整的考试评分、历史存档和高级分析，每周最多可节省 15 小时。', bm: 'Anda kini berada di {plan}. Buka kunci pemarkahan peperiksaan penuh, arkib sejarah, dan analitis lanjutan untuk menjimatkan sehingga 15 jam seminggu.' },
  dash_free_tier: { en: 'Free Tier', zh: '免费版', bm: 'Tahap Percuma' },
  
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

  // History Page
  history_title: { en: 'Grading Records', zh: '评分记录', bm: 'Rekod Gred' },
  history_subtitle: { en: 'Teacher History Review & Audit', zh: '教师历史审查与审计', bm: 'Semakan & Audit Sejarah Guru' },
  history_back: { en: 'Back to Workspace', zh: '返回工作区', bm: 'Kembali ke Ruang Kerja' },
  history_search_placeholder: { en: 'Search students...', zh: '搜索学生...', bm: 'Cari pelajar...' },
  history_filter_all: { en: 'All', zh: '全部', bm: 'Semua' },
  history_no_records: { en: 'No Records Found', zh: '未找到记录', bm: 'Tiada Rekod Ditemui' },
  history_no_records_desc: { en: 'Your grading history will appear here once you complete an audit.', zh: '完成审计后，您的评分历史将显示在这里。', bm: 'Sejarah gred anda akan muncul di sini setelah anda melengkapkan audit.' },
  history_start_first: { en: 'Start First Grading', zh: '开始第一次评分', bm: 'Mulakan Gred Pertama' },
  history_status_label: { en: 'Audit Status', zh: '审计状态', bm: 'Status Audit' },
  history_status_completed: { en: 'Completed', zh: '已完成', bm: 'Selesai' },
  history_pro_feature: { en: 'Pro Feature', zh: '专业版功能', bm: 'Ciri Pro' },
  history_delete_confirm: { en: 'Are you sure you want to delete this record?', zh: '您确定要删除此记录吗？', bm: 'Adakah anda pasti mahu memadamkan rekod ini?' },
  history_loading: { en: 'Accessing Archives...', zh: '正在访问存档...', bm: 'Mengakses Arkib...' },

  // Enterprise Inquiry Page
  enterprise_title: { en: 'Enterprise', zh: '企业', bm: 'Perusahaan' },
  enterprise_subtitle: { en: 'Inquiry', zh: '咨询', bm: 'Pertanyaan' },
  enterprise_desc: { en: 'Tell us about your school or institution, and we’ll help you find the right {appName} setup.', zh: '告诉我们您的学校或机构，我们将帮助您找到合适的 {appName} 设置。', bm: 'Beritahu kami tentang sekolah atau institusi anda, dan kami akan membantu anda mencari persediaan {appName} yang betul.' },
  enterprise_support_info: { en: '{appName} supports institution-oriented workflows such as multi-teacher access, class or group management, institution analytics, and custom setup discussions.', zh: '{appName} 支持以机构为中心的工作流程，如多教师访问、班级或小组管理、机构分析和自定义设置讨论。', bm: '{appName} menyokong aliran kerja berorientasikan institusi seperti akses berbilang guru, pengurusan kelas atau kumpulan, analitik institusi, dan perbincangan persediaan tersuai.' },
  enterprise_why_title: { en: 'Why {appName} Enterprise?', zh: '为什么选择 {appName} 企业版？', bm: 'Mengapa {appName} Perusahaan?' },
  enterprise_section_a: { en: 'SECTION A — CONTACT DETAILS', zh: '第一部分 — 联系详情', bm: 'SEKSYEN A — BUTIRAN HUBUNGAN' },
  enterprise_section_b: { en: 'SECTION B — INSTITUTION DETAILS', zh: '第二部分 — 机构详情', bm: 'SEKSYEN B — BUTIRAN INSTITUSI' },
  enterprise_section_c: { en: 'SECTION C — INTEREST / NEEDS', zh: '第三部分 — 兴趣 / 需求', bm: 'SEKSYEN C — MINAT / KEPERLUAN' },
  enterprise_full_name: { en: 'Full Name', zh: '全名', bm: 'Nama Penuh' },
  enterprise_work_email: { en: 'Work Email', zh: '工作邮箱', bm: 'Emel Kerja' },
  enterprise_phone: { en: 'Phone Number (optional)', zh: '电话号码（可选）', bm: 'Nombor Telefon (pilihan)' },
  enterprise_role: { en: 'Role / Position', zh: '角色 / 职位', bm: 'Peranan / Jawatan' },
  enterprise_institution_name: { en: 'Institution / School Name', zh: '机构 / 学校名称', bm: 'Nama Institusi / Sekolah' },
  enterprise_institution_type: { en: 'Institution Type', zh: '机构类型', bm: 'Jenis Institusi' },
  enterprise_team_size: { en: 'Estimated Team Size', zh: '预计团队规模', bm: 'Anggaran Saiz Pasukan' },
  enterprise_academic_context: { en: 'Main Exam / Academic Context', zh: '主要考试 / 学术背景', bm: 'Peperiksaan Utama / Konteks Akademik' },
  enterprise_message: { en: 'Message', zh: '留言', bm: 'Mesej' },
  enterprise_submit: { en: 'Submit Inquiry', zh: '提交咨询', bm: 'Hantar Pertanyaan' },
  enterprise_submitting: { en: 'Submitting your inquiry...', zh: '正在提交您的咨询...', bm: 'Menghantar pertanyaan anda...' },
  enterprise_success_title: { en: 'Inquiry Submitted', zh: '咨询已提交', bm: 'Pertanyaan Dihantar' },
  enterprise_success_desc: { en: 'Thank you. Your inquiry has been submitted successfully. Our team will review your request and contact you using the email provided.', zh: '谢谢。您的咨询已成功提交。我们的团队将审查您的请求并使用提供的电子邮件与您联系。', bm: 'Terima kasih. Pertanyaan anda telah berjaya dihantar. Pasukan kami akan menyemak permintaan anda dan menghubungi anda menggunakan emel yang diberikan.' },
  enterprise_return_home: { en: 'Return to Home', zh: '返回首页', bm: 'Kembali ke Laman Utama' },

  // Teacher Pilot Access
  pilot_title: { en: 'Teacher Pilot Access', zh: '教师试点访问', bm: 'Akses Pilot Guru' },
  pilot_desc: { en: 'Enter your invitation code to unlock premium features and increased daily limits.', zh: '输入您的邀请码以解锁高级功能并提高每日限制。', bm: 'Masukkan kod jemputan anda untuk membuka kunci ciri premium dan peningkatan had harian.' },
  pilot_input_placeholder: { en: 'Enter Invitation Code', zh: '输入邀请码', bm: 'Masukkan Kod Jemputan' },
  pilot_apply_btn: { en: 'Apply Code', zh: '应用代码', bm: 'Gunakan Kod' },
  pilot_status_active: { en: 'Active', zh: '激活', bm: 'Aktif' },
  pilot_status_expired: { en: 'Expired', zh: '已过期', bm: 'Tamat Tempoh' },
  pilot_start_date: { en: 'Start Date', zh: '开始日期', bm: 'Tarikh Mula' },
  pilot_end_date: { en: 'End Date', zh: '结束日期', bm: 'Tarikh Tamat' },
  pilot_daily_usage: { en: 'Daily Usage', zh: '每日用量', bm: 'Penggunaan Harian' },
  pilot_premium_unlocked: { en: 'Premium Dashboard Unlocked', zh: '高级控制面板已解锁', bm: 'Papan Pemuka Premium Dibuka' },
  pilot_error_invalid: { en: 'Invalid or inactive invitation code.', zh: '邀请码无效或未激活。', bm: 'Kod jemputan tidak sah atau tidak aktif.' },
  pilot_error_used: { en: 'This code has already been used.', zh: '此代码已被使用。', bm: 'Kod ini telah digunakan.' },
  pilot_success: { en: 'Invitation code applied successfully!', zh: '邀请码应用成功！', bm: 'Kod jemputan berjaya digunakan!' },
  pilot_limit_reached: { en: 'Daily usage limit reached ({limit}). Please try again tomorrow.', zh: '已达到每日使用限制 ({limit})。请明天再试。', bm: 'Had penggunaan harian dicapai ({limit}). Sila cuba lagi esok.' },
  pilot_remaining_days: { en: 'Remaining Days', zh: '剩余天数', bm: 'Hari Tersisa' },
  pilot_days: { en: 'Days', zh: '天', bm: 'Hari' },
  pilot_uses_today: { en: 'Uses Today', zh: '今日使用', bm: 'Penggunaan Hari Ini' },
  pilot_unlocked: { en: 'Unlocked', zh: '已解锁', bm: 'Dibuka' },
  pilot_privileges: { en: 'Active Pilot Privileges', zh: '激活试点特权', bm: 'Keistimewaan Pilot Aktif' },
  pilot_feature_batch: { en: 'Unlimited Batch Processing', zh: '无限批量处理', bm: 'Pemprosesan Kelompok Tanpa Had' },
  pilot_feature_archive: { en: 'Advanced Historical Archive', zh: '高级历史存档', bm: 'Arkib Sejarah Lanjutan' },
  pilot_feature_priority: { en: 'Priority AI Infrastructure', zh: '优先 AI 基础设施', bm: 'Infrastruktur AI Keutamaan' },
  pilot_error_expired: { en: 'This code has expired.', zh: '此代码已过期。', bm: 'Kod ini telah tamat tempoh.' },
  pilot_error_disabled: { en: 'This code has been disabled.', zh: '此代码已被禁用。', bm: 'Kod ini telah dinyahaktifkan.' },
  pilot_error_already_active: { en: 'Teacher Pilot Access is already active on this account.', zh: '此账户的教师试点访问已激活。', bm: 'Akses Pilot Guru sudah aktif pada akaun ini.' },

  // Account & Access
  account_access_title: { en: 'Account & Access', zh: '账户与访问', bm: 'Akaun & Akses' },
  account_access_desc: { en: 'Manage your institutional credentials and invitation codes.', zh: '管理您的机构凭据和邀请码。', bm: 'Urus kredensial institusi dan kod jemputan anda.' },
  account_invitation_code: { en: 'Invitation Code', zh: '邀请码', bm: 'Kod Jemputan' },
  account_enter_code: { en: 'ENTER TEACHER PILOT CODE', zh: '输入教师试点代码', bm: 'MASUKKAN KOD PILOT GURU' },
  
  // Workspace
  work_trials: { en: 'Trials', zh: '试用', bm: 'Percubaan' },
  work_unlimited_free: { en: 'Unlimited Free', zh: '无限免费', bm: 'Percuma Tanpa Had' },
  work_institution: { en: 'Institution', zh: '机构', bm: 'Institusi' },
  work_history: { en: 'History', zh: '历史', bm: 'Sejarah' },
  work_reset: { en: 'Reset', zh: '重置', bm: 'Set Semula' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
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

  const t = (key: string, params?: Record<string, string>): string => {
    if (!translations[key]) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    let text = translations[key][language];
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
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
