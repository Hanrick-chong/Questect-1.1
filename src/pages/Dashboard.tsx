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
  Lock
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, getDocs, limit, orderBy, doc, onSnapshot } from 'firebase/firestore';
import { APP_NAME, UserPlan, hasPlanAccess } from '../lib/constants';
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    totalGraded: 1240,
    activeTeachers: 12,
    avgScore: 78.5,
    growth: 15.2
  });

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
          
          // Dashboard is available for Starter and above, but with different modules
          const allowedPlans = ['starter', 'pro', 'advanced', 'growth', 'enterprise'];
          if (!allowedPlans.includes(profile.plan || 'free')) {
            // Free users see the lock screen
          }
        }
        setLoading(false);
      }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

      return () => unsubscribeUser();
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const plan = (userProfile?.plan as UserPlan) || 'free';
  const isStarterOrAbove = hasPlanAccess(plan, 'starter');
  const isProOrAbove = hasPlanAccess(plan, 'pro');
  const isAdvancedOrAbove = hasPlanAccess(plan, 'advanced');
  const isGrowthOrAbove = hasPlanAccess(plan, 'growth');
  const isEnterprise = plan === 'enterprise';
  const isInstitutional = isGrowthOrAbove || isEnterprise;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001220] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="text-[#00FFFF] animate-pulse" size={40} />
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Initializing Infrastructure...</p>
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <button 
              onClick={() => navigate('/analyze')}
              className="flex items-center gap-2 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest mb-4 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Workspace
            </button>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <LayoutGrid className="text-[#00FFFF]" size={32} />
              {isInstitutional ? 'Institution Control' : 'Questect Dashboard'}
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
                {plan} tier
              </span>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">
                {plan === 'free' && 'Basic Access Node'}
                {plan === 'starter' && 'Starter Data Center'}
                {plan === 'pro' && 'Pro Analytics Engine'}
                {plan === 'advanced' && 'Advanced Predictive Dashboard'}
                {isInstitutional && 'Institutional Analytics Engine'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isStarterOrAbove && (
              <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all flex items-center gap-2">
                <Calendar size={14} /> Last 30 Days
              </button>
            )}
            {isProOrAbove && (
              <button className="px-6 py-3 bg-[#00FFFF] text-[#001220] rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                <Download size={14} /> Export Report
              </button>
            )}
          </div>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          
          {/* Module: Quick Grading (Free+) */}
          <div className="glass-card p-8 border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-[#00FFFF]">
              <Zap size={48} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap size={16} className="text-[#00FFFF]" />
              Quick Grading
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Today's Audits</p>
                  <h4 className="text-3xl font-black text-white tracking-tighter">24</h4>
                </div>
                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">+12%</span>
              </div>
              <button onClick={() => navigate('/grader/quick')} className="w-full py-3 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
                Open Quick Grader
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
              Exam Grader
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Status</p>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                  isStarterOrAbove ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                )}>
                  {isStarterOrAbove ? 'Full Access' : 'Limited Access'}
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#8A2BE2] w-[60%]" />
              </div>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                {isStarterOrAbove ? 'Unlimited batch processing active' : '5 trials remaining for today'}
              </p>
              <button onClick={() => navigate('/grader/exam')} className="w-full py-3 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
                {isStarterOrAbove ? 'Launch Workspace' : 'Try Exam Grader'}
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
              Usage Panel
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
              {isProOrAbove ? 'Grading Archive' : 'Basic History'}
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Physics Midterm', date: '2h ago' },
                { name: 'History Quiz A', date: '5h ago' },
                { name: 'Bio Lab Report', date: '1d ago' },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded bg-white/5 border border-white/5">
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-tight">{item.name}</span>
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{item.date}</span>
                </div>
              ))}
              
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
              Performance Trends
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
              Team Management
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
            <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Elevate Your Grading Infrastructure</h2>
            <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-8 max-w-2xl mx-auto leading-relaxed">
              You are currently on the <span className="text-[#00FFFF]">Free Tier</span>. 
              Unlock full exam grading, historical archives, and advanced analytics to save up to 15 hours per week.
            </p>
            <button 
              onClick={() => navigate('/pricing')}
              className="btn-primary px-12 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-[#00FFFF]/20"
            >
              View Upgrade Options
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}
