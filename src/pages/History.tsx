import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  History as HistoryIcon, 
  Search, 
  FileText, 
  ChevronRight, 
  Calendar, 
  User, 
  ArrowLeft,
  Filter,
  Download,
  Trash2,
  AlertCircle,
  Clock,
  Shield,
  Crown
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { APP_NAME } from '../lib/constants';

interface UserProfile {
  plan: string;
}

interface GradingReport {
  id: string;
  studentName: string;
  subject: string;
  academicLevel: string;
  timestamp: any;
  reports: any[];
}

export default function History() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<GradingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch user profile for plan check
      const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

      const q = query(
        collection(db, 'reports'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );

      const unsubscribeReports = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as GradingReport[];
        setReports(data);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching history:", error);
        setLoading(false);
      });

      return () => {
        unsubscribeUser();
        unsubscribeReports();
      };
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const isProOrAbove = userProfile && ['pro', 'advanced', 'growth', 'enterprise'].includes(userProfile.plan);
  const isStarterOrAbove = userProfile && ['starter', 'pro', 'advanced', 'growth', 'enterprise'].includes(userProfile.plan);
  const plan = userProfile?.plan || 'free';

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteDoc(doc(db, 'reports', id));
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         r.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'All' || r.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const subjects = ['All', ...Array.from(new Set(reports.map(r => r.subject).filter(Boolean)))];

  if (loading) {
    return (
      <div className="min-h-screen bg-oxford-blue flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Clock className="text-electric-cyan animate-spin" size={40} />
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Accessing Archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-oxford-blue pt-24 pb-12 px-4 md:px-6 relative">
      <div className="max-w-6xl mx-auto">
        
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
              <HistoryIcon className="text-electric-cyan" size={32} />
              Grading Records
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">
                Teacher History Review & Audit
              </p>
              {!isProOrAbove && (
                <div className="flex items-center gap-2 px-2 py-0.5 bg-electric-purple/10 border border-electric-purple/20 rounded text-[8px] font-black text-electric-purple uppercase tracking-widest">
                  <Shield size={10} />
                  {plan === 'free' ? '10 Record Limit' : '50 Record Limit'}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input 
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-electric-cyan/50 transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
              <select 
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-8 text-[10px] font-black uppercase tracking-widest text-white/60 focus:outline-none appearance-none cursor-pointer"
              >
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-electric-cyan/20 border-t-electric-cyan rounded-full animate-spin" />
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Accessing Cloud Archives...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="glass-card p-20 border border-white/10 text-center">
            <AlertCircle className="w-16 h-16 text-white/10 mx-auto mb-6" />
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">No Records Found</h2>
            <p className="text-white/40 text-sm mb-8">Your grading history will appear here once you complete an audit.</p>
            <button 
              onClick={() => navigate('/analyze')}
              className="btn-primary py-4 px-10 rounded-xl text-xs font-black uppercase tracking-widest"
            >
              Start First Grading
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredReports.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/analyze?reportId=${report.id}`)}
                className="glass-card p-6 border border-white/10 hover:border-electric-cyan/30 transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-electric-cyan/5 blur-[60px] -mr-16 -mt-16 group-hover:bg-electric-cyan/10 transition-colors" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-electric-cyan/10 border border-electric-cyan/20 flex items-center justify-center text-electric-cyan">
                      <FileText size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">
                          {report.studentName || "Multiple Students"}
                        </h3>
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] font-black text-white/40 uppercase tracking-widest">
                          {report.academicLevel}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} className="text-electric-cyan" />
                          {report.timestamp?.toDate().toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User size={12} className="text-electric-cyan" />
                          {report.subject}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex-grow md:flex-grow-0 text-right mr-4">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Audit Status</p>
                      <div className="flex items-center justify-end gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Completed</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isProOrAbove) {
                            navigate('/billing');
                            return;
                          }
                          // Logic to download PDF would go here
                        }}
                        className={cn(
                          "p-3 border rounded-xl transition-all relative group/btn",
                          isProOrAbove 
                            ? "bg-white/5 hover:bg-white/10 border-white/10 text-white/40 hover:text-white" 
                            : "bg-white/5 border-white/10 text-white/20 cursor-not-allowed"
                        )}
                      >
                        <Download size={16} />
                        {!isProOrAbove && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-electric-purple text-white text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            Pro Feature
                          </div>
                        )}
                      </button>
                      <button 
                        onClick={(e) => handleDelete(report.id, e)}
                        className="p-3 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-xl text-white/40 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="p-3 bg-electric-cyan/10 border border-electric-cyan/20 rounded-xl text-electric-cyan group-hover:translate-x-1 transition-transform">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
            {APP_NAME} Secure Cloud Storage © 2026
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-electric-cyan animate-pulse" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Real-time Sync Active</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={12} className="text-white/20" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">AES-256 Encrypted</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
