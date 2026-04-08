import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  School, 
  TrendingUp, 
  ArrowLeft,
  Calendar,
  Download,
  Activity,
  Shield,
  Globe,
  LayoutGrid,
  FileText,
  UserCheck,
  Clock,
  Zap,
  Crown,
  Lock,
  Ticket,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType, applyInvitationCode, isTeacherPilotActive } from '../lib/firebase';
import { collection, query, getDocs, limit, orderBy, doc, onSnapshot, where } from 'firebase/firestore';
import { APP_NAME, UserPlan, hasPlanAccess, hasPilotFeatureAccess } from '../lib/constants';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';

interface UserProfile {
  plan: string;
  teacherPilotAccess?: boolean;
  teacherPilotStartDate?: string;
  teacherPilotEndDate?: string;
  teacherPilotDailyLimit?: number;
  teacherPilotDailyUsage?: number;
  teacherPilotLastUsageDate?: string;
  teacherPilotUnlockedFeatures?: string[];
}

const MOCK_DATA = [
  { name: 'Mon', count: 45 },
  { name: 'Tue', count: 52 },
  { name: 'Wed', count: 38 },
  { name: 'Thu', count: 65 },
  { name: 'Fri', count: 48 },
  { name: 'Sat', count: 24 },
  { name: 'Sun', count: 18 },
];

const PERFORMANCE_DATA = [
  { name: 'A', value: 35 },
  { name: 'B', value: 40 },
  { name: 'C', value: 15 },
  { name: 'D', value: 7 },
  { name: 'F', value: 3 },
];

const COLORS = ['#00F0FF', '#7000FF', '#FF00A8', '#FFB800', '#FF4D4D'];

