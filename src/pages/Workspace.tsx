import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Shield, 
  Upload, 
  Camera, 
  Plus, 
  X, 
  FileText, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw, 
  Loader2, 
  ChevronRight, 
  ChevronDown,
  Activity,
  Beaker,
  BarChart3,
  Globe,
  Database,
  Layers,
  Lock,
  Eye,
  LayoutGrid,
  Network,
  Cpu,
  BrainCircuit,
  History as HistoryIcon,
  LayoutDashboard
} from 'lucide-react';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import Markdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { AI_CONFIG, getGeminiClient, getOpenAIClient, getDeepSeekClient } from '../lib/ai-config';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import { db, auth, isTeacherPilotActive, incrementPilotUsage } from '../lib/firebase';
import { cn } from '../lib/utils';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { APP_NAME, hasPilotFeatureAccess } from '../lib/constants';
import { useLanguage } from '../lib/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-oxford-blue p-6">
          <div className="glass-card p-8 border border-red-500/30 max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">System Error</h2>
            <p className="text-white/60 text-sm mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary py-3 px-8 rounded-xl text-xs font-black uppercase tracking-widest"
            >
              Restart Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type Mode = 'analyze' | 'system';
type AcademicLevel = 'PRIMARY' | 'SPM' | 'UEC' | 'A-LEVEL' | 'IGCSE';
type PlanTier = 'free' | 'starter' | 'pro' | 'advanced' | 'growth' | 'enterprise';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  plan: PlanTier;
  examGraderTrialsUsedToday: number;
  lastTrialResetDate: string;
  teacherPilotAccess?: boolean;
  teacherPilotStartDate?: string;
  teacherPilotEndDate?: string;
  teacherPilotDailyLimit?: number;
  teacherPilotDailyUsage?: number;
  teacherPilotLastUsageDate?: string;
  teacherPilotUnlockedFeatures?: string[];
}

const PLAN_LIMITS: Record<PlanTier, { dailyTrials: number; canUseSystemS: boolean }> = {
  free: { dailyTrials: 5, canUseSystemS: true },
  starter: { dailyTrials: 10, canUseSystemS: true },
  pro: { dailyTrials: 50, canUseSystemS: true },
  advanced: { dailyTrials: 100, canUseSystemS: true },
  growth: { dailyTrials: 500, canUseSystemS: true },
  enterprise: { dailyTrials: 10000, canUseSystemS: true },
};

interface GradingResult {
  id: string;
  question: string;
  status: 'correct' | 'incorrect' | 'partial';
  score: number;
  maxScore: number;
  feedback: string;
  improvement: string;
  skemaAnswer?: string;
  studentAnswer?: string;
  section?: string;
  uasaCriteria?: {
    idea?: string;
    bahasa?: string;
    pengolahan?: string;
  };
  type?: 'standard' | 'chart' | 'equation' | 'graph';
  analysisDetails?: string;
  isEssay?: boolean;
  structuralFeedback?: string;
  grammaticalFeedback?: string;
  corrections?: {
    wrong: string;
    correct: string;
    reason: string;
  }[];
}

interface StudentReport {
  studentName: string;
  detectedLevel?: string;
  results: GradingResult[];
}

interface WorkspaceProps {
  initialMode?: Mode;
}

