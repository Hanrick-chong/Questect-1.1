import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { LogOut, Menu, X, ChevronRight, Share2, Check, Lock } from 'lucide-react';
import { db } from '../lib/firebase';
import { APP_URL, APP_NAME } from '../lib/constants';

interface UserProfile {
  plan: string;
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(APP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const unsubscribeProfile = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data() as UserProfile);
          }
        });
        return () => unsubscribeProfile();
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Close menu on navigation
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  const navLinks = [
    { name: 'Features', path: '/features' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'About Us', path: '/about' },
  ];

  const plan = userProfile?.plan || 'free';
  const isStarterOrAbove = ['starter', 'pro', 'advanced', 'growth', 'enterprise'].includes(plan);
  const isProOrAbove = ['pro', 'advanced', 'growth', 'enterprise'].includes(plan);
  const isGrowthOrAbove = ['growth', 'enterprise'].includes(plan);

  const mobileMenuLinks = [
    { name: 'Quick Grading', path: '/analyze', authRequired: true },
    { name: 'Exam Grader', path: '/system', authRequired: true },
    { name: 'Dashboard', path: '/dashboard', authRequired: true, planRequired: isStarterOrAbove },
    { name: 'History', path: '/history', authRequired: true, planRequired: isProOrAbove },
    { name: 'Billing', path: '/billing', authRequired: true },
    { name: 'Profile', path: '/billing', authRequired: true },
    { name: 'Features', path: '/features' },
    { name: 'About Us', path: '/about' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-oxford-blue/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 md:gap-3 group">
          <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
            <div className="absolute inset-0 brand-gradient-bg rounded-xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <img 
              src="/Questect big.png" 
              alt={`${APP_NAME} Logo`} 
              className="w-8 h-8 md:w-10 md:h-10 relative z-10 object-contain rounded-lg" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/questect-favicon-v3.svg';
              }}
            />
          </div>
          <span className="text-xl md:text-2xl font-bold tracking-tighter text-white uppercase">{APP_NAME}</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 text-white/60 hover:text-electric-cyan transition-all text-[10px] font-black uppercase tracking-widest group"
          >
            {copied ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <Share2 size={14} className="group-hover:scale-110 transition-transform" />
            )}
            {copied ? 'Copied!' : 'Share'}
          </button>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-base font-black tracking-widest transition-colors hover:text-electric-cyan uppercase",
                location.pathname === link.path ? "text-electric-cyan" : "text-white/80"
              )}
            >
              {link.name}
            </Link>
          ))}
          {user && (
            <Link
              to="/analyze"
              className={cn(
                "text-base font-black tracking-widest transition-colors hover:text-electric-cyan uppercase",
                location.pathname === '/analyze' ? "text-electric-cyan" : "text-white/80"
              )}
            >
              Workspace
            </Link>
          )}
          {user && isStarterOrAbove && (
            <Link
              to="/dashboard"
              className={cn(
                "text-base font-black tracking-widest transition-colors hover:text-electric-cyan uppercase",
                location.pathname === '/dashboard' ? "text-electric-cyan" : "text-white/80"
              )}
            >
              Dashboard
            </Link>
          )}
          {user ? (
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          ) : (
            <Link to="/auth" className="btn-primary py-2 px-6 text-sm group transition-all duration-300 hover:brightness-110">
              <span className="group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300">
                Get Started
              </span>
            </Link>
          )}
        </div>

        {/* Mobile Navigation Controls */}
        <div className="flex md:hidden items-center gap-4">
          <Link 
            to="/pricing" 
            className={cn(
              "text-xs font-black tracking-widest uppercase",
              location.pathname === '/pricing' ? "text-electric-cyan" : "text-white/80"
            )}
          >
            Pricing
          </Link>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-20 left-0 right-0 bg-oxford-blue border-b border-white/10 md:hidden overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-2">
              {mobileMenuLinks.map((link) => {
                if (link.authRequired && !user) return null;
                const isLocked = link.planRequired === false;
                
                return (
                  <Link
                    key={link.name}
                    to={isLocked ? '/pricing' : link.path}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl transition-all duration-300",
                      location.pathname === link.path 
                        ? "bg-white/5 text-electric-cyan" 
                        : "text-white/60 hover:bg-white/5 hover:text-white",
                      isLocked && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black uppercase tracking-widest">{link.name}</span>
                      {isLocked && <Lock size={12} className="text-white/40" />}
                    </div>
                    <ChevronRight size={16} className="opacity-40" />
                  </Link>
                );
              })}

              {!user ? (
                <Link 
                  to="/auth" 
                  className="btn-primary mt-4 py-4 rounded-xl text-center text-sm font-black uppercase tracking-widest"
                >
                  Get Started
                </Link>
              ) : (
                <button 
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 mt-4 p-4 text-white/40 hover:text-white transition-colors text-xs font-black uppercase tracking-widest border border-white/5 rounded-xl"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
