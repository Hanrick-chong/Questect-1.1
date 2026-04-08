import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Mail, Globe, ChevronDown, Loader2, Check, Facebook, Phone, ArrowLeft, RefreshCw } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { auth, db, googleProvider, facebookProvider, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  User, 
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { APP_NAME, APP_DOMAIN, LEGAL_URLS } from '@/src/lib/constants';
import firebaseConfig from '../../firebase-applet-config.json';
import { useLanguage } from '../lib/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

type AuthState = 'methods' | 'verifying' | 'onboarding';
type OnboardingStep = 'ROLE' | 'SYLLABUS';

interface UserSession {
  isVerified: boolean;
  authMethod: string;
  timestamp: number;
  uid: string;
  name?: string;
  email?: string;
  role?: 'educator' | 'admin';
  syllabus?: string;
}

const SIMULATED_SERVER_CODE = '123456';
const GOOGLE_CLIENT_ID = '869705530169-snl6oom20k4b618oo2tjn5v9qslc8ufo.apps.googleusercontent.com';
const META_APP_ID = '2695895034108399';

export default function Auth() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [authState, setAuthState] = useState<AuthState>('methods');
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('ROLE');
  const [authMethod, setAuthMethod] = useState<string>('');
  const [role, setRole] = useState<'educator' | 'admin'>('educator');
  const [syllabus, setSyllabus] = useState('SPM');
  const [region, setRegion] = useState('Malaysia (+60)');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [agreed, setAgreed] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [password, setPassword] = useState('');
  const [isEmailLogin, setIsEmailLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start with loading to check auth state
  const [countdown, setCountdown] = useState(60);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Check if user has profile in Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            // User already onboarded
            navigate('/analyze');
          } else {
            // User needs onboarding
            setAuthState('onboarding');
          }
        } catch (err) {
          console.error("Error checking user profile:", err);
          setAuthState('onboarding');
        }
      } else {
        setCurrentUser(null);
        setAuthState('methods');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  // Timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (authState === 'verifying' && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [authState, countdown]);

  const handleSocialAuth = async (provider: 'Google' | 'Facebook') => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const authProvider = provider === 'Google' ? googleProvider : facebookProvider;
      await signInWithPopup(auth, authProvider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // Don't log or show a scary error if they just closed it
        setIsLoading(false);
        return;
      }

      console.error(`${provider} Auth Error:`, err);
      
      if (err.code === 'auth/cancelled-popup-request') {
        setError("A login attempt was already in progress. Please wait for the window to open or refresh the page.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError(`Please enable ${provider} login in your Firebase Console (Authentication > Sign-in method). You'll need to enter your App ID (${provider === 'Facebook' ? '2695895034108399' : '...'}) and App Secret.`);
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized for Firebase Auth. Add it to 'Authorized domains' in your Firebase Console.");
      } else if (err.code === 'auth/invalid-credential') {
        if (err.message.includes('Invalid Scopes')) {
          setError("Facebook Error: 'email' scope is invalid. Please ensure your Facebook App has 'email' and 'public_profile' permissions enabled in App Review > Permissions and Features.");
        } else if (err.message.includes('Can\'t load URL')) {
          setError("Facebook Error: Domain not whitelisted. You MUST add the AI Studio preview URLs to your Meta App Settings (App Domains and Valid OAuth Redirect URIs).");
        } else {
          setError(`Invalid credentials from ${provider}. Check your App ID and Secret.`);
        }
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network Error: The login window failed to communicate. This usually means your domain is not whitelisted in Meta (Facebook) or Firebase Authorized Domains.");
      } else {
        setError(err.message || `Failed to sign in with ${provider}`);
      }
      
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAuthState('methods');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    if (authState === 'methods' && !window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => {
            console.log("Recaptcha verified");
          }
        });
      } catch (err) {
        console.error("Recaptcha error:", err);
      }
    }
  }, [authState]);

  const handlePhoneAuth = async () => {
    if (!phoneNumber) return;
    setIsLoading(true);
    setError(null);
    try {
      const fullNumber = `+${region.match(/\d+/)?.[0]}${phoneNumber.replace(/\s/g, '')}`;
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, fullNumber, appVerifier);
      setConfirmationResult(result);
      setAuthState('verifying');
    } catch (err: any) {
      console.error("Phone Auth Error:", err);
      setError(err.message || "Failed to send verification code.");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId: any) => {
          window.recaptchaVerifier.reset(widgetId);
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!emailInput || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      try {
        await signInWithEmailAndPassword(auth, emailInput, password);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          await createUserWithEmailAndPassword(auth, emailInput, password);
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error("Email Auth Error:", err);
      setError(err.message || "Failed to sign in with email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;
    
    setIsLoading(true);
    setError(null);
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(code);
      } else {
        setError("Verification session expired. Please try again.");
        setAuthState('methods');
      }
    } catch (err: any) {
      console.error("OTP Verification Error:", err);
      setError("Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (authState === 'verifying') {
      await handleVerifyOtp();
      return;
    }
    if (authState === 'onboarding') {
      if (onboardingStep === 'ROLE') {
        setOnboardingStep('SYLLABUS');
      } else {
        if (!currentUser) return;
        setIsLoading(true);
        try {
          const path = `users/${currentUser.uid}`;
          // Save user profile to Firestore
          await setDoc(doc(db, 'users', currentUser.uid), {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            role,
            syllabus,
            plan: 'free', // Default plan for new users
            examGraderTrialsUsedToday: 0,
            lastTrialResetDate: new Date().toISOString().split('T')[0],
            createdAt: serverTimestamp()
          }).catch(err => handleFirestoreError(err, OperationType.WRITE, path));
          
          navigate('/analyze');
        } catch (err: any) {
          console.error("Error saving profile:", err);
          setError("Failed to save profile. Please try again.");
          setIsLoading(false);
        }
      }
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
    
    // Auto-submit if all digits are filled
    if (value && index === 5 && newOtp.every(d => d)) {
      handleNextStep();
    }
  };

  const regions = [
    'Malaysia (+60)',
    'Singapore (+65)',
    'United Kingdom (+44)',
    'United States (+1)',
    'Australia (+61)',
    'China (+86)'
  ];

  const renderStep = () => {
    switch (authState) {
      case 'methods':
        return (
          <div className="w-full space-y-2.5">
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleSocialAuth('Google')}
                disabled={isLoading}
                className="w-full btn-primary py-2.5 px-6 rounded-xl flex items-center justify-center gap-3 group disabled:opacity-50"
                data-client-id={GOOGLE_CLIENT_ID}
              >
                <div className="bg-white p-1 rounded-lg">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <span className="font-black uppercase tracking-widest text-[11px] text-white">
                  {isLoading ? t('common_loading') : t('auth_sign_in_google')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialAuth('Facebook')}
                disabled={isLoading}
                className="w-full btn-primary py-2.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50"
              >
                <div className="bg-white p-1 rounded-lg">
                  <Facebook size={16} className="text-[#1877F2]" fill="currentColor" />
                </div>
                <span className="font-black uppercase tracking-widest text-[11px] text-white">
                  {isLoading ? t('common_loading') : 'Continue with Facebook'}
                </span>
              </button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-[9px] uppercase"><span className="bg-oxford-blue px-2 text-white font-black tracking-[0.2em]">Or use direct access</span></div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center space-y-3 shadow-xl">
                  <div className="flex items-center justify-center gap-2 text-red-500">
                    <RefreshCw size={14} className="animate-spin-slow" />
                    <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                  </div>
                  
                  {(error.includes('Facebook') || error.includes('Network Error')) && (
                    <div className="pt-3 border-t border-red-500/20 text-[9px] text-white/80 font-black uppercase tracking-widest text-left space-y-2">
                      <p className="text-electric-cyan">CRITICAL: This must be fixed in your Firebase Console.</p>
                      <div className="space-y-2 bg-black/30 p-4 rounded-2xl border border-white/10">
                        <p className="text-white/40 mb-2">--- Firebase Side ---</p>
                        <p>1. <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`} target="_blank" rel="noopener noreferrer" className="text-electric-cyan underline">Open Firebase Console</a></p>
                        <p>2. Add Provider &gt; Select <span className="text-electric-cyan">Facebook</span></p>
                        <p>3. App ID: <span className="text-electric-cyan select-all bg-white/5 px-1 rounded">2695895034108399</span></p>
                        <p>4. App Secret: (Get from Meta Dashboard)</p>
                        
                        <p className="text-white/40 mt-4 mb-2">--- Meta Side ---</p>
                        <p>5. Go to <span className="text-electric-cyan">App Settings &gt; Basic</span></p>
                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5 mb-2">
                          <p className="text-[7px] text-white/60 mb-1 italic">Use your professional domain for all URLs:</p>
                          <p className="text-[8px] text-electric-cyan select-all break-all mb-1">{LEGAL_URLS.PRIVACY}</p>
                          <p className="text-[8px] text-electric-cyan select-all break-all">{LEGAL_URLS.TERMS}</p>
                        </div>
                        <p>6. Add to <span className="text-electric-cyan">App Domains</span>:</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          <p className="bg-white/5 p-1 rounded text-[7px] text-electric-cyan select-all">{APP_DOMAIN}</p>
                          <p className="bg-white/5 p-1 rounded text-[7px] text-electric-cyan select-all">gen-lang-client-0795247812.firebaseapp.com</p>
                        </div>
                        
                        <p>7. Go to <span className="text-electric-cyan">Facebook Login &gt; Settings</span></p>
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5 mb-2 space-y-1">
                          <p className="text-[7px] text-white/60 italic">Ensure these are set to <span className="text-electric-cyan">YES</span>:</p>
                          <p className="text-[8px] flex justify-between"><span>Client OAuth Login</span> <span className="text-electric-cyan">YES</span></p>
                          <p className="text-[8px] flex justify-between"><span>Web OAuth Login</span> <span className="text-electric-cyan">YES</span></p>
                          <p className="text-[8px] flex justify-between"><span>Embedded Browser OAuth Login</span> <span className="text-electric-cyan">YES</span></p>
                        </div>
                        <p>8. Paste into <span className="text-electric-cyan">Valid OAuth Redirect URIs</span>:</p>
                        <div className="group relative">
                          <p className="bg-white/10 p-2 rounded-lg select-all lowercase tracking-normal text-electric-cyan text-[8px] break-all border border-electric-cyan/30">
                            {`https://${firebaseConfig.authDomain}/__/auth/handler`}
                          </p>
                          <p className="text-[7px] text-white/40 mt-1 italic">Click the text above to select & copy</p>
                        </div>
                        
                        <p className="text-white/40 mt-4 mb-2">--- Final Check ---</p>
                        <p className="text-[8px] text-white/60 italic">If your app is in <span className="text-electric-cyan">Development Mode</span>, only you (the admin) can log in. To allow others, you must switch to <span className="text-electric-cyan">Live Mode</span> or add them as <span className="text-electric-cyan">Testers</span> in the Meta Dashboard.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white uppercase tracking-[0.3em]">Region & Phone Number</p>
                  <div className="flex gap-2 flex-nowrap">
                    <div className="relative w-[140px] flex-shrink-0">
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full appearance-none bg-white/10 border border-white/20 rounded-xl pl-8 pr-2 py-2 text-sm font-black text-white outline-none focus:ring-2 focus:ring-electric-cyan/50 cursor-pointer transition-all whitespace-nowrap"
                      >
                        {regions.map(r => (
                          <option key={r} value={r} className="bg-oxford-blue text-white font-black">{r}</option>
                        ))}
                      </select>
                      <Globe size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                      <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-electric-cyan pointer-events-none" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="123 456 7890"
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-[11px] font-black text-white placeholder:text-white outline-none focus:ring-2 focus:ring-electric-cyan/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white uppercase tracking-[0.3em]">{t('auth_email_label')}</p>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (e.target.value) setIsEmailLogin(true);
                      else if (!password) setIsEmailLogin(false);
                    }}
                    placeholder="name@institution.com"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-[11px] font-black text-white placeholder:text-white outline-none focus:ring-2 focus:ring-electric-cyan/50 transition-all"
                  />
                </div>

                {isEmailLogin && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[8px] font-black text-white uppercase tracking-[0.3em]">{t('auth_password_label')}</p>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-[11px] font-black text-white placeholder:text-white outline-none focus:ring-2 focus:ring-electric-cyan/50 transition-all"
                    />
                  </div>
                )}

                <div className="flex items-start gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setAgreed(!agreed)}
                    className={cn(
                      "mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-300 shrink-0",
                      agreed ? "brand-gradient-bg border-transparent shadow-lg" : "border-white/20 hover:border-white/40"
                    )}
                  >
                    {agreed && <Check size={12} className="text-oxford-blue font-black" />}
                  </button>
                  <p className="text-[9px] text-white leading-tight font-black uppercase tracking-widest">
                    I agree to the <span onClick={() => navigate('/legal/terms')} className="text-electric-cyan cursor-pointer hover:underline">Terms</span> and <span onClick={() => navigate('/legal/privacy')} className="text-electric-cyan cursor-pointer hover:underline">Privacy</span>.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (!agreed) {
                      setError("Please agree to the terms and privacy policy.");
                      return;
                    }
                    if (emailInput) {
                      handleEmailAuth();
                    } else if (phoneNumber) {
                      handlePhoneAuth();
                    } else {
                      setError("Please enter your phone number or email address.");
                    }
                  }}
                  disabled={isLoading}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-3 rounded-xl shadow-xl group transition-all duration-300 hover:brightness-110 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <span className="font-black uppercase tracking-widest text-xs text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.2)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300">
                      Continue
                    </span>
                  )}
                </button>
                <div id="recaptcha-container"></div>
              </div>
            </div>
          </div>
        );
      case 'verifying':
        return (
          <div className="w-full space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={() => setAuthState('methods')} className="text-white hover:text-electric-cyan transition-colors">
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-lg font-black text-white uppercase tracking-widest">Verify Identity</h2>
            </div>

            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <p className="text-white text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed">
                  Verification in progress...
                </p>
              </div>
              
              <div className="flex justify-between gap-1.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-10 h-14 bg-white/10 border border-white/20 rounded-xl text-center text-xl font-black text-white outline-none focus:ring-2 focus:ring-electric-cyan/50 focus:border-electric-cyan/50 transition-all shadow-lg"
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">{error}</p>
              )}

              <div className="flex flex-col items-center gap-3">
                <button
                  disabled={countdown > 0}
                  onClick={() => setCountdown(60)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-electric-cyan disabled:text-white transition-colors"
                >
                  <RefreshCw size={12} className={countdown > 0 ? "" : "animate-spin-slow"} />
                  {countdown > 0 ? `Resend Code in ${countdown}s` : "Resend Code Now"}
                </button>

                <button
                  onClick={handleNextStep}
                  disabled={otp.some(d => !d) || isLoading}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-3 disabled:opacity-50 rounded-xl shadow-xl group transition-all duration-300 hover:brightness-110"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <span className="font-black uppercase tracking-widest text-sm text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.2)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300">
                      Verify & Continue
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      case 'onboarding':
        if (onboardingStep === 'ROLE') {
          return (
            <div className="w-full space-y-4">
              <div className="text-center space-y-0.5">
                <h2 className="text-lg font-black text-white uppercase tracking-widest">Final Step</h2>
                <p className="text-white text-[9px] font-black uppercase tracking-widest">Select your professional profile</p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setRole('educator')}
                  className={cn(
                    "w-full p-3 rounded-xl border-2 transition-all duration-300 text-left group relative overflow-hidden",
                    role === 'educator'
                      ? "brand-gradient-bg border-transparent shadow-[0_0_40px_rgba(208,51,255,0.2)]"
                      : "bg-white/5 border-white/10 hover:border-white/30"
                  )}
                >
                  <div className="relative z-10">
                    <h3 className="text-xs font-black uppercase tracking-widest mb-0.5 text-white">Academic Professional</h3>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white">For individual tutors, teachers, and educators.</p>
                  </div>
                  {role === 'educator' && (
                    <motion.div layoutId="check" className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Check size={16} className="text-white" />
                    </motion.div>
                  )}
                </button>

                <button
                  onClick={() => setRole('admin')}
                  className={cn(
                    "w-full p-3 rounded-xl border-2 transition-all duration-300 text-left group relative overflow-hidden",
                    role === 'admin'
                      ? "brand-gradient-bg border-transparent shadow-[0_0_40px_rgba(0,255,255,0.2)]"
                      : "bg-white/5 border-white/10 hover:border-white/30"
                  )}
                >
                  <div className="relative z-10">
                    <h3 className="text-xs font-black uppercase tracking-widest mb-0.5 text-white">Institutional Leader</h3>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white">For school principals, tuition center owners, and admins.</p>
                  </div>
                  {role === 'admin' && (
                    <motion.div layoutId="check" className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Check size={16} className="text-white" />
                    </motion.div>
                  )}
                </button>

                <button
                  onClick={handleNextStep}
                  className="w-full btn-primary py-3 mt-1 flex items-center justify-center gap-3 rounded-xl shadow-xl group transition-all duration-300 hover:brightness-110"
                >
                  <span className="font-black uppercase tracking-widest text-xs text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.2)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300">
                    Next Step
                  </span>
                </button>

                <button 
                  onClick={handleSignOut}
                  className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                  Sign Out / Switch Account
                </button>
              </div>
            </div>
          );
        } else {
          return (
            <div className="w-full space-y-4">
              <div className="text-center space-y-0.5">
                <h2 className="text-lg font-black text-white uppercase tracking-widest">Syllabus Selection</h2>
                <p className="text-white text-[9px] font-black uppercase tracking-widest">Choose your primary teaching syllabus</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {['SPM', 'UEC', 'IGCSE'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSyllabus(s)}
                    className={cn(
                      "w-full p-3 rounded-xl border-2 transition-all duration-300 text-center group relative overflow-hidden",
                      syllabus === s
                        ? "brand-gradient-bg border-transparent shadow-[0_0_40px_rgba(0,255,255,0.2)]"
                        : "bg-white/5 border-white/10 hover:border-white/30"
                    )}
                  >
                    <span className="text-base font-black uppercase tracking-[0.3em] text-white">{s}</span>
                    {syllabus === s && (
                      <motion.div layoutId="check-s" className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Check size={16} className="text-white" />
                      </motion.div>
                    )}
                  </button>
                ))}

                <button
                  onClick={handleNextStep}
                  className="w-full btn-primary py-3 mt-1 flex items-center justify-center gap-3 rounded-xl shadow-xl group transition-all duration-300 hover:brightness-110"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <span className="font-black uppercase tracking-widest text-xs text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.2)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300">
                      Complete Setup
                    </span>
                  )}
                </button>

                <button 
                  onClick={handleSignOut}
                  className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                  Sign Out / Switch Account
                </button>
              </div>
            </div>
          );
        }
    }
  };

  return (
    <div className="min-h-screen bg-oxford-blue relative flex flex-col items-center justify-center py-24 overflow-y-auto">
      {/* Ambient Glows */}
      <div className="fixed top-0 right-1/4 w-[400px] h-[400px] glow-ambient-purple blur-[100px] opacity-15 pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 w-[500px] h-[500px] glow-ambient-cyan blur-[120px] opacity-10 pointer-events-none" />
      
      <div className="w-full max-w-md px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full"
        >
          <div className="brand-gradient-border glow-purple">
            <div className="glass-card p-4 md:p-5 flex flex-col items-center border border-white/5">
              <div className="w-full flex justify-end mb-4">
                <LanguageSwitcher />
              </div>
              {/* Logo */}
              <div className="relative mb-2 shrink-0">
                <div className="absolute inset-0 brand-gradient-bg blur-xl opacity-20 animate-pulse" />
                <img 
                  src="/Questect big.png" 
                  alt={`${APP_NAME} Logo`} 
                  className="h-10 w-auto relative z-10 rounded-lg shadow-lg" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/questect-favicon-v3.svg';
                    (e.target as HTMLImageElement).className = "h-10 w-10 relative z-10 rounded-xl shadow-lg";
                  }}
                />
              </div>
              
              <h1 className="text-lg md:text-xl font-black mb-0 text-white tracking-tighter uppercase text-center">{APP_NAME}</h1>
              <p className="text-white mb-3 text-center text-[8px] md:text-[9px] font-black uppercase tracking-[0.25em]">The gateway to professional AI grading.</p>

              {renderStep()}
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
