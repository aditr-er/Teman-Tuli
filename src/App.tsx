import { useState, useRef, useEffect } from 'react';
import { 
  Upload, FileText, X, Loader2, Brain, Sparkles, 
  PlusCircle, Settings2, LayoutDashboard, User, 
  LogOut, ChevronRight, ChevronLeft, Target, Zap, TrendingUp, Award, Scissors, BookOpen, MessageSquareCode,
  Camera, RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'motion/react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { 
  auth, db, googleProvider, OperationType, handleFirestoreError 
} from './firebase';
import { 
  signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, setDoc, collection, addDoc, query, orderBy, 
  limit, onSnapshot, serverTimestamp, updateDoc, increment 
} from 'firebase/firestore';
import { cn } from './lib/utils';

// Modular Imports
import { 
  Tab, SUBTESTS, SUBTEST_TOPICS, SUBTEST_MAP, REVERSE_SUBTEST_MAP, UserProgress 
} from './types';
import HomeView from './components/HomeView';
import SignLibraryView from './components/SignLibraryView';
import TryoutView from './components/TryoutView';
import DashboardView from './components/DashboardView';
import ProfileView from './components/ProfileView';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [tryoutResults, setTryoutResults] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);

  // Tab-specific results
  const [solverResult, setSolverResult] = useState<string | null>(null);
  const [generatorResult, setGeneratorResult] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'pro' | 'flash'>('flash');
  const [selectedSubtest, setSelectedSubtest] = useState<string>(SUBTESTS[0]);
  const [selectedTopic, setSelectedTopic] = useState<string>(SUBTEST_TOPICS[SUBTESTS[0]][0]);
  const [difficulty, setDifficulty] = useState<'Mudah' | 'Sedang' | 'Sulit'>('Sedang');
  const [textQuestion, setTextQuestion] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Start Camera Stream
  const startCamera = async (deviceId?: string, mode?: 'user' | 'environment') => {
    setError(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      const activeMode = mode || facingMode;
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: activeMode }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Enumerate available camera devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameraDevices(videoDevices);
      if (deviceId) {
        setSelectedCameraId(deviceId);
      } else if (videoDevices.length > 0) {
        const activeTrack = stream.getVideoTracks()[0];
        const activeSettings = activeTrack ? activeTrack.getSettings() : null;
        if (activeSettings && activeSettings.deviceId) {
          setSelectedCameraId(activeSettings.deviceId);
        } else {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      }
    } catch (err: any) {
      console.error("Gagal mengakses kamera:", err);
      setError("Gagal mengakses kamera. Pastikan izin kamera diaktifkan di browser Anda.");
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  // Capture Photo
  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setFile(capturedFile);
            stopCamera();
          }
        }, 'image/jpeg', 0.85);
      }
    }
  };

  // Switch Facing Mode
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(undefined, nextMode);
  };

  // Handle device change from select
  const handleCameraChange = (deviceId: string) => {
    setSelectedCameraId(deviceId);
    startCamera(deviceId);
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Fetching
  useEffect(() => {
    if (!user) return;

    // Fetch Progress
    const progressRef = doc(db, 'users', user.uid, 'progress', 'current');
    const unsubProgress = onSnapshot(progressRef, (docSnap) => {
      if (docSnap.exists()) {
        setProgress(docSnap.data() as UserProgress);
      } else {
        // Initialize progress
        const initialProgress = {
          uid: user.uid,
          streak: 0,
          totalSolved: 0,
          accuracy: { TWK: 0, TIU: 0, TKP: 0 },
          lastActive: serverTimestamp()
        };
        setDoc(progressRef, initialProgress);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/progress/current`));

    // Fetch History
    const historyRef = collection(db, 'users', user.uid, 'history');
    const qHistory = query(historyRef, orderBy('timestamp', 'desc'), limit(10));
    const unsubHistory = onSnapshot(qHistory, (snap) => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/history`));

    // Fetch Tryouts (Kuis / Simulasi)
    const tryoutsRef = collection(db, 'users', user.uid, 'tryouts');
    const qTryouts = query(tryoutsRef, orderBy('timestamp', 'desc'), limit(20));
    const unsubTryouts = onSnapshot(qTryouts, (snap) => {
      setTryoutResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/tryouts`));

    // Fetch Analyses
    const analysesRef = collection(db, 'users', user.uid, 'analyses');
    const qAnalyses = query(analysesRef, orderBy('timestamp', 'desc'), limit(10));
    const unsubAnalyses = onSnapshot(qAnalyses, (snap) => {
      setAnalyses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/analyses`));

    return () => {
      unsubProgress();
      unsubHistory();
      unsubTryouts();
      unsubAnalyses();
    };
  }, [user]);

  useEffect(() => {
    setSelectedTopic(SUBTEST_TOPICS[selectedSubtest as any]?.[0] || '');
  }, [selectedSubtest]);

  useEffect(() => {
    if (file) {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login Error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab('home');
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) setFile(blob);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const currentResult = activeTab === 'solver' ? solverResult : generatorResult;

  const downloadDocx = async () => {
    if (!currentResult) return;
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: activeTab === 'solver' ? "Analisis Gaya Rambut AI - KawanCukur" : "Materi Panduan Belajar Barber AI",
            heading: HeadingLevel.HEADING_1,
          }),
          ...currentResult.split('\n').map(line => new Paragraph({
            children: [new TextRun(line)],
            spacing: { before: 120, after: 120 }
          }))
        ],
      }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `kawancukur_${activeTab}_${new Date().getTime()}.docx`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textQuestion.trim() && !file && activeTab === 'solver') {
      setError('Harap masukkan deskripsi model rambut atau unggah foto gaya rambut.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    if (activeTab === 'solver') setSolverResult(null);
    if (activeTab === 'generator') setGeneratorResult(null);

    try {
      const promptParts: any[] = [];
      
      const solverInstruction = `
        Anda adalah instruktur pangkas rambut (barber) profesional senior. Tugas Anda adalah membantu karyawan barbershop Teman Tuli menganalisis foto gaya rambut atau deskripsi teks potongan rambut.
        Berikan panduan yang SANGAT VISUAL, mendetail, praktis, dan mudah dimengerti. Pecah penjelasan menjadi langkah-langkah terstruktur:
        
        ### 1. ALAT & UKURAN CLIPPER (Clipper Guards)
        Sebutkan nomor sepatu clipper yang wajib dipakai (misal #1, #2, #3, atau skin/tanpa pelindung) untuk memotong bagian samping dan belakang demi hasil gradasi yang tepat.
        
        ### 2. ANALISIS KESULITAN & GRADASI (Fading / Tapering)
        Jelaskan tingkat kesusahan gaya rambut ini. Apakah ini jenis High Fade, Low Fade, Classic Taper, Undercut, Two-Block, atau potongan gunting penuh (scissors-only).
        
        ### 3. PANDUAN KERJA VISUAL LANGKAH-BY-LANGKAH
        Berikan urutan kerja pangkas dari awal hingga styling selesai (Langkah 1, Langkah 2, dll.). Sederhanakan bahasa Anda agar ramah untuk teman tuli.
        
        ### 4. PANDUAN KOMUNIKASI VISUAL DENGAN PELANGGAN
        Berikan instruksi isyarat gestur atau kartu visual yang bisa ditunjukkan barber teman tuli ke pelanggan agar konfirmasi potongan berjalan lancar tanpa hambatan bicara.
      `;

      const generatorInstruction = `
        Buat panduan belajar/modul pelatihan pangkas rambut terstruktur untuk topik: "${selectedTopic}" pada kategori "${selectedSubtest}".
        Gunakan penjelasan visual, bahasa sederhana, dan berikan representasi diagram sederhana dengan simbol teks/ASCII/karakter untuk menggambarkan sudut pemotongan atau area rambut.
        Tingkat kesulitan materi: ${difficulty}.
        
        Format output mencakup:
        ### 🧠 MATERI TEKNIK: [Nama Teknik/Gaya]
        ### 💈 PERALATAN UTAMA YANG DIBUTUHKAN
        ### 📈 LANGKAH KERJA VISUAL (TERSTRUKTUR)
        ### ⚠️ KESALAHAN UMUM & CARA MENGHINDARINYA
        
        Sertakan 1 pertanyaan kuis simulasi interaktif mengenai topik ini beserta jawabannya, TETAPI WAJIB dibungkus dalam tag HTML details seperti ini:
        <details>
          <summary>Lihat Jawaban & Pembahasan Kuis Skenario</summary>
          [Isi pembahasan kuis dan saran visual di sini]
        </details>
      `;

      let sysInst = activeTab === 'solver' ? solverInstruction : generatorInstruction;

      if (textQuestion.trim()) promptParts.push({ text: `Input: ${textQuestion}` });
      if (file) {
        const base64Data = await fileToBase64(file);
        promptParts.push({ inlineData: { data: base64Data, mimeType: file.type } });
      }

      if (activeTab === 'generator') {
        promptParts.push({ text: `Kategori: ${selectedSubtest}, Topik: ${selectedTopic}, Kesulitan: ${difficulty}` });
      }

      const modelName = selectedModel === 'pro' ? 'gemini-3.1-pro-preview' : 'gemini-3.5-flash';
      
      const apiResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelName,
          contents: { parts: promptParts },
          systemInstruction: sysInst
        })
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      const aiText = data.text || 'Tidak ada konten hasil dari AI.';
      
      if (activeTab === 'solver') setSolverResult(aiText);
      if (activeTab === 'generator') setGeneratorResult(aiText);

      // Update Firebase Stats
      if (user) {
        const progressRef = doc(db, 'users', user.uid, 'progress', 'current');
        await updateDoc(progressRef, {
          totalSolved: increment(1),
          lastActive: serverTimestamp()
        });

        const dbSubtestCode = REVERSE_SUBTEST_MAP[selectedSubtest] || 'TWK';

        await addDoc(collection(db, 'users', user.uid, 'history'), {
          uid: user.uid,
          question: textQuestion || (file ? `Analisis Foto: ${file.name}` : "Generated Tutorial"),
          subtest: dbSubtestCode,
          answer: aiText.substring(0, 500),
          timestamp: serverTimestamp()
        });
      }

    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 md:pb-0">
      {/* Sidebar / Desktop Nav */}
      <nav className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-slate-200 hidden md:flex flex-col py-6 transition-all duration-300 z-50",
        isSidebarCollapsed ? "w-20 px-4" : "w-64 px-6"
      )}>
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          className="absolute -right-3.5 top-8 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 shadow-sm hidden md:flex items-center justify-center z-50 cursor-pointer"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
        </button>

        <div className={cn("flex items-center mb-10", isSidebarCollapsed ? "justify-center" : "gap-3")}>
          <div className="p-2 bg-blue-600 rounded-xl shrink-0">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-xl font-black tracking-tight text-slate-900 whitespace-nowrap">KawanCukur</h1>
              <p className="text-[10px] text-blue-600 font-bold tracking-wider uppercase mt-[-2px]">Barber Academy</p>
            </div>
          )}
        </div>

        <div className="space-y-2 flex-1">
          <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<LayoutDashboard />} label="Beranda" collapsed={isSidebarCollapsed} />
          <NavButton active={activeTab === 'solver'} onClick={() => setActiveTab('solver')} icon={<Scissors />} label="Analisis Gaya AI" collapsed={isSidebarCollapsed} />
          <NavButton active={activeTab === 'generator'} onClick={() => setActiveTab('generator')} icon={<PlusCircle />} label="Materi Generator" collapsed={isSidebarCollapsed} />
          <NavButton active={activeTab === 'tryout'} onClick={() => setActiveTab('tryout')} icon={<Target />} label="Evaluasi Kuis" collapsed={isSidebarCollapsed} />
          <NavButton active={activeTab === 'tips'} onClick={() => setActiveTab('tips')} icon={<MessageSquareCode />} label="Kamus Isyarat" collapsed={isSidebarCollapsed} />
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<TrendingUp />} label="Statistik" collapsed={isSidebarCollapsed} />
          <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User />} label="Profil" collapsed={isSidebarCollapsed} />
        </div>

        {user && (
          <button onClick={handleLogout} className={cn(
            "flex items-center gap-3 p-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group cursor-pointer",
            isSidebarCollapsed ? "justify-center" : ""
          )} title={isSidebarCollapsed ? "Keluar" : ""}>
            <LogOut className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span className="font-semibold text-sm whitespace-nowrap">Keluar</span>}
          </button>
        )}
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around p-3 md:hidden z-50">
        <MobileNavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<LayoutDashboard />} />
        <MobileNavButton active={activeTab === 'solver'} onClick={() => setActiveTab('solver')} icon={<Scissors />} />
        <MobileNavButton active={activeTab === 'generator'} onClick={() => setActiveTab('generator')} icon={<PlusCircle />} />
        <MobileNavButton active={activeTab === 'tryout'} onClick={() => setActiveTab('tryout')} icon={<Target />} />
        <MobileNavButton active={activeTab === 'tips'} onClick={() => setActiveTab('tips')} icon={<MessageSquareCode />} />
        <MobileNavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<TrendingUp />} />
      </nav>

      {/* Main Content */}
      <main className={cn(
        "p-4 md:p-8 max-w-[1400px] mx-auto w-full transition-all duration-300",
        isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        {!user && activeTab !== 'home' ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Award className="w-16 h-16 text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-slate-900">Mulai Pelatihan Barber Anda</h2>
            <p className="text-slate-600 mb-8 max-w-md">Masuk untuk menyimpan progres latihan, melihat tingkat akurasi kuis, dan konsultasi AI.</p>
            <button onClick={handleLogin} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 cursor-pointer">
              Masuk dengan Google
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <HomeView 
                user={user} 
                progress={progress} 
                history={history} 
                tryoutResults={tryoutResults} 
                onTabChange={setActiveTab} 
                onLogin={handleLogin} 
              />
            )}
            
            {(activeTab === 'solver' || activeTab === 'generator') && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setActiveTab('home')} className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all cursor-pointer">
                      <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                        {activeTab === 'solver' ? 'Analisis Gaya Rambut AI' : 'Generator Panduan Belajar'}
                      </h2>
                      <p className="text-sm text-slate-600">
                        {activeTab === 'solver' 
                          ? 'Gunakan foto referensi untuk menganalisis nomor pelindung clipper dan urutan pangkas.' 
                          : 'Buat panduan materi latihan, diagram visual, dan simulasi kuis secara otomatis.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    <button onClick={() => setSelectedModel('pro')} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer", selectedModel === 'pro' ? "bg-blue-600 text-white" : "text-slate-500")}>Gemini Pro</button>
                    <button onClick={() => setSelectedModel('flash')} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer", selectedModel === 'flash' ? "bg-blue-600 text-white" : "text-slate-500")}>Gemini Flash</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                  <div className="lg:col-span-1 space-y-4 md:space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm space-y-4 md:space-y-6">
                      {activeTab !== 'solver' && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Kategori Belajar</label>
                            <select value={selectedSubtest} onChange={(e) => setSelectedSubtest(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-semibold">
                              {SUBTESTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Topik</label>
                            <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-semibold">
                              {(SUBTEST_TOPICS[selectedSubtest as any] || []).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Level Materi</label>
                              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold">
                                <option value="Mudah">Mudah</option>
                                <option value="Sedang">Sedang</option>
                                <option value="Sulit">Sulit</option>
                              </select>
                            </div>
                            <div className="opacity-40">
                              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Referensi Visual</label>
                              <div className="p-3 bg-slate-100 rounded-xl text-center text-xs font-bold text-slate-500">Auto ASCII</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                          {activeTab === 'solver' ? 'Foto atau Deskripsi Gaya Rambut' : 'Catatan Tambahan (Opsional)'}
                        </label>
                        <textarea 
                          rows={4} 
                          value={textQuestion} 
                          onChange={(e) => setTextQuestion(e.target.value)}
                          onPaste={handlePaste}
                          placeholder={activeTab === 'solver' ? "Contoh: Samping tipis banget gradasi sedang, bagian atas dibiarkan agak tebal bisa sisir samping. Tempel (Paste) foto rambut juga di sini jika ada..." : "Masukkan poin khusus yang ingin dibahas dalam panduan..."}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all text-xs font-semibold cursor-pointer border border-slate-200 shadow-sm">
                          <Upload className="w-4 h-4 text-blue-600" />
                          <span>{file ? "Ganti Foto" : "Unggah Foto"}</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsCameraOpen(true);
                            startCamera();
                          }} 
                          className="flex items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all text-xs font-semibold cursor-pointer border border-blue-200 shadow-sm"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Ambil Kamera</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                      </div>

                      {file && (
                        <div className="flex flex-col gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold truncate flex-1 text-slate-700">{file.name}</span>
                            <button type="button" onClick={removeFile} className="text-red-500 cursor-pointer"><X className="w-4 h-4" /></button>
                          </div>
                          {previewUrl && (
                            <img src={previewUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-slate-200" referrerPolicy="no-referrer" />
                          )}
                        </div>
                      )}

                      {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-semibold">
                          {error}
                        </div>
                      )}

                      <button disabled={isLoading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        {activeTab === 'solver' ? "Mulai Analisis Gaya" : "Generate Panduan Visual"}
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2">
                    {currentResult ? (
                      <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                          <h3 className="font-bold flex items-center gap-2 text-sm md:text-base text-slate-800">
                            <Brain className="w-5 h-5 text-blue-600" />
                            Hasil Analisis & Panduan Cukur AI
                          </h3>
                          <div className="flex gap-1 md:gap-2">
                            <button onClick={downloadDocx} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer" title="Download Word"><FileText className="w-4 h-4 md:w-5 md:h-5" /></button>
                            <button onClick={() => window.print()} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer" title="Cetak"><ChevronRight className="w-4 h-4 md:w-5 md:h-5 rotate-90" /></button>
                          </div>
                        </div>
                        <div className="p-5 md:p-8 prose prose-sm md:prose-base prose-blue max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>{currentResult}</ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full min-h-[300px] md:min-h-[400px] flex flex-col items-center justify-center text-center p-6 md:p-10 bg-white rounded-2xl md:rounded-3xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <Sparkles className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-400">Belum Ada Hasil</h3>
                        <p className="text-slate-400 max-w-xs text-sm">Pilih topik atau unggah foto gaya rambut di panel kiri untuk memulai kecerdasan AI.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'tryout' && (
              <TryoutView user={user} onTabChange={setActiveTab} />
            )}
            
            {activeTab === 'tips' && (
              <SignLibraryView onTabChange={setActiveTab} />
            )}
            
            {activeTab === 'dashboard' && (
              <DashboardView 
                progress={progress} 
                history={history} 
                tryoutResults={tryoutResults} 
                analyses={analyses}
                onTabChange={setActiveTab}
                onNavigateWithContext={(tab: Tab, sub: string, top: string) => {
                  if (SUBTESTS.includes(sub as any)) setSelectedSubtest(sub);
                  setSelectedTopic(top);
                  setActiveTab(tab);
                }}
              />
            )}
            
            {activeTab === 'profile' && (
              <ProfileView 
                user={user} 
                progress={progress} 
                onLogout={handleLogout} 
                onTabChange={setActiveTab} 
              />
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Interactive Camera Capture Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/90 z-[9999] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  <span className="font-extrabold text-sm text-slate-800">Ambil Foto Referensi Rambut</span>
                </div>
                <button 
                  type="button"
                  onClick={stopCamera}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Feed Area */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay guides for centering head */}
                <div className="absolute inset-0 border-2 border-dashed border-white/20 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-64 border-2 border-dashed border-blue-500/50 rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white/50 tracking-wider uppercase bg-black/40 px-2 py-0.5 rounded">Posisikan Kepala</span>
                  </div>
                </div>
              </div>

              {/* Toolbar Controls */}
              <div className="p-5 space-y-4 bg-slate-50 border-t border-slate-100">
                {/* Camera Devices Dropdown & Toggle Facing */}
                <div className="flex items-center gap-3">
                  {cameraDevices.length > 1 && (
                    <select 
                      value={selectedCameraId} 
                      onChange={(e) => handleCameraChange(e.target.value)}
                      className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none shadow-sm"
                    >
                      {cameraDevices.map((device, idx) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          Kamera {idx + 1} ({device.label || 'Kamera Belakang/Depan'})
                        </option>
                      ))}
                    </select>
                  )}
                  
                  <button 
                    type="button"
                    onClick={toggleFacingMode}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-all text-xs font-bold shadow-sm cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ganti Kamera</span>
                  </button>
                </div>

                {/* Primary Action Button */}
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={stopCamera}
                    className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-xs shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Ambil Foto
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, collapsed }: any) {
  return (
    <button onClick={onClick} title={collapsed ? label : undefined} className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group cursor-pointer",
      active ? "bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold" : "text-slate-600 hover:bg-slate-50 font-medium",
      collapsed ? "justify-center px-0" : "justify-start"
    )}>
      <span className={cn("w-5 h-5 transition-transform shrink-0", active ? "scale-110" : "group-hover:scale-110", active ? "text-white" : "text-slate-400 group-hover:text-blue-600")}>{icon}</span>
      {!collapsed && <span className="whitespace-nowrap text-sm">{label}</span>}
    </button>
  );
}

function MobileNavButton({ active, onClick, icon }: any) {
  return (
    <button onClick={onClick} className={cn(
      "p-3 rounded-2xl transition-all cursor-pointer",
      active ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-400"
    )}>
      <span className="w-6 h-6">{icon}</span>
    </button>
  );
}