import { useLanguage } from '../lib/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [invitationCode, setInvitationCode] = useState('');
  const [applyingCode, setApplyingCode] = useState(false);
  const [pilotError, setPilotError] = useState('');
  const [pilotSuccess, setPilotSuccess] = useState('');
  const [stats, setStats] = useState({
    totalGraded: 1240,
    activeTeachers: 12,
    avgScore: 78.5,
    growth: 15.2
  });

  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          const profile = doc.data() as UserProfile;
          setUserProfile(profile);
        }
        setLoading(false);
      }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

      // Fetch recent reports
      const q = query(
        collection(db, 'reports'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(5)
      );

      const unsubscribeReports = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentReports(data);
      });

      return () => {
        unsubscribeUser();
        unsubscribeReports();
      };
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const handleApplyCode = async () => {
    if (!invitationCode.trim() || !auth.currentUser) return;
    
    setApplyingCode(true);
    setPilotError('');
    setPilotSuccess('');
    
    try {
      await applyInvitationCode(invitationCode.trim(), auth.currentUser.uid);
      setPilotSuccess(t('pilot_success'));
      setInvitationCode('');
    } catch (err: any) {
      setPilotError(t(err.message));
    } finally {
      setApplyingCode(false);
    }
  };

  const plan = (userProfile?.plan as UserPlan) || 'free';
  const isPilotActive = isTeacherPilotActive(userProfile);
  const isStarterOrAbove = hasPlanAccess(plan, 'starter');
  const isProOrAbove = hasPlanAccess(plan, 'pro') || isPilotActive;
  const isAdvancedOrAbove = hasPlanAccess(plan, 'advanced') || hasPilotFeatureAccess(userProfile, 'premium_dashboard');
  const isGrowthOrAbove = hasPlanAccess(plan, 'growth');
  const isEnterprise = plan === 'enterprise';
  const isInstitutional = isGrowthOrAbove || isEnterprise;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001220] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="text-[#00FFFF] animate-pulse" size={40} />
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">{t('common_loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#001220] pt-24 pb-12 px-4 md:px-6 relative">
      {/* Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#8A2BE2] blur-[120px] opacity-5 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-[#00FFFF] blur-[150px] opacity-5 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <button 
              onClick={() => navigate('/analyze')}
              className="flex items-center gap-2 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest mb-4 transition-colors"
            >
              <ArrowLeft size={14} /> {t('dash_back_workspace')}
            </button>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <LayoutGrid className="text-[#00FFFF]" size={32} />
              {isInstitutional ? t('dash_inst_title') : t('dash_title')}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={cn(
                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                plan === 'free' && "bg-white/5 border-white/10 text-white/40",
                plan === 'starter' && "bg-blue-500/10 border-blue-500/30 text-blue-400",
                plan === 'pro' && "bg-purple-500/10 border-purple-500/30 text-purple-400",
                plan === 'advanced' && "bg-[#00FFFF]/10 border-[#00FFFF]/30 text-[#00FFFF]",
                isInstitutional && "bg-[#8A2BE2]/10 border-[#8A2BE2]/30 text-[#8A2BE2]"
              )}>
                {plan} {t('dash_tier')}
              </span>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">
                {plan === 'free' && t('dash_plan_free')}
                {plan === 'starter' && t('dash_plan_starter')}
                {plan === 'pro' && t('dash_plan_pro')}
                {plan === 'advanced' && t('dash_plan_advanced')}
                {isInstitutional && t('dash_plan_inst')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isStarterOrAbove && (
              <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all flex items-center gap-2">
                <Calendar size={14} /> {t('dash_last_30')}
              </button>
            )}
            {isProOrAbove && (
              <button className="px-6 py-3 bg-[#00FFFF] text-[#001220] rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                <Download size={14} /> {t('dash_export')}
              </button>
            )}
          </div>
        </div>

        {/* Language Switcher Row - Specifically below Dashboard title */}
        <div className="flex justify-end mb-8">
          <LanguageSwitcher />
        </div>

        {/* Pilot Access Status Section (ONLY for active pilot users) */}
        {isPilotActive && (
          <div className="mb-12">
            <div className="glass-card p-8 border border-[#00FFFF]/20 relative overflow-hidden bg-gradient-to-br from-[#00FFFF]/5 to-transparent">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-[#00FFFF]">
                <Crown size={80} />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#00FFFF]/10 flex items-center justify-center border border-[#00FFFF]/20">
                      <Crown size={24} className="text-[#00FFFF]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-widest leading-none">
                        {t('pilot_title')}
                      </h2>
                      <p className="text-[#00FFFF] text-[10px] font-black uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
                        <CheckCircle2 size={12} /> {t('pilot_status_active')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">{t('pilot_end_date')}</p>
                      <p className="text-sm font-black text-white uppercase tracking-widest">
                        {new Date(userProfile?.teacherPilotEndDate || '').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">{t('pilot_remaining_days')}</p>
                      <p className="text-sm font-black text-[#00FFFF] uppercase tracking-widest">
                        {Math.max(0, Math.ceil((new Date(userProfile?.teacherPilotEndDate || '').getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} {t('pilot_days')}
                      </p>
                    </div>
                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">{t('pilot_daily_usage')}</p>
                      <p className="text-sm font-black text-white uppercase tracking-widest">
                        {userProfile?.teacherPilotDailyUsage || 0} / {userProfile?.teacherPilotDailyLimit || 20} {t('pilot_uses_today')}
                      </p>
                    </div>
                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">{t('pilot_premium_unlocked')}</p>
                      <p className="text-xs font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={14} /> {t('pilot_unlocked')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:block border-l border-white/5 pl-12">
                  <p className="text-[11px] font-black text-white/40 uppercase tracking-widest mb-6">{t('pilot_privileges')}</p>
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-[#00FFFF]/10 flex items-center justify-center">
                        <CheckCircle2 size={16} className="text-[#00FFFF]" />
                      </div>
                      <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{t('pilot_feature_batch')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-[#00FFFF]/10 flex items-center justify-center">
                        <CheckCircle2 size={16} className="text-[#00FFFF]" />
                      </div>
                      <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{t('pilot_feature_archive')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-[#00FFFF]/10 flex items-center justify-center">
                        <CheckCircle2 size={16} className="text-[#00FFFF]" />
                      </div>
                      <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{t('pilot_feature_priority')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          
          {/* Module: Quick Grading (Free+) */}
          <div className="glass-card p-8 border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-[#00FFFF]">
              <Zap size={48} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap size={16} className="text-[#00FFFF]" />
              {t('mod_quick_grading')}
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{t('label_today_audits')}</p>
                  <h4 className="text-3xl font-black text-white tracking-tighter">24</h4>
                </div>
                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">+12%</span>
              </div>
              <button onClick={() => navigate('/grader/quick')} className="w-full py-3 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
                {t('btn_open_quick')}
              </button>
            </div>
          </div>

          {/* Module: Exam Grader (Free: Limited, Starter+: Full) */}
          <div className="glass-card p-8 border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-[#8A2BE2]">
              <FileText size={48} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText size={16} className="text-[#8A2BE2]" />
              {t('mod_exam_grader')}
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Status</p>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                  isStarterOrAbove ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                )}>
                  {isStarterOrAbove ? t('status_full_access') : t('status_limited_access')}
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#8A2BE2] w-[60%]" />
              </div>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                {isStarterOrAbove ? 'Unlimited batch processing active' : '5 trials remaining for today'}
              </p>
              <button onClick={() => navigate('/grader/exam')} className="w-full py-3 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
                {isStarterOrAbove ? t('btn_launch_workspace') : t('btn_try_exam')}
              </button>
            </div>
          </div>

          {/* Module: Usage Panel (Starter+) */}
          <div className={cn(
            "glass-card p-8 border border-white/10 relative overflow-hidden group transition-all",
            !isStarterOrAbove && "opacity-60 grayscale-[0.5]"
          )}>
            <div className="absolute top-0 right-0 p-4 opacity-5 text-[#00FFFF]">
              <Activity size={48} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={16} className="text-[#00FFFF]" />
              {t('mod_usage_panel')}
            </h3>
            
            {isStarterOrAbove ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">OCR Usage</p>
                    <h4 className="text-xl font-black text-white tracking-tighter">84%</h4>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">AI Tokens</p>
                    <h4 className="text-xl font-black text-white tracking-tighter">12.4k</h4>
                  </div>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00FFFF] w-[84%]" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Lock size={20} className="text-white/20" />
                </div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Usage Panel Locked</p>
                <button 
                  onClick={() => navigate('/pricing')}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded text-[8px] font-black text-[#00FFFF] uppercase tracking-widest hover:bg-[#00FFFF]/10 transition-all"
                >
                  Upgrade to Starter
                </button>
              </div>
            )}
          </div>

          {/* Module: History & Archive (Free/Starter: Basic, Pro+: Full) */}
          <div className="glass-card p-8 border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-purple-500">
              <Clock size={48} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock size={16} className="text-purple-500" />
              {isProOrAbove ? t('mod_history_archive') : t('mod_basic_history')}
            </h3>
            <div className="space-y-3">
              {recentReports.length > 0 ? (
                recentReports.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10" onClick={() => navigate(`/analyze?reportId=${item.id}`)}>
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-tight truncate max-w-[120px]">
                      {item.studentName || 'Student'}
                    </span>
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                      {item.timestamp?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest text-center py-4">{t('label_no_recent')}</p>
              )}
              
              {isProOrAbove ? (
                <button onClick={() => navigate('/history')} className="w-full mt-2 py-2 text-[8px] font-black text-[#00FFFF] uppercase tracking-widest hover:underline">
                  Search Full Archive
                </button>
              ) : (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2">Pro tier required for full archive</p>
                  <button onClick={() => navigate('/pricing')} className="text-[8px] font-black text-[#8A2BE2] uppercase tracking-widest hover:underline flex items-center gap-1">
                    <Lock size={8} /> Upgrade to Unlock
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Module: Analytics & Trends (Advanced+) */}
          <div className={cn(
            "glass-card p-8 border border-white/10 relative overflow-hidden group transition-all",
            !isAdvancedOrAbove && "opacity-60 grayscale-[0.5]"
          )}>
            <div className="absolute top-0 right-0 p-4 opacity-5 text-red-500">
              <TrendingUp size={48} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-red-500" />
              {t('mod_analytics')}
            </h3>
            
            {isAdvancedOrAbove ? (
              <>
                <div className="h-[120px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_DATA.slice(0, 5)}>
                      <Area type="monotone" dataKey="count" stroke="#FF4D4D" fill="#FF4D4D" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Predictive Accuracy</p>
                  <span className="text-[10px] font-black text-[#00FFFF] uppercase tracking-widest">98.2%</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Lock size={20} className="text-white/20" />
                </div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Advanced Analytics Locked</p>
                <button 
                  onClick={() => navigate('/pricing')}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded text-[8px] font-black text-[#00FFFF] uppercase tracking-widest hover:bg-[#00FFFF]/10 transition-all"
                >
                  Upgrade to Advanced
                </button>
              </div>
            )}
          </div>

          {/* Module: Institution/Team (Growth+) */}
          <div className={cn(
            "glass-card p-8 border border-white/10 relative overflow-hidden group transition-all",
            !isInstitutional && "opacity-60 grayscale-[0.5]"
          )}>
            <div className="absolute top-0 right-0 p-4 opacity-5 text-orange-500">
              <Users size={48} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users size={16} className="text-orange-500" />
              {t('mod_team')}
            </h3>
            
            {isInstitutional ? (
              <div className="space-y-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white/10 border border-[#001220] flex items-center justify-center text-[8px] font-black text-white/40">
                      T{i}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full bg-[#00FFFF]/20 border border-[#001220] flex items-center justify-center text-[8px] font-black text-[#00FFFF]">
                    +8
                  </div>
                </div>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">12 Active Teachers in Department</p>
                <button className="w-full py-2 bg-orange-500/10 border border-orange-500/20 rounded text-[8px] font-black text-orange-400 uppercase tracking-widest hover:bg-orange-500/20 transition-all">
                  Manage Institution
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Lock size={20} className="text-white/20" />
                </div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Institution Oversight Locked</p>
                <button 
                  onClick={() => navigate('/pricing')}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded text-[8px] font-black text-[#8A2BE2] uppercase tracking-widest hover:bg-[#8A2BE2]/10 transition-all"
                >
                  Upgrade to Growth
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Account & Access Section (ONLY for non-pilot users) */}
        {!isPilotActive && (
          <div className="mb-12">
            <div className="glass-card p-8 border border-white/10 relative overflow-hidden bg-white/[0.02]">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-white">
                <Users size={80} />
              </div>
              
              <div className="max-w-xl">
                <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-2 flex items-center gap-3">
                  <Users size={18} className="text-white/40" />
                  {t('account_access_title')}
                </h2>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-8">
                  {t('account_access_desc')}
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-3 block">
                      {t('account_invitation_code')}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="text"
                        value={invitationCode}
                        onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                        placeholder={t('account_enter_code')}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-xs font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-[#00FFFF]/50 transition-all"
                      />
                      <button 
                        onClick={handleApplyCode}
                        disabled={applyingCode || !invitationCode.trim()}
                        className="px-8 py-3 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-all"
                      >
                        {applyingCode ? t('common_loading') : t('pilot_apply_btn')}
                      </button>
                    </div>
                    
                    {pilotError && (
                      <p className="mt-3 text-red-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={12} /> {pilotError}
                      </p>
                    )}
                    {pilotSuccess && (
                      <p className="mt-3 text-[#00FFFF] text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 size={12} /> {pilotSuccess}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upsell for Free Users */}
        {plan === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 border border-[#00FFFF]/20 bg-gradient-to-r from-[#00FFFF]/5 to-[#8A2BE2]/5 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 text-[#00FFFF]">
              <Crown size={120} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">{t('dash_upsell_title')}</h2>
            <p 
              className="text-white/40 text-xs font-black uppercase tracking-widest mb-8 max-w-2xl mx-auto leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t('dash_upsell_desc', { plan: `<span className="text-[#00FFFF]">${t('dash_free_tier')}</span>` }) }}
            />
            <button 
              onClick={() => navigate('/pricing')}
              className="btn-primary px-12 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-[#00FFFF]/20"
            >
              {t('btn_view_options')}
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}