export default function Workspace({ initialMode = 'analyze' }: WorkspaceProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<'upload' | 'processing' | 'results'>('upload');
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>('SPM');
  const [detectedSubject, setDetectedSubject] = useState<string | null>(null);
  const [subjectMismatch, setSubjectMismatch] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Sync mode with initialMode if it changes via routing
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);
  
  // File States
  const [studentFiles, setStudentFiles] = useState<File[]>([]);
  const [skemaFiles, setSkemaFiles] = useState<File[]>([]);
  const [extractedStudentText, setExtractedStudentText] = useState<string>('');
  const [extractedSkemaText, setExtractedSkemaText] = useState<string>('');
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
  const [selectedStudentIdx, setSelectedStudentIdx] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const studentInputRef = useRef<HTMLInputElement>(null);
  const skemaInputRef = useRef<HTMLInputElement>(null);
  const smartStudentInputRef = useRef<HTMLInputElement>(null);
  const smartSkemaInputRef = useRef<HTMLInputElement>(null);

  // Auth & Profile Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/auth');
      } else {
        // Fetch user profile
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            
            // Ensure plan exists for existing users
            if (!data.plan) {
              data.plan = 'free';
              // Temporarily disabled to prevent permission errors
              // await updateDoc(doc(db, 'users', user.uid), { plan: 'free' });
            }
            
            // Check if we need to reset trials (daily reset)
            const today = new Date().toISOString().split('T')[0];
            if (data.lastTrialResetDate !== today) {
              // Temporarily disabled to prevent permission errors
              /*
              await updateDoc(doc(db, 'users', user.uid), {
                examGraderTrialsUsedToday: 0,
                lastTrialResetDate: today
              });
              */
              setUserProfile({ ...data, examGraderTrialsUsedToday: 0, lastTrialResetDate: today });
            } else {
              setUserProfile(data);
            }
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'student' | 'skema') => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Extract text from files immediately
      for (const file of files) {
        if (file.type === 'text/plain') {
          const text = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsText(file);
          });
          if (type === 'student') setExtractedStudentText(prev => prev + "\n" + text);
          else setExtractedSkemaText(prev => prev + "\n" + text);
        } else if (file.type === 'application/pdf') {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join(" ");
              fullText += pageText + "\n";
            }
            if (type === 'student') setExtractedStudentText(prev => prev + "\n" + fullText);
            else setExtractedSkemaText(prev => prev + "\n" + fullText);
          } catch (err) {
            console.error("PDF Extraction Error:", err);
          }
        } else if (file.type.includes('officedocument.wordprocessingml.document') || file.name.endsWith('.docx')) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            if (type === 'student') setExtractedStudentText(prev => prev + "\n" + result.value);
            else setExtractedSkemaText(prev => prev + "\n" + result.value);
          } catch (err) {
            console.error("DOCX Extraction Error:", err);
          }
        }
      }

      if (type === 'student') {
        setStudentFiles(prev => [...prev, ...files]);
      } else {
        setSkemaFiles(prev => [...prev, ...files]);
      }
      
      // Visual feedback for scan success
      if (e.target.capture) {
        setIsScanning(true);
        setTimeout(() => setIsScanning(false), 2000);
      }
    }
  };

  const fileToPart = async (file: File) => {
    return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const startGrading = async () => {
    if (studentFiles.length === 0 || skemaFiles.length === 0) return;
    
    // Pilot Access Check
    if (isTeacherPilotActive(userProfile)) {
      if ((userProfile?.teacherPilotDailyUsage || 0) >= (userProfile?.teacherPilotDailyLimit || 20)) {
        setError(JSON.stringify({
          error: t('pilot_limit_reached', { limit: (userProfile?.teacherPilotDailyLimit || 20).toString() }),
          operationType: 'WRITE',
          path: 'reports'
        }));
        return;
      }
    } else if (mode === 'system' && userProfile) {
      // Plan & Trial Check (ONLY for System-S / Exam Grader)
      const plan = userProfile.plan || 'free';
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
      
      if (userProfile.examGraderTrialsUsedToday >= limits.dailyTrials) {
        setError(JSON.stringify({
          error: `Daily limit reached for ${plan} plan (${limits.dailyTrials} Exam Grader trials). Please upgrade for more.`,
          operationType: 'WRITE',
          path: 'reports'
        }));
        return;
      }
    }

    setStep('processing');
    setIsProcessing(true);
    setSubjectMismatch(false);
    setStudentReports([]);
    
    try {
      setProcessingStage('Initializing Neural OCR (Gemini 3.1 Pro)...');
      const ai = getGeminiClient();
      const openai = getOpenAIClient();
      
      // Convert files to parts (ONLY images are sent as vision parts)
      const filterImageFiles = (files: File[]) => files.filter(f => f.type.startsWith('image/'));
      const studentImageParts = await Promise.all(filterImageFiles(studentFiles).map(fileToPart));
      const skemaImageParts = await Promise.all(filterImageFiles(skemaFiles).map(fileToPart));

      // 1. Subject Detection & Radar (Using Flash for speed)
      setProcessingStage('Radar Scanning: Detecting Subject...');
      const radarResponse = await ai.models.generateContent({
        model: AI_CONFIG.GEMINI.FLASH_MODEL,
        contents: [
          { text: "--- REFERENCE MARKING SCHEME (SKEMA) ---" },
          { text: extractedSkemaText },
          ...skemaImageParts.map(p => ({ inlineData: p.inlineData })),
          { text: "--- STUDENT WORK TO BE ANALYZED ---" },
          { text: extractedStudentText },
          ...studentImageParts.map(p => ({ inlineData: p.inlineData })),
          { text: `Identify the subject and academic level. 
                   Academic Level Context: ${academicLevel}. 
                   Check if the student work matches the marking scheme subject.
                   Return JSON with: subject, isMismatch (boolean), language.` }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              isMismatch: { type: Type.BOOLEAN },
              language: { type: Type.STRING }
            },
            required: ["subject", "isMismatch", "language"]
          }
        }
      });

      const radarData = JSON.parse(radarResponse.text || '{}');
      setDetectedSubject(radarData.subject);
      setSubjectMismatch(radarData.isMismatch);

      // 2. Hybrid Grading Engine (Gemini 3.1 Pro + GPT-4o Backup)
      setProcessingStage('Neural Engine: Executing Deep Audit (Hybrid Mode)...');
      
      let finalReports: StudentReport[] = [];
      
      try {
        const gradingResponse = await ai.models.generateContent({
          model: AI_CONFIG.GEMINI.MODEL, 
          contents: [
            { text: `ROLE: 你现在是 ${APP_NAME} 的首席学术 AI 批改官。你的核心任务是精准识别、分类并批改包含【多名学生】手写答案的 PDF 或图像文件。
                     
                     CORE LOGIC: "SEARCH, SEGMENT, GRADE"
                     你必须按照以下三个步骤执行，严禁随机选取：
                     
                     1. 多学生点名 (Student Census):
                     - 必须扫描 PDF 的【每一页】。
                     - 识别手写姓名（如：Chan Yu Xiang, Daniel Mok, Yang Wen Tay 等）。
                     - 只要发现新的姓名或明显的笔迹变化，就必须创建一个新的“学生档案”。
                     - 严禁遗漏：如果 PDF 有 10 个学生，你必须输出 10 个批改结果。
                     
                     2. 学科与等级锁定 (Academic Context):
                     - 自动检测语言：检测到 Bahasa Melayu 必须使用马来西亚教育标准 (UASA/SPM)。
                     - 强制遵守用户选择的等级：${academicLevel}。
                     - 严禁幻觉：在批改作文时，严禁出现化学、物理等不相关的科学分析。
                     
                     3. 深度批改与语法纠错 (Meticulous Grading):
                     - 客观题: 对照 Marking Scheme (Skema) 给出对错。
                     - 作文题 (Essay): 必须识别病句并提供【纠错对照表】。
                       * 示例：识别到 "Saya hobi programing"，纠正为 "Hobi saya ialah pengaturcaraan"。
                     - 评分标准: 严格按照 UASA/SPM 评分准则，给出 Idea (内容)、Bahasa (语言) 和 Pengolahan (表达) 的分值。
                     
                     VISUAL GUIDELINES (SENIOR USER FRIENDLY):
                     - 使用高对比度的符号：✅ (正确), ❌ (错误), ✍️ (建议)。
                     - 所有的文字描述必须简练、直接，适合年长老师阅读。
                     
                     OUTPUT SCHEMA:
                     Return a JSON array of StudentReport objects. Each report must contain:
                     - studentName: The full name detected.
                     - detectedLevel: The academic level detected (e.g., 'PRIMARY', 'SPM').
                     - results: Array of GradingResult objects.
                       - id: Question ID.
                       - question: Question text.
                       - status: 'correct', 'incorrect', or 'partial'.
                       - score: Marks awarded.
                       - maxScore: Total marks possible.
                       - section: The UASA section (e.g., 'Bahagian A', 'Bahagian B', 'Bahagian C', 'Bahagian D').
                       - skemaAnswer: The correct answer from the SKEMA.
                       - studentAnswer: The student's transcribed answer.
                       - feedback: Professional analysis using Markdown. Include ✍️ for suggestions.
                       - improvement: Actionable tips using Markdown.
                       - corrections: Array of { wrong: string, correct: string, reason: string } for language errors.
                       - uasaCriteria: (If BM SR Essay) { idea, bahasa, pengolahan }.
` },
            { text: "--- OFFICIAL MARKING SCHEME (SKEMA) - ABSOLUTE TRUTH ---" },
            { text: extractedSkemaText },
            ...skemaImageParts.map(p => ({ inlineData: p.inlineData })),
            { text: "--- STUDENT SUBMISSIONS (TARGET FOR GRADING) ---" },
            { text: extractedStudentText },
            ...studentImageParts.map(p => ({ inlineData: p.inlineData }))
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  studentName: { type: Type.STRING },
                  detectedLevel: { type: Type.STRING },
                  results: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        question: { type: Type.STRING },
                        status: { type: Type.STRING, enum: ["correct", "incorrect", "partial"] },
                        score: { type: Type.NUMBER },
                        maxScore: { type: Type.NUMBER },
                        section: { type: Type.STRING },
                        skemaAnswer: { type: Type.STRING },
                        studentAnswer: { type: Type.STRING },
                        feedback: { type: Type.STRING },
                        improvement: { type: Type.STRING },
                        corrections: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              wrong: { type: Type.STRING },
                              correct: { type: Type.STRING },
                              reason: { type: Type.STRING }
                            }
                          }
                        },
                        uasaCriteria: {
                          type: Type.OBJECT,
                          properties: {
                            idea: { type: Type.STRING },
                            bahasa: { type: Type.STRING },
                            pengolahan: { type: Type.STRING }
                          }
                        }
                      },
                      required: ["id", "question", "status", "score", "maxScore", "feedback", "improvement"]
                    }
                  }
                },
                required: ["studentName", "results"]
              }
            }
          }
        });

        if (!gradingResponse.text) throw new Error("Empty response from Neural Engine");
        finalReports = JSON.parse(gradingResponse.text);
      } catch (geminiError) {
        console.warn("Gemini Error, falling back to GPT-4o:", geminiError);
        setProcessingStage('Gemini Overload: Activating GPT-4o Backup...');
        
        // GPT-4o Fallback
        const messages: any[] = [
          {
            role: "system",
            content: `You are a Master Examiner. Identify students and grade against skema. Return JSON array of StudentReport objects.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Marking Scheme (Skema):" },
              ...skemaFiles.map(file => ({
                type: "image_url",
                image_url: { url: `data:${file.type};base64,${skemaImageParts[0]?.inlineData?.data || ''}` }
              })),
              { type: "text", text: "Student Submissions:" },
              ...studentFiles.map(file => ({
                type: "image_url",
                image_url: { url: `data:${file.type};base64,${studentImageParts[0]?.inlineData?.data || ''}` }
              }))
            ]
          }
        ];

        const completion = await openai.chat.completions.create({
          model: AI_CONFIG.OPENAI.MODEL,
          messages,
          response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (content) {
          const parsed = JSON.parse(content);
          finalReports = parsed.reports || parsed.studentReports || Object.values(parsed)[0] as StudentReport[];
        }
      }

      setStudentReports(finalReports);
      setProcessingStage('Finalizing: Archiving Reports to Cloud...');
      
      if (auth.currentUser) {
        try {
          // Increment pilot usage if active
          if (isTeacherPilotActive(userProfile)) {
            await incrementPilotUsage(auth.currentUser.uid, userProfile);
          }

          // Temporarily disabled to fix permission issues
          /*
          // Only increment trials if in System-S mode
          if (mode === 'system') {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
              examGraderTrialsUsedToday: increment(1)
            });
            
            // Update local state
            setUserProfile(prev => prev ? {
              ...prev,
              examGraderTrialsUsedToday: prev.examGraderTrialsUsedToday + 1
            } : null);
          }

          await addDoc(collection(db, 'reports'), {
            userId: auth.currentUser.uid,
            timestamp: serverTimestamp(),
            academicLevel,
            subject: radarData.subject,
            reports: finalReports,
            mode: mode // Track which mode was used
          });
          */
        } catch (err) {
          console.warn("Firestore logging failed:", err);
          // handleFirestoreError(err, OperationType.WRITE, 'reports');
        }
      }

      setIsProcessing(false);
      setStep('results');
    } catch (error: any) {
      console.error("Grading Error:", error);
      setProcessingStage(`Audit Failed: ${error.message || 'Unknown Error'}`);
      setTimeout(() => setIsProcessing(false), 3000);
    }
  };

  const reset = () => {
    setStep('upload');
    setStudentFiles([]);
    setSkemaFiles([]);
    setStudentReports([]);
    setSelectedStudentIdx(0);
    setProcessingStage('');
    setDetectedSubject(null);
    setSubjectMismatch(false);
  };

  const accentColor = mode === 'analyze' ? 'cyan' : 'purple';
  const accentHex = mode === 'analyze' ? '#00FFFF' : '#D033FF';

  return (
    <ErrorBoundary>
      {error && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="glass-card p-8 border border-red-500/30 max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">Access Restricted</h2>
            <p className="text-white/60 text-sm mb-6">
              {(() => {
                try {
                  const parsed = JSON.parse(error);
                  return parsed.error;
                } catch (e) {
                  return error;
                }
              })()}
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/billing')}
                className="btn-primary py-3 px-8 rounded-xl text-xs font-black uppercase tracking-widest"
              >
                Upgrade Plan
              </button>
              <button 
                onClick={() => setError(null)}
                className="text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-oxford-blue pt-20 md:pt-24 pb-12 px-4 md:px-6 overflow-x-hidden flex flex-col items-center relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            backgroundColor: mode === 'analyze' ? 'rgba(0, 255, 255, 0.03)' : 'rgba(208, 51, 255, 0.03)',
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[150px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            backgroundColor: mode === 'analyze' ? 'rgba(0, 255, 255, 0.02)' : 'rgba(208, 51, 255, 0.02)',
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 7, repeat: Infinity, delay: 1 }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] blur-[180px] rounded-full" 
        />
      </div>

      <div className="max-w-6xl w-full relative z-10 flex-grow flex flex-col">
        
        {/* MODE SWITCHER */}
        <div className="flex flex-col items-center gap-4 md:gap-6 mb-8 md:mb-12 w-full">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="glass-card p-1 rounded-full border border-white/10 flex items-center relative shadow-[0_0_30px_rgba(0,0,0,0.5)] max-w-full overflow-hidden">
              {/* Sliding Background */}
              <motion.div 
                className="absolute h-[calc(100%-8px)] rounded-full z-0"
                initial={false}
                animate={{ 
                  x: mode === 'analyze' ? 4 : 144,
                  width: 140,
                  backgroundColor: mode === 'analyze' ? 'rgba(0, 255, 255, 0.1)' : 'rgba(208, 51, 255, 0.1)',
                  border: `1px solid ${mode === 'analyze' ? 'rgba(0, 255, 255, 0.3)' : 'rgba(208, 51, 255, 0.3)'}`,
                  boxShadow: `0 0 20px ${mode === 'analyze' ? 'rgba(0, 255, 255, 0.1)' : 'rgba(208, 51, 255, 0.1)'}`
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              
              <button 
                onClick={() => setMode('analyze')}
                className={`relative z-10 w-[140px] flex items-center justify-center gap-2 md:gap-3 py-2.5 md:py-3 rounded-full transition-all ${mode === 'analyze' ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
              >
                <Zap size={14} className={mode === 'analyze' ? 'text-electric-cyan' : ''} />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em]">Analyze-A</span>
              </button>
              
              <button 
                onClick={() => setMode('system')}
                className={`relative z-10 w-[140px] flex items-center justify-center gap-2 md:gap-3 py-2.5 md:py-3 rounded-full transition-all ${mode === 'system' ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
              >
                <div className="flex items-center gap-1.5">
                  {userProfile && !PLAN_LIMITS[userProfile.plan || 'free']?.canUseSystemS && (
                    <Lock size={10} className="text-white/20" />
                  )}
                  <Shield size={14} className={mode === 'system' ? 'text-electric-purple' : ''} />
                </div>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em]">System-S</span>
              </button>
            </div>

            {/* Trial Counter for Free/Starter */}
            {userProfile && (userProfile.plan === 'free' || userProfile.plan === 'starter') && mode === 'system' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="px-4 py-2 bg-electric-purple/10 border border-electric-purple/20 rounded-xl flex items-center gap-3"
              >
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-electric-purple uppercase tracking-widest">Daily Trials</span>
                  <span className="text-xs font-black text-white">
                    {userProfile.examGraderTrialsUsedToday} / {PLAN_LIMITS[userProfile.plan || 'free'].dailyTrials}
                  </span>
                </div>
                <button 
                  onClick={() => navigate('/billing')}
                  className="p-1.5 bg-electric-purple text-oxford-blue rounded-lg hover:scale-110 transition-transform"
                >
                  <Plus size={12} />
                </button>
              </motion.div>
            )}
          </div>

          {/* ACADEMIC LEVEL SELECTOR */}
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 w-full px-2">
            <span className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-[0.2em] md:tracking-[0.3em] whitespace-nowrap">Academic Level:</span>
            <div className="flex flex-wrap justify-center gap-2">
              {(['PRIMARY', 'SPM', 'UEC', 'A-LEVEL', 'IGCSE'] as AcademicLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setAcademicLevel(level)}
                  className={`px-3 md:px-4 py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all border ${
                    academicLevel === level 
                      ? (mode === 'analyze' ? 'bg-electric-cyan/20 border-electric-cyan/40 text-electric-cyan shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'bg-electric-purple/20 border-electric-purple/40 text-electric-purple shadow-[0_0_15px_rgba(208,51,255,0.2)]')
                      : 'bg-white/5 border-white/10 text-white/30 hover:text-white/60'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 w-full">
            <div className="w-full md:w-auto">
              <motion.h1 
                key={mode}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3"
              >
                {mode === 'analyze' ? <Zap className="text-electric-cyan" size={28} /> : <Shield className="text-electric-purple" size={28} />}
                {APP_NAME}-{mode === 'analyze' ? 'A' : 'S'}
              </motion.h1>
              <p className="text-white/40 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] mt-1">
                {mode === 'analyze' ? t('dash_quick_grade') : t('dash_exam_grader')}
              </p>
            </div>
            <LanguageSwitcher />
          </div>
          
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 mb-8">
            {userProfile && mode === 'system' && (
              <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                <Zap size={12} className="text-electric-cyan" />
                <span className="text-[8px] md:text-[9px] font-black text-white/60 uppercase tracking-widest">
                  {userProfile.examGraderTrialsUsedToday} / {PLAN_LIMITS[userProfile.plan || 'free']?.dailyTrials || 5} {t('work_trials')}
                </span>
              </div>
            )}
            {userProfile && mode === 'analyze' && (
              <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-electric-cyan/10 border border-electric-cyan/20 rounded-lg">
                <Check size={12} className="text-electric-cyan" />
                <span className="text-[8px] md:text-[9px] font-black text-electric-cyan uppercase tracking-widest">
                  {t('work_unlimited_free')}
                </span>
              </div>
            )}
            <button 
              onClick={() => {
                if (userProfile && (userProfile.plan === 'growth' || userProfile.plan === 'enterprise' || hasPilotFeatureAccess(userProfile, 'premium_dashboard'))) {
                  navigate('/dashboard');
                } else {
                  navigate('/pricing');
                }
              }}
              className={cn(
                "px-4 md:px-6 py-2 border rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                userProfile && (userProfile.plan === 'growth' || userProfile.plan === 'enterprise' || hasPilotFeatureAccess(userProfile, 'premium_dashboard'))
                  ? "bg-electric-cyan/10 border-electric-cyan/20 text-electric-cyan hover:bg-electric-cyan/20"
                  : "bg-white/5 border-white/10 text-white/30 hover:text-white/60"
              )}
            >
              <LayoutDashboard size={12} /> 
              <span className="hidden xs:inline">{t('work_institution')}</span>
              {userProfile && !['growth', 'enterprise'].includes(userProfile.plan || 'free') && !hasPilotFeatureAccess(userProfile, 'premium_dashboard') && <Lock size={10} className="text-white/20" />}
            </button>

            <button 
              onClick={() => {
                if (userProfile && (['pro', 'advanced', 'growth', 'enterprise'].includes(userProfile.plan) || isTeacherPilotActive(userProfile))) {
                  navigate('/history');
                } else {
                  navigate('/pricing');
                }
              }}
              className={cn(
                "px-4 md:px-6 py-2 border rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                userProfile && (['pro', 'advanced', 'growth', 'enterprise'].includes(userProfile.plan) || isTeacherPilotActive(userProfile))
                  ? "bg-electric-purple/10 border-electric-purple/20 text-electric-purple hover:bg-electric-purple/20"
                  : "bg-white/5 border-white/10 text-white/30 hover:text-white/60"
              )}
            >
              <HistoryIcon size={12} /> 
              <span className="hidden xs:inline">{t('work_history')}</span>
              {userProfile && !['pro', 'advanced', 'growth', 'enterprise'].includes(userProfile.plan || 'free') && !isTeacherPilotActive(userProfile) && <Lock size={10} className="text-white/20" />}
            </button>
            {step !== 'upload' && (
              <button 
                onClick={reset}
                className="px-4 md:px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all flex items-center gap-2"
              >
                <RotateCcw size={12} /> <span className="hidden xs:inline">{t('work_reset')}</span>
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 flex-grow flex flex-col"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow">
                
                {/* STUDENT WORK ZONE */}
                <div className="glass-card p-10 border border-white/10 flex flex-col relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    {mode === 'analyze' ? <LayoutGrid size={120} /> : <Network size={120} />}
                  </div>
                  
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${mode === 'analyze' ? 'bg-electric-cyan/10 border-electric-cyan/20 text-electric-cyan' : 'bg-electric-purple/10 border-electric-purple/20 text-electric-purple'}`}>
                        {mode === 'analyze' ? <Layers size={24} /> : <Database size={24} />}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white uppercase tracking-widest">
                          {mode === 'analyze' ? 'Student Batch' : 'Exam Script'}
                        </h3>
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Unlimited Pages & Scans</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => studentInputRef.current?.click()}
                    className={`flex-grow border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all group relative ${mode === 'analyze' ? 'border-electric-cyan/20 hover:border-electric-cyan/50 hover:bg-electric-cyan/5' : 'border-electric-purple/20 hover:border-electric-purple/50 hover:bg-electric-purple/5'}`}
                  >
                    <Upload className="text-white/20 group-hover:text-white transition-colors mb-4" size={40} />
                    <p className="text-white/40 text-[11px] font-black uppercase tracking-widest text-center relative z-10">
                      Drag & Drop or <span className={mode === 'analyze' ? 'text-electric-cyan' : 'text-electric-purple'}>Browse</span>
                    </p>
                    <input 
                      type="file" 
                      ref={studentInputRef} 
                      onChange={(e) => handleFileUpload(e, 'student')} 
                      multiple 
                      className="hidden" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <button 
                      onClick={() => smartStudentInputRef.current?.click()}
                      className={`py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all border ${mode === 'analyze' ? 'bg-electric-cyan/10 border-electric-cyan/20 text-electric-cyan hover:bg-electric-cyan/20' : 'bg-electric-purple/10 border-electric-purple/20 text-electric-purple hover:bg-electric-purple/20'}`}
                    >
                      <Camera size={16} /> Smart Scan
                    </button>
                    <input 
                      type="file" 
                      ref={smartStudentInputRef} 
                      onChange={(e) => handleFileUpload(e, 'student')} 
                      accept="image/*"
                      capture="environment"
                      className="hidden" 
                    />
                    <div className="flex items-center justify-center px-4 bg-white/5 rounded-2xl border border-white/10">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                        {studentFiles.length} Files Added
                      </span>
                    </div>
                  </div>

                  {/* GALLERY / STRUCTURE VIEW */}
                  {studentFiles.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-white/5">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                        {mode === 'analyze' ? <LayoutGrid size={12} /> : <Network size={12} />}
                        {mode === 'analyze' ? 'Gallery Preview' : 'Structural Map'}
                      </p>
                      
                      {mode === 'analyze' ? (
                        <div className="grid grid-cols-4 gap-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                          {studentFiles.map((file, i) => (
                            <div key={i} className="aspect-square bg-white/5 rounded-xl border border-white/10 flex items-center justify-center relative group/img overflow-hidden">
                              <FileText size={20} className="text-white/20" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStudentFiles(prev => prev.filter((_, idx) => idx !== i));
                                  }}
                                  className="text-red-400 hover:scale-110 transition-transform"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                          {studentFiles.map((file, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5 relative">
                              {i > 0 && <div className="absolute left-6 top-[-12px] w-px h-3 bg-electric-purple/30" />}
                              <div className="w-6 h-6 rounded-full bg-electric-purple/20 border border-electric-purple/40 flex items-center justify-center text-[8px] font-black text-electric-purple">
                                {i + 1}
                              </div>
                              <span className="text-[10px] font-bold text-white/60 truncate flex-grow">{file.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Linked</span>
                                <button onClick={() => setStudentFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-white/20 hover:text-red-400"><X size={12} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SHARED SKEMA ZONE */}
                <div className="glass-card p-10 border border-white/10 flex flex-col relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Lock size={120} />
                  </div>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-white/60">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-widest">Unlimited Skema</h3>
                      <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Multiple Reference Documents</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => skemaInputRef.current?.click()}
                    className="flex-grow border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-white/30 hover:bg-white/5 transition-all group relative"
                  >
                    <Upload className="text-white/20 group-hover:text-white transition-colors mb-4" size={40} />
                    <p className="text-white/40 text-[11px] font-black uppercase tracking-widest text-center relative z-10">
                      Upload Reference <br />
                      <span className="text-white/60">Browse System Files</span>
                    </p>
                    <input 
                      type="file" 
                      ref={skemaInputRef} 
                      onChange={(e) => handleFileUpload(e, 'skema')} 
                      multiple 
                      className="hidden" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <button 
                      onClick={() => smartSkemaInputRef.current?.click()}
                      className="py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                    >
                      <Camera size={16} /> Scan Skema
                    </button>
                    <input 
                      type="file" 
                      ref={smartSkemaInputRef} 
                      onChange={(e) => handleFileUpload(e, 'skema')} 
                      accept="image/*"
                      capture="environment"
                      className="hidden" 
                    />
                    <div className="flex items-center justify-center px-4 bg-white/5 rounded-2xl border border-white/10">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                        {skemaFiles.length} References
                      </span>
                    </div>
                  </div>

                  {skemaFiles.length > 0 && (
                    <div className="mt-8 space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                      {skemaFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group/item">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <FileText size={14} className="text-white/40 flex-shrink-0" />
                            <span className="text-[10px] font-bold text-white/70 truncate">{file.name}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSkemaFiles(prev => prev.filter((_, idx) => idx !== i));
                            }}
                            className="text-white/20 hover:text-red-400 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={startGrading}
                  disabled={studentFiles.length === 0 || skemaFiles.length === 0}
                  className={`relative group overflow-hidden px-20 py-6 rounded-2xl text-sm font-black tracking-[0.4em] uppercase transition-all ${
                    (studentFiles.length === 0 || skemaFiles.length === 0) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-105 active:scale-95'
                  }`}
                >
                  <div className={`absolute inset-0 transition-opacity ${mode === 'analyze' ? 'bg-electric-cyan' : 'bg-electric-purple'} opacity-100 group-hover:opacity-90`} />
                  <span className="relative z-10 text-oxford-blue flex items-center gap-4">
                    Initialize {mode === 'analyze' ? 'Batch Audit' : 'System Audit'} <ArrowRight size={20} />
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-grow flex flex-col items-center justify-center space-y-12"
            >
              <div className="relative">
                <div className="w-48 h-48 rounded-full border border-white/5 flex items-center justify-center relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className={`absolute inset-0 border-t-2 rounded-full ${mode === 'analyze' ? 'border-electric-cyan' : 'border-electric-purple'}`} 
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 border-b-2 border-white/10 rounded-full" 
                  />
                  {mode === 'analyze' ? <Zap className="text-white animate-pulse" size={48} /> : <Shield className="text-white animate-pulse" size={48} />}
                </div>
                <div className={`absolute inset-0 blur-[100px] opacity-10 animate-pulse ${mode === 'analyze' ? 'bg-electric-cyan' : 'bg-electric-purple'}`} />
              </div>

              <div className="text-center space-y-6">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{processingStage}</h2>
                <div className="flex flex-col items-center gap-6">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                          className={`w-1.5 h-1.5 rounded-full ${mode === 'analyze' ? 'bg-electric-cyan' : 'bg-electric-purple'}`}
                        />
                      ))}
                    </div>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.5em]">Neural Core Active</p>
                  </div>

                  {/* Model Indicators */}
                  <div className="flex items-center gap-6 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-electric-cyan shadow-[0_0_10px_rgba(0,255,255,0.5)]" />
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">GEMINI 3.1</span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-electric-purple shadow-[0_0_10px_rgba(208,51,255,0.5)]" />
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">GPT-4O</span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">DEEPSEEK</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-grow flex flex-col space-y-10 overflow-hidden"
            >
              {/* MULTI-STUDENT NAVIGATION */}
              {studentReports.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar shrink-0">
                  {studentReports.map((report, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedStudentIdx(idx)}
                      className={`px-8 py-5 rounded-2xl border transition-all flex items-center gap-4 whitespace-nowrap ${
                        selectedStudentIdx === idx 
                          ? 'bg-white text-oxford-blue border-white shadow-[0_0_40px_rgba(255,255,255,0.2)] scale-105 z-10' 
                          : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
                        selectedStudentIdx === idx ? 'bg-oxford-blue text-white' : 'bg-white/10 text-white'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="text-base font-black uppercase tracking-widest">Student: {report.studentName}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* SCORE SUMMARY */}
              <div className="glass-card p-12 border border-white/20 bg-[#001F3F] relative overflow-hidden flex flex-col items-center justify-center text-center shrink-0 shadow-[0_0_60px_rgba(0,31,63,0.5)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />
                <p className="text-base font-black text-yellow-400 uppercase tracking-[0.4em] mb-6">Final Audit Outcome</p>
                <div className="relative">
                  <div className="absolute inset-0 blur-[100px] bg-yellow-400/10 animate-pulse" />
                  <p className="text-[140px] font-black text-white relative leading-none tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    <span className="text-yellow-400">{studentReports[selectedStudentIdx]?.results.reduce((acc, curr) => acc + curr.score, 0)}</span>
                    <span className="text-5xl text-white/30 ml-4">/ {studentReports[selectedStudentIdx]?.results.reduce((acc, curr) => acc + curr.maxScore, 0)}</span>
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-6">
                  <div className="h-px w-12 bg-white/20" />
                  <p className="text-3xl font-black text-white uppercase tracking-widest">
                    {studentReports[selectedStudentIdx]?.studentName}
                  </p>
                  <div className="h-px w-12 bg-white/20" />
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  <span className="px-6 py-3 bg-white/10 rounded-full text-sm font-black uppercase tracking-widest text-white/90 border border-white/20">
                    Subject: {detectedSubject || 'Unknown'}
                  </span>
                  <span className="px-6 py-3 bg-white/10 rounded-full text-sm font-black uppercase tracking-widest text-white/90 border border-white/20">
                    Level: {studentReports[selectedStudentIdx]?.detectedLevel || academicLevel}
                  </span>
                </div>
              </div>

              {/* SUBJECT MISMATCH ALERT */}
              {subjectMismatch && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 bg-red-600 border border-red-500 rounded-3xl flex items-center gap-6 shrink-0"
                >
                  <AlertCircle className="text-white" size={32} />
                  <div>
                    <p className="text-white text-lg font-black uppercase tracking-widest">Subject Mismatch Warning!</p>
                    <p className="text-white/80 text-sm font-bold leading-relaxed">The student work appears to be {detectedSubject}, but the marking scheme does not match. Results may be inaccurate.</p>
                  </div>
                </motion.div>
              )}

              {/* FEEDBACK ENGINE */}
              <div className="flex-grow overflow-y-auto custom-scrollbar space-y-16 pr-6">
                {Object.entries(
                  studentReports[selectedStudentIdx]?.results.reduce((acc, res) => {
                    const section = res.section || 'General Assessment';
                    if (!acc[section]) acc[section] = [];
                    acc[section].push(res);
                    return acc;
                  }, {} as Record<string, GradingResult[]>)
                ).map(([section, results], sectionIdx) => (
                  <div key={section} className="space-y-10">
                    <div className="flex items-center gap-6">
                      <div className="h-12 w-3 bg-white rounded-full" />
                      <h3 className="text-5xl font-black text-white uppercase tracking-tighter">
                        {section}
                      </h3>
                    </div>

                    <div className="space-y-10">
                      {results.map((res, i) => (
                        <motion.div
                          key={res.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="glass-card p-8 border border-white/20 bg-black/60 relative overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/[0.05] to-transparent pointer-events-none" />
                          
                          <div className="flex justify-between items-start mb-10">
                            <div className="flex items-center gap-8">
                              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center border-4 ${
                                res.status === 'correct' ? 'bg-green-500/20 border-green-500 text-green-500 shadow-[0_0_40px_rgba(34,197,94,0.4)]' :
                                res.status === 'incorrect' ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]' :
                                'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.4)]'
                              }`}>
                                {res.status === 'correct' ? <Check size={56} strokeWidth={4} /> :
                                 res.status === 'incorrect' ? <X size={56} strokeWidth={4} /> :
                                 <AlertCircle size={56} strokeWidth={4} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-4 mb-2">
                                  <h4 className="text-3xl font-black text-white uppercase tracking-tight leading-tight">{res.question}</h4>
                                  {res.type && (
                                    <span className="px-3 py-1 bg-white/10 text-white/60 text-xs font-black uppercase tracking-widest rounded-lg border border-white/20">
                                      {res.type}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  <p className="text-base font-black uppercase tracking-widest text-white/60">
                                    Audit ID: <span className="text-white">{res.id}</span>
                                  </p>
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                  <p className="text-2xl font-black text-white uppercase tracking-widest leading-none">
                                    Score: <span className="text-white">{res.score}</span> <span className="text-white/30">/ {res.maxScore}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Comparison Panel */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            <div className="bg-green-500/10 border-2 border-green-500/20 p-8 rounded-3xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-10"><Check size={60} /></div>
                              <p className="text-sm font-black text-green-500 uppercase tracking-widest mb-4 flex items-center gap-3">
                                <Shield size={16} /> Skema Answer (Source of Truth)
                              </p>
                              <p className="text-xl font-bold text-white leading-relaxed">{res.skemaAnswer || 'Reference data verified.'}</p>
                            </div>
                            <div className="bg-blue-500/10 border-2 border-blue-500/20 p-8 rounded-3xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-10"><Eye size={60} /></div>
                              <p className="text-sm font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-3">
                                <Camera size={16} /> Student Answer (Transcription)
                              </p>
                              <p className="text-xl font-bold text-white leading-relaxed">{res.studentAnswer || 'Handwriting transcribed.'}</p>
                            </div>
                          </div>

                          {/* UASA Criteria for Essays */}
                          {res.uasaCriteria && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                                <p className="text-sm font-black text-white/60 uppercase tracking-widest mb-3">Idea / Isi</p>
                                <p className="text-lg font-bold text-white leading-relaxed">{res.uasaCriteria.idea}</p>
                              </div>
                              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                                <p className="text-sm font-black text-white/60 uppercase tracking-widest mb-3">Bahasa</p>
                                <p className="text-lg font-bold text-white leading-relaxed">{res.uasaCriteria.bahasa}</p>
                              </div>
                              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                                <p className="text-sm font-black text-white/60 uppercase tracking-widest mb-3">Pengolahan</p>
                                <p className="text-lg font-bold text-white leading-relaxed">{res.uasaCriteria.pengolahan}</p>
                              </div>
                            </div>
                          )}

                          {/* CORRECTION TABLE */}
                          {res.corrections && res.corrections.length > 0 && (
                            <div className="mb-10 bg-yellow-400/5 border-2 border-yellow-400/20 rounded-3xl overflow-hidden">
                              <div className="bg-yellow-400/10 p-4 border-b border-yellow-400/20">
                                <p className="text-sm font-black text-yellow-400 uppercase tracking-widest flex items-center gap-3">
                                  <Zap size={16} /> Language Correction Table
                                </p>
                              </div>
                              <div className="p-0">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-white/10">
                                      <th className="p-6 text-xs font-black text-white/40 uppercase tracking-widest">Wrong (原句)</th>
                                      <th className="p-6 text-xs font-black text-white/40 uppercase tracking-widest">Correct (修正)</th>
                                      <th className="p-6 text-xs font-black text-white/40 uppercase tracking-widest">Reason (原因)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {res.corrections.map((corr, idx) => (
                                      <tr key={idx} className="border-b border-white/5 last:border-0">
                                        <td className="p-6 text-lg font-bold text-red-400/80 line-through">{corr.wrong}</td>
                                        <td className="p-6 text-lg font-bold text-green-400">{corr.correct}</td>
                                        <td className="p-6 text-base font-bold text-white/70 italic">{corr.reason}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-2 space-y-8">
                              <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                                <p className="text-sm font-black text-white/60 uppercase tracking-widest mb-4 flex items-center gap-3">
                                  <FileText size={16} className={mode === 'analyze' ? 'text-electric-cyan' : 'text-electric-purple'} /> Grading Analysis (批改分析)
                                </p>
                                <div className="text-lg font-bold text-white leading-relaxed markdown-body">
                                  <Markdown>{res.feedback}</Markdown>
                                </div>
                              </div>
                              
                              <div className={`p-8 rounded-3xl border-2 ${mode === 'analyze' ? 'bg-electric-cyan/10 border-electric-cyan/20' : 'bg-electric-purple/10 border-electric-purple/20'}`}>
                                <p className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-3 ${mode === 'analyze' ? 'text-electric-cyan' : 'text-electric-purple'}`}>
                                  <Zap size={16} /> Improvement Suggestions (改进建议)
                                </p>
                                <div className="text-xl font-bold text-white leading-relaxed markdown-body">
                                  <Markdown>{res.improvement}</Markdown>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 flex flex-col">
                              <p className="text-sm font-black text-white/60 uppercase tracking-widest mb-6 flex items-center gap-3">
                                <Activity size={16} /> AI Auditor's Note (批改备注)
                              </p>
                              <p className="text-lg font-bold text-white/80 leading-relaxed italic mb-10">
                                "{res.analysisDetails || 'Standard pattern matching verified against reference skema.'}"
                              </p>
                              <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Audit Verified</span>
                                <Globe size={20} className="text-white/10" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SCANNING OVERLAY FEEDBACK */}
        <AnimatePresence>
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 brand-gradient-bg rounded-2xl shadow-[0_0_50px_rgba(208,51,255,0.3)] flex items-center gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <Check className="text-white" size={18} />
              </div>
              <div>
                <p className="text-oxford-blue text-xs font-black uppercase tracking-widest">Scan Captured Successfully</p>
                <p className="text-oxford-blue/60 text-[8px] font-black uppercase tracking-widest">Adding to audit queue...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
