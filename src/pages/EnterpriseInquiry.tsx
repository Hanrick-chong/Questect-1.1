import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  Users, 
  Globe, 
  CheckCircle2, 
  ArrowRight, 
  Mail, 
  Phone, 
  User, 
  School,
  ChevronRight,
  Shield,
  BarChart3,
  Layers,
  Settings,
  Send,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { APP_NAME } from '../lib/constants';

type InquiryStep = 'FORM' | 'SUCCESS';

export default function EnterpriseInquiry() {
  const navigate = useNavigate();
  const [step, setStep] = useState<InquiryStep>('FORM');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    workEmail: '',
    phoneNumber: '',
    institutionName: '',
    role: '',
    institutionType: '',
    teamSize: '',
    academicContext: '',
    interests: [] as string[],
    message: ''
  });

  const institutionTypes = [
    'Primary School',
    'Secondary School',
    'Tuition Centre',
    'Independent School',
    'International School',
    'College / Institution',
    'Education Group',
    'Other'
  ];

  const teamSizes = [
    '1–5 teachers',
    '6–20 teachers',
    '21–50 teachers',
    '51+ teachers'
  ];

  const academicContexts = [
    'Primary',
    'SPM',
    'UEC',
    'IGCSE',
    'A-Level',
    'Mixed',
    'Other'
  ];

  const interestOptions = [
    { id: 'dashboard', label: 'Institution Dashboard' },
    { id: 'workflow', label: 'Multi-teacher Workflow' },
    { id: 'grading', label: 'Multi-student Exam Grading' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'custom', label: 'Custom Workflow' },
    { id: 'rollout', label: 'Large-scale Rollout' },
    { id: 'pricing', label: 'Pricing Discussion' },
    { id: 'demo', label: 'Demo Request' }
  ];

  const handleInterestToggle = (id: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Store inquiry in Firestore
      await addDoc(collection(db, 'enterprise_inquiries'), {
        ...formData,
        status: 'new',
        createdAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.WRITE, 'enterprise_inquiries'));

      setStep('SUCCESS');
    } catch (err: any) {
      console.error("Error submitting inquiry:", err);
      setError("Failed to submit inquiry. Please try again or contact support.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-oxford-blue flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-xl w-full p-12 border border-white/10 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 brand-gradient-bg" />
          <div className="w-20 h-20 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/20">
            <CheckCircle2 className="text-green-400" size={40} />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Inquiry Submitted</h2>
          <p className="text-white/40 text-xs font-medium uppercase tracking-widest leading-relaxed mb-10">
            Thank you. Your inquiry has been submitted successfully. Our team will review your request and contact you using the email provided.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3"
          >
            Return to Home
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-oxford-blue pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] glow-ambient-purple blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] glow-ambient-cyan blur-[150px] opacity-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Column: Info */}
          <div className="lg:col-span-5 space-y-12">
            <div>
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest mb-8 transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-6">
                Enterprise <br />
                <span className="text-electric-cyan">Inquiry</span>
              </h1>
              <p className="text-white/40 text-sm font-medium uppercase tracking-widest leading-relaxed mb-8">
                Tell us about your school or institution, and we’ll help you find the right {APP_NAME} setup.
              </p>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider leading-relaxed">
                  {APP_NAME} supports institution-oriented workflows such as multi-teacher access, class or group management, institution analytics, and custom setup discussions.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Why {APP_NAME} Enterprise?</h3>
              <div className="grid gap-4">
                {[
                  { icon: BarChart3, title: 'Institution Dashboard', desc: 'Centralized analytics for departments and schools.' },
                  { icon: Users, title: 'Multi-Teacher Workflow', desc: 'Seamless collaboration and moderation tools.' },
                  { icon: Layers, title: 'Large-Scale Grading', desc: 'Optimized batch processing for thousands of students.' },
                  { icon: Shield, title: 'Custom Compliance', desc: 'SLA, dedicated support, and on-premise options.' }
                ].map((item, i) => (
                  <div key={i} className="glass-card p-5 border border-white/5 flex gap-4 group hover:border-white/10 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-electric-cyan group-hover:scale-110 transition-transform">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">{item.title}</h4>
                      <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 md:p-12 border border-white/10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 brand-gradient-bg opacity-50" />
              
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* SECTION A — CONTACT DETAILS */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-electric-cyan" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">SECTION A — CONTACT DETAILS</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                        <input 
                          required
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-6 text-xs text-white focus:outline-none focus:border-electric-cyan/50 transition-all"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Work Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                        <input 
                          required
                          type="email"
                          value={formData.workEmail}
                          onChange={(e) => setFormData({...formData, workEmail: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-6 text-xs text-white focus:outline-none focus:border-electric-cyan/50 transition-all"
                          placeholder="Enter your work email"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Phone Number (optional)</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                        <input 
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-6 text-xs text-white focus:outline-none focus:border-electric-cyan/50 transition-all"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Role / Position</label>
                      <div className="relative">
                        <Settings className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                        <input 
                          required
                          type="text"
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-6 text-xs text-white focus:outline-none focus:border-electric-cyan/50 transition-all"
                          placeholder="Example: Principal, Academic Coordinator, Teacher, Admin Manager"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Institution / School Name</label>
                    <div className="relative">
                      <School className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                      <input 
                        required
                        type="text"
                        value={formData.institutionName}
                        onChange={(e) => setFormData({...formData, institutionName: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-6 text-xs text-white focus:outline-none focus:border-electric-cyan/50 transition-all"
                        placeholder="Enter your institution or school name"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION B — INSTITUTION DETAILS */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-electric-purple" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">SECTION B — INSTITUTION DETAILS</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Institution Type</label>
                      <select 
                        required
                        value={formData.institutionType}
                        onChange={(e) => setFormData({...formData, institutionType: e.target.value})}
                        className="w-full bg-oxford-blue border border-white/10 rounded-xl py-3.5 px-4 text-xs text-white focus:outline-none focus:border-electric-purple/50 transition-all appearance-none"
                      >
                        <option value="" disabled>Select institution type</option>
                        {institutionTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Estimated Team Size</label>
                      <select 
                        required
                        value={formData.teamSize}
                        onChange={(e) => setFormData({...formData, teamSize: e.target.value})}
                        className="w-full bg-oxford-blue border border-white/10 rounded-xl py-3.5 px-4 text-xs text-white focus:outline-none focus:border-electric-purple/50 transition-all appearance-none"
                      >
                        <option value="" disabled>Select estimated team size</option>
                        {teamSizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Main Exam / Academic Context</label>
                      <select 
                        required
                        value={formData.academicContext}
                        onChange={(e) => setFormData({...formData, academicContext: e.target.value})}
                        className="w-full bg-oxford-blue border border-white/10 rounded-xl py-3.5 px-4 text-xs text-white focus:outline-none focus:border-electric-purple/50 transition-all appearance-none"
                      >
                        <option value="" disabled>Select main academic context</option>
                        {academicContexts.map(ctx => (
                          <option key={ctx} value={ctx}>{ctx}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION C — INTEREST / NEEDS */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-electric-cyan" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">SECTION C — INTEREST / NEEDS</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {interestOptions.map(option => {
                      const isSelected = formData.interests.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleInterestToggle(option.id)}
                          className={cn(
                            "p-3 rounded-xl border text-[9px] font-black uppercase tracking-widest text-center transition-all",
                            isSelected 
                              ? "bg-electric-cyan/20 border-electric-cyan text-electric-cyan" 
                              : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Message</label>
                  <textarea 
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-xs text-white focus:outline-none focus:border-electric-cyan/50 transition-all resize-none"
                    placeholder="Tell us what your institution needs, what kind of grading workflow you are looking for, and any specific requirements."
                  />
                </div>

                {error && (
                  <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                    <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Submission Failed</h4>
                    <p className="text-[9px] font-medium text-red-500/80 uppercase tracking-wider">
                      We were unable to submit your inquiry at the moment. Please try again later or contact us through another available method.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-5 rounded-xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 group disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="animate-spin" size={18} />
                      <span>Submitting your inquiry...</span>
                    </div>
                  ) : (
                    <>
                      Submit Inquiry
                      <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
            
            <p className="text-center mt-8 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
              {APP_NAME} Enterprise • Secure Data Infrastructure • Global Standards
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
