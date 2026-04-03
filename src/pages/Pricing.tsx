import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Shield, Crown, Building, Globe } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { APP_NAME, STRIPE_ACTIVATED, STRIPE_LINKS } from '../lib/constants';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import PremiumUnavailableModal from '../components/Pricing/PremiumUnavailableModal';

interface UserProfile {
  plan: string;
}

export default function Pricing() {
  const navigate = useNavigate();
  const [tier, setTier] = useState<'educator' | 'institution'>('educator');
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      
      // Cleanup previous profile listener if it exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (currentUser) {
        unsubscribeProfile = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data() as UserProfile);
          }
        });
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const currentPlan = userProfile?.plan || 'free';

  const educatorPlans = [
    {
      name: "Free",
      price: "RM0",
      color: "border-green-500/30",
      icon: Zap,
      featured: false,
      features: [
        "Quick Grading (Single/Multi)",
        "Limited Exam Grader Access",
        "Basic History Review (Last 3)",
        "Smart Scan (OCR)",
        "Community Support"
      ]
    },
    {
      name: "Starter",
      price: "RM19",
      color: "border-electric-cyan/30",
      icon: Shield,
      featured: false,
      features: [
        "Full Exam Grader Workflow",
        "Unlimited Batch Processing",
        "Multi-student Exam Grading",
        "Usage Panel & Statistics",
        "Everything in Free"
      ]
    },
    {
      name: "Pro",
      price: "RM49",
      color: "border-purple-500 glow-cyan",
      icon: Crown,
      featured: true,
      features: [
        "Saved Grading Records",
        "Full Grading History",
        "Searchable Archive",
        "Cloud Sync & Backup",
        "Everything in Starter"
      ]
    },
    {
      name: "Advanced",
      price: "RM99",
      color: "border-red-500/30",
      icon: Building,
      featured: false,
      features: [
        "Full Data Analytics",
        "Custom Reporting",
        "Trend Analysis",
        "Advanced Insights",
        "Everything in Pro"
      ]
    }
  ];

  const institutionPlans = [
    {
      name: "Growth",
      price: "RM299",
      color: "border-orange-500/30",
      icon: Building,
      featured: false,
      features: [
        "Institution Dashboard",
        "Team Management (Up to 10)",
        "Class/Group Modules",
        "Full Oversight Controls",
        "Shared Workflow Visibility"
      ]
    },
    {
      name: "Enterprise",
      price: "Custom",
      color: "border-electric-cyan/30",
      icon: Globe,
      featured: false,
      features: [
        "Custom Workflow Setup",
        "SSO & Security Controls",
        "Dedicated Support & SLA",
        "Large-scale Deployment",
        "Custom Integration",
        "Everything in Growth"
      ]
    }
  ];

  const currentPlans = tier === 'educator' ? educatorPlans : institutionPlans;

  const handlePlanAction = (planName: string) => {
    const planNameLower = planName.toLowerCase();
    
    // 1. Current Plan: Go to analyze
    if (planNameLower === currentPlan) {
      navigate('/analyze');
      return;
    }

    // 2. Enterprise: Always route to inquiry
    if (planName === 'Enterprise') {
      navigate('/enterprise-inquiry');
      return;
    }

    // 3. Free: Go to analyze
    if (planName === 'Free') {
      if (!user) navigate('/auth');
      else navigate('/analyze');
      return;
    }

    // 4. Paid plans logic
    if (!STRIPE_ACTIVATED) {
      setSelectedPlan(planName);
      setShowUnavailableModal(true);
      return;
    }

    // 5. Redirect to Stripe
    const link = STRIPE_LINKS[planName.toUpperCase() as keyof typeof STRIPE_LINKS];
    if (link) {
      const stripeUrl = new URL(link);
      if (user) {
        stripeUrl.searchParams.set('client_reference_id', user.uid);
        // Also set prefilled email if available
        if (user.email) {
          stripeUrl.searchParams.set('prefilled_email', user.email);
        }
      }
      // Use window.open for safest external redirect from iframe
      window.open(stripeUrl.toString(), '_blank');
    }
  };

  const handleDevBypass = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        plan: 'starter'
      });
      alert('Dev Mode: Plan upgraded to Starter for testing.');
    } catch (error) {
      console.error('Dev bypass failed:', error);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 relative bg-[#001220]">
      {/* Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#8A2BE2] blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-[#00FFFF] blur-[150px] opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter uppercase text-white">The Metabolism</h2>
          <p className="text-white/40 text-lg font-black uppercase tracking-[0.4em] mb-10">{APP_NAME} Infrastructure Plans</p>
          
          {user?.email === 'cbumsteak@gmail.com' && (
            <div className="mb-8">
              <button 
                onClick={handleDevBypass}
                className="px-6 py-2 bg-red-500/20 border border-red-500/50 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
              >
                Developer Bypass: Set Plan to Starter
              </button>
            </div>
          )}

          <div className="inline-flex p-1.5 bg-white/5 rounded-2xl border border-white/10 mb-12">
            <button
              onClick={() => setTier('educator')}
              className={cn(
                "px-8 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest",
                tier === 'educator' ? "bg-gradient-to-r from-[#00FFFF] to-[#8A2BE2] text-[#001220] shadow-lg" : "text-white/40 hover:text-white"
              )}
            >
              Individual Educator
            </button>
            <button
              onClick={() => setTier('institution')}
              className={cn(
                "px-8 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest",
                tier === 'institution' ? "bg-gradient-to-r from-[#00FFFF] to-[#8A2BE2] text-[#001220] shadow-lg" : "text-white/40 hover:text-white"
              )}
            >
              School Institution
            </button>
          </div>
        </motion.div>

        <div className={cn(
          "grid gap-8",
          tier === 'educator' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
        )}>
          {currentPlans.map((plan, i) => {
            const isCurrent = plan.name.toLowerCase() === currentPlan;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "flex flex-col relative overflow-hidden rounded-2xl border transition-all duration-500",
                  plan.featured ? "border-[#8A2BE2] shadow-[0_0_30px_rgba(138,43,226,0.2)]" : "border-white/10",
                  "hover:border-white/20"
                )}
              >
                <div className="bg-white/[0.02] backdrop-blur-xl p-10 flex flex-col h-full">
                  {plan.featured && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-[#00FFFF] to-[#8A2BE2] text-[#001220] text-[10px] font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest shadow-lg">
                      Popular
                    </div>
                  )}
                  <div className="mb-10">
                    <plan.icon className="text-[#8A2BE2] mb-6" size={32} />
                    <h3 className="text-2xl font-black mb-2 text-[#00FFFF] tracking-tighter uppercase">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-white tracking-tighter">{plan.price}</span>
                      {plan.price !== 'Custom' && <span className="text-white/30 text-sm font-bold uppercase tracking-widest">/mo</span>}
                    </div>
                  </div>
                  <ul className="space-y-5 mb-10 flex-grow">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-4 text-sm text-white/50 font-medium">
                        <Check size={18} className="text-[#00FFFF] mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button 
                    type="button"
                    onClick={() => handlePlanAction(plan.name)}
                    className={cn(
                      "w-full py-4 rounded-xl font-black transition-all uppercase tracking-[0.2em] text-xs shadow-xl relative z-30 cursor-pointer",
                      isCurrent ? "bg-white/10 text-white border border-white/20" : 
                      "bg-gradient-to-r from-[#00FFFF] to-[#8A2BE2] text-[#001220] hover:scale-[1.02] active:scale-[0.98]"
                    )}
                  >
                    {isCurrent ? 'Current Plan' : 
                     plan.name === 'Enterprise' ? 'Contact Sales' : 
                     !STRIPE_ACTIVATED && plan.name !== 'Free' ? 'View Availability' :
                     `Choose ${plan.name}`}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <PremiumUnavailableModal 
        isOpen={showUnavailableModal}
        onClose={() => {
          setShowUnavailableModal(false);
          setSelectedPlan('');
        }}
        planName={selectedPlan}
      />
    </div>
  );
}
