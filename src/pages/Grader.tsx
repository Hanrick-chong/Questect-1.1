import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileText, CheckCircle2, XCircle, Send, Loader2, 
  Image as ImageIcon, Cpu, FolderUp, Monitor, Camera, 
  HardDrive, Cloud, ChevronDown, BookOpen, Brain, Zap,
  AlertTriangle, Info, Edit3, Check, RefreshCw
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { AI_CONFIG, getGeminiClient, getOpenAIClient } from '@/src/lib/ai-config';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { cn } from '@/src/lib/utils';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import { APP_NAME } from '@/src/lib/constants';

const gemini = getGeminiClient();
const openai = getOpenAIClient();

import { useLanguage } from '../lib/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface GraderProps {
  mode: 'quick' | 'exam';
}

export default function Grader({ mode }: GraderProps) {
  const [input, setInput] = useState('');
  const { t } = useLanguage();
  const [images, setImages] = useState<string[]>([]);
  const [studentFiles, setStudentFiles] = useState<File[]>([]);
  const [skema, setSkema] = useState('');
  const [skemaImage, setSkemaImage] = useState<string | null>(null);
  const [skemaFile, setSkemaFile] = useState<File | null>(null);
  const [examLevel, setExamLevel] = useState('SPM');
  const [isGrading, setIsGrading] = useState(false);
  const [gradingStage, setGradingStage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSkemaUploadModalOpen, setIsSkemaUploadModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // OCR Reliability Layer States
  const [ocrPreviewData, setOcrPreviewData] = useState<any>(null);
  const [isOcrReviewing, setIsOcrReviewing] = useState(false);
  const [scanWarnings, setScanWarnings] = useState<string[]>([]);
  const [ocrConfidence, setOcrConfidence] = useState<'high' | 'medium' | 'low'>('high');
  const [isValidating, setIsValidating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skemaFileInputRef = useRef<HTMLInputElement>(null);
  const skemaInputRef = useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const today = new Date().toISOString().split('T')[0];
          if (data.lastTrialResetDate !== today) {
            await updateDoc(doc(db, 'users', user.uid), {
              examGraderTrialsUsedToday: 0,
              lastTrialResetDate: today
            }).catch(console.error);
            setUserProfile({ ...data, examGraderTrialsUsedToday: 0, lastTrialResetDate: today });
          } else {
            setUserProfile(data);
          }
        }

        // Check for reportId in URL
        const params = new URLSearchParams(window.location.search);
        const reportId = params.get('reportId');
        if (reportId) {
          const reportDoc = await getDoc(doc(db, 'reports', reportId));
          if (reportDoc.exists() && reportDoc.data().userId === user.uid) {
            const data = reportDoc.data();
            if (data.result) {
              setResult(data.result);
            } else if (data.reports) {
              // Convert structured reports back to markdown for simple view
              const markdown = data.reports.map((r: any) => `## Student: ${r.studentName}\n\n${r.results.map((res: any) => `**${res.question}**: ${res.score}/${res.maxScore}\n${res.feedback}`).join('\n\n')}`).join('\n\n---\n\n');
              setResult(markdown);
            }
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
        'application/pdf', 'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ];

      for (const file of files) {
        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
          setResult(`Unsupported file type: ${file.name}. Please upload images, PDF, DOCX, or TXT.`);
          continue;
        }

        setStudentFiles(prev => [...prev, file]);

        if (file.type === 'text/plain') {
          const reader = new FileReader();
          reader.onload = (e) => {
            setInput(prev => prev + "\n" + (e.target?.result as string));
          };
          reader.readAsText(file);
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
            setInput(prev => prev + "\n" + fullText);
          } catch (err) {
            console.error("PDF Extraction Error:", err);
          }
        } else if (file.type.includes('officedocument.wordprocessingml.document') || file.name.endsWith('.docx')) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            setInput(prev => prev + "\n" + result.value);
          } catch (err) {
            console.error("DOCX Extraction Error:", err);
          }
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImages(prev => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file);
        }
      }
      setIsUploadModalOpen(false);
    }
  };

  const handleSkemaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
        'application/pdf', 'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ];

      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
        setResult("Unsupported marking scheme file type.");
        setIsSkemaUploadModalOpen(false);
        return;
      }

      setSkemaFile(file);

      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSkema(e.target?.result as string);
          setIsSkemaUploadModalOpen(false);
        };
        reader.readAsText(file);
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
          setSkema(prev => prev + "\n" + fullText);
          setIsSkemaUploadModalOpen(false);
        } catch (err) {
          console.error("PDF Extraction Error:", err);
          setResult("Failed to extract text from PDF.");
        }
      } else if (file.type.includes('officedocument.wordprocessingml.document') || file.name.endsWith('.docx')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          setSkema(prev => prev + "\n" + result.value);
          setIsSkemaUploadModalOpen(false);
        } catch (err) {
          console.error("DOCX Extraction Error:", err);
          setResult("Failed to extract text from DOCX.");
        }
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSkemaImage(reader.result as string);
          setIsSkemaUploadModalOpen(false);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const runOCR = async () => {
    if (!input && images.length === 0 && studentFiles.length === 0) return;
    
    setIsGrading(true);
    setGradingStage('Validating Image Quality...');
    setScanWarnings([]);
    setOcrPreviewData(null);

    try {
      const flashModel = AI_CONFIG.GEMINI.FLASH_MODEL;
      
      // Step 1: Quality Validation & OCR Extraction
      const ocrPrompt = `
        You are an advanced OCR and Image Quality Auditor for ${APP_NAME}.
        
        TASK 1: Evaluate Image Quality
        Check for: blur, low lighting, shadows, glare, perspective distortion, or incomplete framing.
        If quality is poor, provide specific actionable advice for the teacher to retake the photo.
        
        TASK 2: Extract Content
        Extract all text from the student work. Identify questions, student answers, and student names.
        Maintain structure even if complex (tables, columns).
        IMPORTANT: If the file is an image-based PDF or a photo, use visual analysis to recognize handwriting.
        
        TASK 3: Confidence Assessment
        Rate your overall confidence in the extraction as "high", "medium", or "low".
        List specific areas or questions where the text was hard to read.
        
        Format your output as a clean JSON object:
        {
          "qualityReport": {
            "isSuitable": boolean,
            "issues": ["blur", "shadows", etc],
            "advice": ["Retake in brighter light", etc]
          },
          "extraction": {
            "questions": [
              { "id": 1, "text": "...", "studentAnswer": "...", "studentName": "..." }
            ],
            "skema": "..."
          },
          "confidence": "high" | "medium" | "low",
          "uncertainSections": ["Question 2 answer is slightly blurry", etc]
        }
      `;

      const filterVisualFiles = (files: File[]) => files.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
      const studentVisualParts = await Promise.all(filterVisualFiles(studentFiles).map(fileToPart));
      const skemaVisualParts = skemaFile ? [await fileToPart(skemaFile)] : [];

      const parts: any[] = [];
      studentVisualParts.forEach((p) => {
        parts.push({ inlineData: p.inlineData });
      });
      
      skemaVisualParts.forEach((p) => {
        parts.push({ inlineData: p.inlineData });
      });

      parts.push({ text: `Student Input (Text): ${input}\n\nMarking Scheme (Text): ${skema}\n\n${ocrPrompt}` });

      const response = await gemini.models.generateContent({
        model: flashModel,
        contents: { parts },
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text || '{}');
      
      // Handle Quality Warnings
      const warnings: string[] = [];
      if (data.qualityReport && !data.qualityReport.isSuitable) {
        warnings.push(...data.qualityReport.advice);
      }
      if (data.confidence === 'low' || data.confidence === 'medium') {
        warnings.push(`Low-confidence scan detected: ${data.uncertainSections?.join(', ') || 'Some text may be inaccurate.'}`);
      }
      
      setScanWarnings(warnings);
      setOcrConfidence(data.confidence || 'high');
      setOcrPreviewData(data.extraction);
      setIsOcrReviewing(true);
      
      // Log for debugging
      console.log(`[OCR LOG] Confidence: ${data.confidence}, Quality: ${data.qualityReport?.isSuitable ? 'Pass' : 'Fail'}`);

    } catch (error) {
      console.error("OCR Error:", error);
      setResult("OCR extraction failed. Please try again or check your image quality.");
    } finally {
      setIsGrading(false);
      setGradingStage(null);
    }
  };

  const runFinalGrading = async () => {
    if (!ocrPreviewData) return;

    // Check usage limits for free users in Exam mode
    if (mode === 'exam' && userProfile?.plan === 'free') {
      const today = new Date().toISOString().split('T')[0];
      const trialsUsed = userProfile.lastTrialResetDate === today ? (userProfile.examGraderTrialsUsedToday || 0) : 0;
      
      if (trialsUsed >= 5) {
        setResult("You have reached your daily limit of 5 Exam Grader trials. Please upgrade to Starter for unlimited access.");
        setIsOcrReviewing(false);
        return;
      }
    }

    setIsGrading(true);
    setIsOcrReviewing(false);
    setGradingStage('AI Grading in Progress...');

    try {
      const gradingPrompt = `
        You are ${APP_NAME} AI, a professional grader for ${examLevel} standards.
        Grade the following questions based on the provided marking scheme.
        
        MODE: ${mode === 'quick' ? 'QUICK GRADING' : 'EXAM GRADER'}
        SYLLABUS: ${examLevel}
        MARKING SCHEME: ${ocrPreviewData.skema || skema}
        
        QUESTIONS TO GRADE:
        ${JSON.stringify(ocrPreviewData.questions, null, 2)}
        
        SPECIFIC INSTRUCTIONS:
        - For Essays: Evaluate content, language, and organization.
        - For Science/Math: Check step-by-step accuracy and units.
        - For Multiple Students: Provide summary table + individual breakdowns.
        
        Output the final report in professional Markdown with PURE BOLD WHITE text structure.
      `;

      const gradingResponse = await openai.chat.completions.create({
        model: AI_CONFIG.OPENAI.MODEL,
        messages: [
          { role: "system", content: `You are ${APP_NAME} AI, a professional grader. Be precise and focus on academic rigor.` },
          { role: "user", content: gradingPrompt }
        ],
        temperature: 0.3
      });

      const finalResult = gradingResponse.choices[0].message.content || "No feedback generated.";
      setResult(finalResult);

      // SAVE TO HISTORY
      if (auth.currentUser) {
        const reportsPath = `reports`;
        await addDoc(collection(db, 'reports'), {
          userId: auth.currentUser.uid,
          mode,
          examLevel,
          timestamp: serverTimestamp(),
          result: finalResult,
          studentCount: ocrPreviewData.questions.length > 0 ? [...new Set(ocrPreviewData.questions.map((q: any) => q.studentName))].length : 1,
          subject: examLevel,
          studentName: ocrPreviewData.questions.length > 0 ? ocrPreviewData.questions[0].studentName : "Student",
          academicLevel: examLevel,
          ocrConfidence,
          hadWarnings: scanWarnings.length > 0
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, reportsPath));

        if (mode === 'exam' && userProfile?.plan === 'free') {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            examGraderTrialsUsedToday: increment(1)
          });
        }
      }
    } catch (error) {
      console.error("Grading Error:", error);
      setResult("Error during grading. Please try again.");
    } finally {
      setIsGrading(false);
      setGradingStage(null);
    }
  };

  const handleExamLevelChange = (level: string) => {
    setExamLevel(level);
  };

  const examLevels = ['SPM', 'UEC', 'IGCSE', 'A-Level', 'Primary (SK/SRJK)'];

  return (
    <div className="min-h-screen pt-24 pb-10 px-6 flex flex-col relative overflow-hidden bg-oxford-blue font-sans">
      {/* Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] glow-ambient-purple blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] glow-ambient-cyan blur-[150px] opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col gap-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4 relative">
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
              {mode === 'quick' ? t('mod_quick_grading') : t('mod_exam_grader')}
            </h2>
            <p className="text-electric-cyan font-black uppercase tracking-[0.3em] text-sm">
              {mode === 'quick' ? t('dash_quick_grade') : t('dash_exam_grader')}
            </p>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="grid lg:grid-cols-2 gap-8 flex-grow">
          
          {/* COLUMN 1: THE ACADEMIC CONTEXT */}
          <div className="flex flex-col gap-8">
            <div className="brand-gradient-border glow-purple flex flex-col">
              <div className="glass-card p-8 flex flex-col border border-white/5 h-full">
                <h3 className="text-2xl font-black flex items-center gap-3 text-white tracking-tighter uppercase mb-8">
                  <BookOpen size={24} className="text-electric-purple" />
                  {t('about_tech_title')}
                </h3>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{t('feat_syllabus_title')}</p>
                    <div className="relative group">
                      <select 
                        value={examLevel}
                        onChange={(e) => handleExamLevelChange(e.target.value)}
                        className="w-full appearance-none bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-12 text-base font-black text-white outline-none focus:ring-2 focus:ring-electric-cyan/50 focus:shadow-[0_0_20px_rgba(0,255,255,0.2)] cursor-pointer transition-all uppercase tracking-widest"
                      >
                        {examLevels.map(level => (
                          <option key={level} value={level} className="bg-oxford-blue">{level}</option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-electric-cyan pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{t('grader_upload_work')}</p>
                    <div className="flex-grow flex flex-col gap-6">
                      {images.length === 0 && !input && (
                        <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-12 text-center group hover:border-electric-purple/30 transition-colors">
                          <button 
                            onClick={() => setIsUploadModalOpen(true)}
                            className="group flex flex-col items-center gap-6 hover:scale-105 transition-transform"
                          >
                            <div className="w-20 h-20 bg-electric-purple/10 rounded-full flex items-center justify-center group-hover:bg-electric-purple/20 transition-colors shadow-lg">
                              <FolderUp size={40} className="text-electric-purple" />
                            </div>
                            <div>
                              <p className="text-xl font-black text-white tracking-tighter uppercase">{t('grader_smart_scan')}</p>
                              <p className="text-white/40 text-xs font-bold tracking-wide">Camera, File, or Smart Scan</p>
                            </div>
                          </button>
                        </div>
                      )}

                      {images.length > 0 && (
                        <div className="grid grid-cols-2 gap-4">
                          {images.map((img, idx) => (
                            <div key={idx} className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl h-40">
                              <img src={img} alt={`Student work ${idx + 1}`} className="h-full w-full object-contain" />
                              <button 
                                onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute top-2 right-2 bg-red-500/20 hover:bg-red-500 text-white p-1 rounded-lg transition-all"
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                          ))}
                          <button 
                            onClick={() => setIsUploadModalOpen(true)}
                            className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-4 hover:border-electric-purple/30 transition-colors h-40"
                          >
                            <FolderUp size={24} className="text-electric-purple mb-2" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Add More</span>
                          </button>
                        </div>
                      )}

                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Or type student response here..."
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-6 focus:ring-2 focus:ring-electric-cyan/30 outline-none resize-none text-white font-bold placeholder:text-white/10 text-lg transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: THE GRADING BRAIN */}
          <div className="flex flex-col gap-8">
            <div className="brand-gradient-border glow-cyan flex flex-col flex-grow">
              <div className="glass-card p-8 flex flex-col border border-white/5 h-full">
                <h3 className="text-2xl font-black flex items-center gap-3 text-white tracking-tighter uppercase mb-8">
                  <Brain size={24} className="text-electric-purple" />
                  {t('about_product_title')}
                </h3>

                <div className="flex-grow flex flex-col gap-6">
                  <div className="space-y-3 flex-grow flex flex-col">
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{t('grader_upload_skema')}</p>
                    
                    {!skemaImage && !skema && (
                      <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-12 text-center group hover:border-electric-cyan/30 transition-colors mb-4">
                        <button 
                          onClick={() => setIsSkemaUploadModalOpen(true)}
                          className="group flex flex-col items-center gap-6 hover:scale-105 transition-transform"
                        >
                          <div className="w-20 h-20 bg-electric-cyan/10 rounded-full flex items-center justify-center group-hover:bg-electric-cyan/20 transition-colors shadow-lg">
                            <FolderUp size={40} className="text-electric-cyan" />
                          </div>
                          <div>
                            <p className="text-xl font-black text-white tracking-tighter uppercase">{t('grader_smart_scan')}</p>
                            <p className="text-white/40 text-xs font-bold tracking-wide">Camera, File, or Smart Scan</p>
                          </div>
                        </button>
                      </div>
                    )}

                    {skemaImage && (
                      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 mb-4 h-32">
                        <img src={skemaImage} alt="Skema" className="h-full w-full object-contain" />
                        <button 
                          onClick={() => setSkemaImage(null)}
                          className="absolute top-2 right-2 bg-red-500/20 hover:bg-red-500 text-white p-1 rounded-lg transition-all"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    )}

                    <textarea
                      ref={skemaInputRef}
                      value={skema}
                      onChange={(e) => setSkema(e.target.value)}
                      placeholder="Paste the marking criteria or standard answers here for the AI to follow..."
                      className="flex-grow bg-white/5 border border-white/10 rounded-2xl p-6 focus:ring-2 focus:ring-electric-cyan/30 outline-none resize-none text-white font-bold placeholder:text-white/10 text-base transition-all min-h-[200px]"
                    />
                  </div>

                  <button 
                    onClick={runOCR}
                    disabled={isGrading || (!input && images.length === 0)}
                    className="btn-primary py-5 px-8 rounded-2xl flex items-center justify-center gap-4 disabled:opacity-50 shadow-2xl group"
                  >
                    {isGrading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                    <span className="font-black uppercase tracking-[0.2em] text-lg text-white">
                      {isGrading ? t('common_loading') : t('grader_launch_smart_scan')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* OCR REVIEW & RELIABILITY LAYER */}
        <AnimatePresence>
          {isOcrReviewing && ocrPreviewData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[150] flex items-center justify-center p-6"
            >
              <div className="absolute inset-0 bg-oxford-blue/98 backdrop-blur-xl" onClick={() => setIsOcrReviewing(false)} />
              <div className="relative brand-gradient-border w-full max-w-4xl max-h-[90vh] flex flex-col glow-cyan">
                <div className="glass-card p-8 flex flex-col h-full border border-white/10 overflow-hidden">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <CheckCircle2 className="text-electric-cyan" size={28} />
                        Scan Review & Verification
                      </h2>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
                        Verify extracted content before final AI grading
                      </p>
                    </div>
                    <button 
                      onClick={() => setIsOcrReviewing(false)}
                      className="text-white/20 hover:text-white transition-colors"
                    >
                      <XCircle size={24} />
                    </button>
                  </div>

                  {/* Reliability Warnings */}
                  {scanWarnings.length > 0 && (
                    <div className="mb-8 space-y-3">
                      {scanWarnings.map((warning, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-400">
                          <AlertTriangle size={18} className="shrink-0" />
                          <p className="text-xs font-bold tracking-wide">{warning}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Confidence Indicator */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                      <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        ocrConfidence === 'high' ? "bg-green-500" : ocrConfidence === 'medium' ? "bg-orange-500" : "bg-red-500"
                      )} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                        OCR Confidence: {ocrConfidence}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                      <Info size={12} />
                      Review text below for accuracy
                    </div>
                  </div>

                  {/* Extracted Content Preview */}
                  <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 mb-8">
                    <div className="space-y-6">
                      {ocrPreviewData.questions.map((q: any, idx: number) => (
                        <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-2xl group hover:border-electric-cyan/30 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-black text-electric-cyan uppercase tracking-widest">Question {q.id}</span>
                            <Edit3 size={14} className="text-white/10 group-hover:text-white/40 transition-colors" />
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Extracted Question Text</p>
                              <p className="text-sm text-white/80 font-medium leading-relaxed">{q.text}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Student Answer</p>
                              <p className="text-sm text-white font-bold leading-relaxed">{q.studentAnswer}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                    <button 
                      onClick={() => setIsOcrReviewing(false)}
                      className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} />
                      Retake / Edit Scan
                    </button>
                    <button 
                      onClick={runFinalGrading}
                      disabled={isGrading}
                      className="flex-[2] py-4 bg-electric-cyan text-oxford-blue rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,255,255,0.3)]"
                    >
                      {isGrading ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                      Confirm & Start AI Grading
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI DIAGNOSIS ROOM (Results) */}
        <AnimatePresence>
          {(result || isGrading) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="brand-gradient-border glow-purple"
            >
              <div className="glass-card p-8 border border-white/5 min-h-[400px]">
                <h3 className="text-2xl font-black flex items-center gap-3 mb-8 text-white tracking-tighter uppercase">
                  <Cpu size={24} className="text-electric-purple" />
                  AI DIAGNOSIS ROOM
                </h3>

                <div className="custom-scrollbar overflow-y-auto max-h-[600px] pr-4">
                  {isGrading ? (
                    <div className="h-40 flex flex-col items-center justify-center text-white/40 gap-6">
                      <Loader2 className="animate-spin text-electric-cyan" size={48} />
                      <p className="animate-pulse font-black tracking-[0.3em] uppercase text-xs">{gradingStage || "Consulting Grading Engine..."}</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="prose prose-invert max-w-none">
                        <div className="markdown-body text-white font-bold">
                          <ReactMarkdown>{result || ''}</ReactMarkdown>
                        </div>
                      </div>
                      
                      <div className="flex justify-center pt-6 border-t border-white/10">
                        <button 
                          onClick={() => {
                            setImages([]);
                            setStudentFiles([]);
                            setInput('');
                            setResult(null);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="btn-secondary py-4 px-10 rounded-2xl flex items-center gap-3 group"
                        >
                          <Zap size={20} className="text-electric-cyan group-hover:animate-pulse" />
                          <span className="font-black uppercase tracking-widest text-sm">Grade Next Page</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Student Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-oxford-blue/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative brand-gradient-border w-full max-w-2xl glow-purple"
            >
              <div className="glass-card p-10 border border-white/5">
                <button 
                  onClick={() => setIsUploadModalOpen(false)}
                  className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl"
                >
                  <XCircle size={28} />
                </button>

                <h2 className="text-4xl font-black mb-2 text-electric-purple tracking-tighter uppercase">Select Source</h2>
                <p className="text-white/40 mb-10 font-medium tracking-wide">Choose how you want to upload the student's work.</p>

                <div className="grid grid-cols-2 gap-6">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="glass-card p-8 flex flex-col items-center gap-6 hover:bg-white/10 transition-all group border border-white/5 rounded-3xl"
                  >
                    <div className="w-20 h-20 bg-electric-purple/10 rounded-2xl flex items-center justify-center group-hover:bg-electric-purple/20 transition-colors">
                      <Monitor size={40} className="text-electric-purple group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-sm">{t('grader_my_device')}</span>
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="glass-card p-8 flex flex-col items-center gap-6 hover:bg-white/10 transition-all group border border-white/5 rounded-3xl"
                  >
                    <div className="w-20 h-20 bg-electric-purple/10 rounded-2xl flex items-center justify-center group-hover:bg-electric-purple/20 transition-colors">
                      <Camera size={40} className="text-electric-purple group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-sm">{t('grader_smart_scan')}</span>
                  </button>
                </div>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple
                accept="image/*,application/pdf,.doc,.docx" 
                onChange={handleImageUpload} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Skema Upload Modal */}
      <AnimatePresence>
        {isSkemaUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSkemaUploadModalOpen(false)}
              className="absolute inset-0 bg-oxford-blue/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative brand-gradient-border w-full max-w-2xl glow-cyan"
            >
              <div className="glass-card p-10 border border-white/5">
                <button 
                  onClick={() => setIsSkemaUploadModalOpen(false)}
                  className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl"
                >
                  <XCircle size={28} />
                </button>

                <h2 className="text-4xl font-black mb-2 text-electric-cyan tracking-tighter uppercase">Select Source</h2>
                <p className="text-white/40 mb-10 font-medium tracking-wide">Choose how you want to upload the marking scheme.</p>

                <div className="grid grid-cols-2 gap-6">
                  <button 
                    onClick={() => skemaFileInputRef.current?.click()}
                    className="glass-card p-8 flex flex-col items-center gap-6 hover:bg-white/10 transition-all group border border-white/5 rounded-3xl"
                  >
                    <div className="w-20 h-20 bg-electric-cyan/10 rounded-2xl flex items-center justify-center group-hover:bg-electric-cyan/20 transition-colors">
                      <Monitor size={40} className="text-electric-cyan group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-sm">{t('grader_my_device')}</span>
                  </button>
                  <button 
                    onClick={() => skemaFileInputRef.current?.click()}
                    className="glass-card p-8 flex flex-col items-center gap-6 hover:bg-white/10 transition-all group border border-white/5 rounded-3xl"
                  >
                    <div className="w-20 h-20 bg-electric-cyan/10 rounded-2xl flex items-center justify-center group-hover:bg-electric-cyan/20 transition-colors">
                      <Camera size={40} className="text-electric-cyan group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-sm">{t('grader_smart_scan')}</span>
                  </button>
                  <button className="glass-card p-8 flex flex-col items-center gap-6 opacity-40 cursor-not-allowed group border border-white/5 rounded-3xl grayscale">
                    <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center">
                      <HardDrive size={40} className="text-white/20" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-sm text-white/20">Google Drive</span>
                  </button>
                  <button className="glass-card p-8 flex flex-col items-center gap-6 opacity-40 cursor-not-allowed group border border-white/5 rounded-3xl grayscale">
                    <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center">
                      <Cloud size={40} className="text-white/20" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-sm text-white/20">OneDrive</span>
                  </button>
                </div>
              </div>

              <input 
                type="file" 
                ref={skemaFileInputRef} 
                className="hidden" 
                accept="image/*,application/pdf,.doc,.docx" 
                onChange={handleSkemaFileUpload} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
