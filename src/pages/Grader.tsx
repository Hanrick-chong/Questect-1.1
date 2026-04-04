import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileText, CheckCircle2, XCircle, Send, Loader2, 
  Image as ImageIcon, Cpu, FolderUp, Monitor, Camera, 
  HardDrive, Cloud, ChevronDown, BookOpen, Brain, Zap
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

interface GraderProps {
  mode: 'quick' | 'exam';
}

export default function Grader({ mode }: GraderProps) {
  const [input, setInput] = useState('');
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skemaFileInputRef = useRef<HTMLInputElement>(null);
  const skemaInputRef = useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }

        // Check for reportId in URL
        const params = new URLSearchParams(window.location.search);
        const reportId = params.get('reportId');
        if (reportId) {
          const reportDoc = await getDoc(doc(db, 'reports', reportId));
          if (reportDoc.exists() && reportDoc.data().userId === user.uid) {
            setResult(reportDoc.data().result);
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

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

  const runGrading = async () => {
    if (!input && images.length === 0) return;
    
    // Check usage limits for free users in Exam mode
    if (mode === 'exam' && userProfile?.plan === 'free') {
      const today = new Date().toISOString().split('T')[0];
      if (userProfile.lastTrialResetDate !== today) {
        // Reset trials for the new day (this should ideally be handled in a cloud function or on login)
      } else if (userProfile.examGraderTrialsUsedToday >= 5) {
        setResult("You have reached your daily limit of 5 Exam Grader trials. Please upgrade to Starter for unlimited access.");
        return;
      }
    }

    setIsGrading(true);
    setResult(null);
    setGradingStage('Parsing Content...');

    try {
      // STAGE 1: PARSING & STRUCTURE DETECTION (Gemini Flash)
      const flashModel = AI_CONFIG.GEMINI.FLASH_MODEL;
      const parsePrompt = `
        You are an OCR and structure detection engine for ${APP_NAME}.
        Extract all text from the student work and marking scheme.
        Identify each question and the student's answer for that question.
        
        CRITICAL: 
        - If images are blurry, use your advanced vision capabilities to infer the text accurately.
        - If the layout is complex (e.g., tables, columns), maintain the logical structure.
        - If multiple students are present, separate them clearly.
        
        Format your output as a clean JSON object:
        {
          "questions": [
            { "id": 1, "text": "...", "studentAnswer": "...", "studentName": "Optional" },
            ...
          ],
          "skema": "...",
          "analysisType": "${mode === 'quick' ? 'Quick Feedback' : 'Full Exam Analysis'}"
        }
      `;

      const parseParts: any[] = [];
      
      // Handle Student Work Images
      images.forEach((img) => {
        parseParts.push({ 
          inlineData: { 
            data: img.split(',')[1], 
            mimeType: 'image/jpeg' 
          } 
        });
      });

      // Handle Marking Scheme Image
      if (skemaImage && skemaFile) {
        const isImage = skemaFile.type.startsWith('image/');
        if (isImage) {
          parseParts.push({ 
            inlineData: { 
              data: skemaImage.split(',')[1], 
              mimeType: skemaFile.type 
            } 
          });
        }
      }

      // Handle Text (Pasted or Extracted)
      parseParts.push({ text: `Student Input Content: ${input}\n\nMarking Scheme Content: ${skema}\n\n${parsePrompt}` });

      const parseResponse = await gemini.models.generateContent({
        model: flashModel,
        contents: { parts: parseParts },
        config: { responseMimeType: "application/json" }
      });

      const parsedData = JSON.parse(parseResponse.text || '{}');
      
      // STAGE 2: PER-QUESTION GRADING (OpenAI GPT-4o)
      setGradingStage('Grading Questions...');
      
      const gradingPrompt = `
        You are ${APP_NAME} AI, a professional grader for ${examLevel} standards.
        Grade the following questions based on the provided marking scheme.
        
        MODE: ${mode === 'quick' ? 'QUICK GRADING (Focus on immediate feedback and score)' : 'EXAM GRADER (Focus on academic rigor, marking scheme adherence, and detailed weakness analysis)'}
        SYLLABUS: ${examLevel}
        MARKING SCHEME: ${parsedData.skema || skema}
        
        QUESTIONS TO GRADE:
        ${JSON.stringify(parsedData.questions, null, 2)}
        
        SPECIFIC INSTRUCTIONS:
        - For Essays (Long/Short/Functional): Evaluate based on content, language, and organization as per ${examLevel} rubrics.
        - For Science/Math: Check for step-by-step accuracy and correct units.
        - For Multiple Students: Provide a summary table first, then individual breakdowns.
        
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

      // STAGE 3: SAVE TO HISTORY (Firebase)
      if (auth.currentUser) {
        const reportsPath = `reports`;
        await addDoc(collection(db, 'reports'), {
          userId: auth.currentUser.uid,
          mode,
          examLevel,
          timestamp: serverTimestamp(),
          result: finalResult,
          studentCount: parsedData.questions.length > 0 ? [...new Set(parsedData.questions.map((q: any) => q.studentName))].length : 1,
          subject: examLevel, // Using examLevel as subject for now
          studentName: parsedData.questions.length > 0 ? parsedData.questions[0].studentName : "Student",
          academicLevel: examLevel
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, reportsPath));

        // Update trial count for free users
        if (mode === 'exam' && userProfile?.plan === 'free') {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            examGraderTrialsUsedToday: increment(1)
          });
        }
      }
    } catch (error) {
      console.error(error);
      setResult("Error during grading. Please check your API key or input.");
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
        <div className="text-center mb-4 relative">
          {userProfile && (
            <div className="absolute top-0 right-0 text-[10px] font-black text-electric-cyan uppercase tracking-widest opacity-50 hidden md:block">
              ID: {userProfile.uid}
            </div>
          )}
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">{APP_NAME}-A (Analyze)</h2>
          <p className="text-electric-cyan font-black uppercase tracking-[0.3em] text-sm">Full Page / Multi-Question Grader</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 flex-grow">
          
          {/* COLUMN 1: THE ACADEMIC CONTEXT */}
          <div className="flex flex-col gap-8">
            <div className="brand-gradient-border glow-purple flex flex-col">
              <div className="glass-card p-8 flex flex-col border border-white/5 h-full">
                <h3 className="text-2xl font-black flex items-center gap-3 text-white tracking-tighter uppercase mb-8">
                  <BookOpen size={24} className="text-electric-purple" />
                  THE ACADEMIC CONTEXT
                </h3>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Syllabus & Level</p>
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
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">UPLOAD STUDENT WORK</p>
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
                              <p className="text-xl font-black text-white tracking-tighter uppercase">SELECT SOURCE</p>
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
                  THE GRADING BRAIN
                </h3>

                <div className="flex-grow flex flex-col gap-6">
                  <div className="space-y-3 flex-grow flex flex-col">
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Upload Skema / Marking Scheme</p>
                    
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
                            <p className="text-xl font-black text-white tracking-tighter uppercase">SELECT SOURCE</p>
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
                    onClick={runGrading}
                    disabled={isGrading || (!input && images.length === 0)}
                    className="btn-primary py-5 px-8 rounded-2xl flex items-center justify-center gap-4 disabled:opacity-50 shadow-2xl group"
                  >
                    {isGrading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                    <span className="font-black uppercase tracking-[0.2em] text-lg text-white">
                      {isGrading ? "Analyzing..." : "Launch Analysis"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                    <span className="font-black uppercase tracking-widest text-sm">My Device</span>
                  </button>
                  <button className="glass-card p-8 flex flex-col items-center gap-6 hover:bg-white/10 transition-all group border border-white/5 rounded-3xl">
                    <div className="w-20 h-20 bg-electric-purple/10 rounded-2xl flex items-center justify-center group-hover:bg-electric-purple/20 transition-colors">
                      <Camera size={40} className="text-electric-purple group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-sm">Smart Scan</span>
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
                    <span className="font-black uppercase tracking-widest text-sm">My Device</span>
                  </button>
                  <button className="glass-card p-8 flex flex-col items-center gap-6 hover:bg-white/10 transition-all group border border-white/5 rounded-3xl">
                    <div className="w-20 h-20 bg-electric-cyan/10 rounded-2xl flex items-center justify-center group-hover:bg-electric-cyan/20 transition-colors">
                      <Camera size={40} className="text-electric-cyan group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-sm">Smart Scan</span>
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
