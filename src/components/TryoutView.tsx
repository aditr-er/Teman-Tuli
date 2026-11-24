import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SUBTESTS, SUBTEST_TOPICS, SUBTEST_MAP, REVERSE_SUBTEST_MAP 
} from '../types';
import { 
  Target, Zap, Clock, Info, Loader2, Award, ChevronLeft, Scissors, Eye, AlertCircle
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { db } from '../firebase';
import { addDoc, collection, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';

export default function TryoutView({ user, onTabChange }: any) {
  const [mode, setMode] = useState<'tryout' | 'drilling'>('tryout');
  const [step, setStep] = useState<'setup' | 'loading' | 'active' | 'result'>('setup');
  const [subtest, setSubtest] = useState<string>(SUBTESTS[0]);
  const [topic, setTopic] = useState<string>(SUBTEST_TOPICS[SUBTESTS[0]][0]);
  const [difficulty, setDifficulty] = useState('sedang');
  const [duration, setDuration] = useState(5); // minutes
  const [drillingCount, setDrillingCount] = useState(5);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [finalScore, setFinalScore] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    setTopic(SUBTEST_TOPICS[subtest as any][0]);
  }, [subtest]);

  useEffect(() => {
    let timer: any;
    if (step === 'active' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishTryout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const startSession = async () => {
    setStep('loading');
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const currentAi = new GoogleGenAI({ apiKey: apiKey || '' });
      
      const qCount = mode === 'tryout' ? 10 : drillingCount;
      const diffLabel = mode === 'tryout' ? 'campuran' : difficulty;

      const subtestCode = REVERSE_SUBTEST_MAP[subtest] || 'TWK';
      
      const prompt = `
        Buatlah ${qCount} soal pilihan ganda bahasa Indonesia yang interaktif untuk pelatihan teknik barbershop/pangkas rambut dan skenario komunikasi visual ramah teman tuli.
        Sertakan skenario nyata dalam barbershop, penanganan keluhan pelanggan, atau penggunaan clipper guards, teknik gradasi (fade), pemotongan rambut bagian atas (scissor work).
        Subtes: ${subtest} (Kode: ${subtestCode})
        Topik: ${topic}
        Tingkat kesulitan: ${diffLabel}

        Format output HARUS JSON valid dengan struktur persis seperti ini:
        {
          "questions": [
            {
              "id": 1,
              "text": "Skenario soal...",
              "options": { "A": "Pilihan A", "B": "Pilihan B", "C": "Pilihan C", "D": "Pilihan D", "E": "Pilihan E" },
              "correct": "A",
              "explanation": "Penjelasan mengapa opsi tersebut benar..."
            }
          ]
        }
        Jangan berikan teks lain sebelum atau setelah JSON.
      `;

      const response = await currentAi.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || '';
      const data = JSON.parse(text);
      setQuestions(data.questions);
      setTimeLeft(mode === 'tryout' ? 10 * 60 : duration * 60);
      setStep('active');
    } catch (err) {
      console.error(err);
      alert("Gagal memuat kuis AI. Pastikan kunci API Gemini diatur dengan benar.");
      setStep('setup');
    }
  };

  const finishTryout = async () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct) correct++;
    });
    const score = Math.round((correct / questions.length) * 100);
    
    const dbSubtestCode = REVERSE_SUBTEST_MAP[subtest] || 'TWK';

    const resultData = {
      uid: user.uid,
      type: mode,
      subtest: dbSubtestCode,
      difficulty: mode === 'tryout' ? 'campuran' : difficulty,
      score,
      totalQuestions: questions.length,
      correctAnswers: correct,
      duration: (mode === 'tryout' ? 10 * 60 : duration * 60) - timeLeft,
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, 'users', user.uid, 'tryouts'), resultData);
    
    const progressRef = doc(db, 'users', user.uid, 'progress', 'current');
    await updateDoc(progressRef, {
      totalSolved: increment(questions.length),
      lastActive: serverTimestamp()
    });

    setFinalScore(resultData);
    setStep('result');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (step === 'setup') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => onTabChange('home')} className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-2xl font-bold">Evaluasi & Simulasi Kuis Barber</h2>
        </div>
        <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setMode('tryout')}
            className={cn("flex-1 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2", mode === 'tryout' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50")}
          >
            <Target className="w-5 h-5" /> Evaluasi Menyeluruh
          </button>
          <button 
            onClick={() => setMode('drilling')}
            className={cn("flex-1 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2", mode === 'drilling' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50")}
          >
            <Zap className="w-5 h-5" /> Latihan Mandiri
          </button>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-[30px] md:rounded-[40px] border border-slate-200 shadow-sm text-center">
          <div className={cn("w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 flex items-center justify-center rounded-2xl", mode === 'tryout' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600")}>
            {mode === 'tryout' ? <Target className="w-6 h-6 md:w-8 md:h-8" /> : <Zap className="w-6 h-6 md:w-8 md:h-8" />}
          </div>
          <h2 className="text-xl md:text-3xl font-black mb-2 text-slate-900">{mode === 'tryout' ? 'Simulasi Ujian Lisensi Barber' : 'Latihan Teknik Spesifik'}</h2>
          <p className="text-sm md:text-base text-slate-500 mb-6 md:mb-8 max-w-md mx-auto">
            {mode === 'tryout' 
              ? 'Simulasi ujian teori pangkas rambut standar dengan pembatasan waktu dan skenario pelayanan pelanggan.' 
              : 'Asah fokus Anda pada area tertentu seperti teknik gradasi pisau atau komunikasi isyarat.'}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-10">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Kategori Belajar</label>
                <select value={subtest} onChange={(e) => setSubtest(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-semibold">
                  {SUBTESTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Pilih Topik</label>
                <select value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-semibold">
                  {(SUBTEST_TOPICS[subtest as any] || []).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              {mode === 'drilling' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Kesulitan</label>
                      <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none capitalize">
                        <option value="mudah">Mudah</option>
                        <option value="sedang">Sedang</option>
                        <option value="sulit">Sulit</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Jumlah Soal</label>
                      <select value={drillingCount} onChange={(e) => setDrillingCount(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                        <option value={5}>5 Soal</option>
                        <option value={10}>10 Soal</option>
                        <option value={15}>15 Soal</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Waktu Latihan (Menit)</label>
                    <input 
                      type="range" min="1" max="60" value={duration} 
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600" 
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                      <span>1 Menit</span>
                      <span className="text-emerald-600">{duration} Menit</span>
                      <span>60 Menit</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                  <h4 className="font-bold text-blue-600 mb-2 flex items-center gap-2"><Info className="w-4 h-4" /> Aturan Simulasi</h4>
                  <ul className="text-xs text-blue-700 space-y-2 list-disc pl-4">
                    <li>10 Soal Skenario HOTS Barber</li>
                    <li>Waktu: 10 Menit</li>
                    <li>Sertifikat progres otomatis bertambah</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={startSession} 
            className={cn(
              "w-full py-4 text-white rounded-2xl font-bold shadow-lg transition-all",
              mode === 'tryout' ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            Mulai {mode === 'tryout' ? 'Evaluasi' : 'Latihan'} Sekarang
          </button>
        </div>
      </motion.div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h3 className="text-xl font-bold">AI Sedang Menyusun Soal Barber...</h3>
        <p className="text-slate-500">Menyusun skenario salon & teknik potong visual untuk Anda.</p>
      </div>
    );
  }

  if (step === 'active') {
    const q = questions[currentIndex];
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("px-3 py-1 rounded-lg text-xs font-bold text-white", mode === 'tryout' ? "bg-blue-600" : "bg-emerald-600")}>
              Soal {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-sm font-bold text-slate-400">{subtest}</span>
          </div>
          <div className={cn("text-sm font-bold flex items-center gap-2", timeLeft < 60 ? "text-red-600 animate-pulse" : "text-blue-600")}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="bg-white p-6 md:p-12 rounded-[30px] md:rounded-[40px] border border-slate-200 shadow-sm">
          <h3 className="text-lg md:text-2xl font-bold leading-relaxed mb-6 md:mb-10 text-slate-800">{q.text}</h3>
          
          <div className="space-y-3 md:space-y-4">
            {Object.entries(q.options).map(([key, val]: any) => (
              <button 
                key={key} 
                onClick={() => setAnswers({...answers, [currentIndex]: key})}
                className={cn(
                  "w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 group",
                  answers[currentIndex] === key 
                    ? (mode === 'tryout' ? "border-blue-600 bg-blue-50" : "border-emerald-600 bg-emerald-50")
                    : "border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                )}
              >
                <span className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all",
                  answers[currentIndex] === key 
                    ? (mode === 'tryout' ? "bg-blue-600 text-white" : "bg-emerald-600 text-white") 
                    : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                )}>{key}</span>
                <span className="font-medium text-slate-700">{val}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button 
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="px-6 py-3 text-slate-400 font-bold disabled:opacity-0"
          >
            Sebelumnya
          </button>
          {currentIndex === questions.length - 1 ? (
            <button 
              onClick={finishTryout} 
              className={cn("px-10 py-4 text-white rounded-2xl font-bold shadow-lg transition-all", mode === 'tryout' ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700")}
            >
              Selesai & Lihat Hasil
            </button>
          ) : (
            <button onClick={() => setCurrentIndex(currentIndex + 1)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-black transition-all">
              Selanjutnya
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center space-y-8">
        <div className="bg-white p-8 md:p-12 rounded-[40px] md:rounded-[50px] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className={cn("absolute top-0 left-0 w-full h-2", mode === 'tryout' ? "bg-blue-600" : "bg-emerald-600")} />
          <Award className={cn("w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6", mode === 'tryout' ? "text-blue-600" : "text-emerald-600")} />
          <h2 className="text-2xl md:text-4xl font-black mb-2 text-slate-900">{mode === 'tryout' ? 'Evaluasi Selesai!' : 'Latihan Selesai!'}</h2>
          <p className="text-sm md:text-base text-slate-500 mb-8 md:mb-10">Karya luar biasa! Berikut ringkasan pencapaian Anda.</p>
          
          <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
            <div className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100">
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase mb-1">Skor Akhir</p>
              <p className={cn("text-3xl md:text-5xl font-black", mode === 'tryout' ? "text-blue-600" : "text-emerald-600")}>{finalScore.score}%</p>
            </div>
            <div className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100">
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase mb-1">Jawaban Benar</p>
              <p className="text-3xl md:text-5xl font-black text-slate-900">{finalScore.correctAnswers} / {finalScore.totalQuestions}</p>
            </div>
          </div>

          <button onClick={() => setStep('setup')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all">
            Coba Sesi Kuis Lain
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-left">
          <h3 className="font-bold text-slate-800 mb-6 text-lg">Pembahasan Skenario & Teknik</h3>
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-4 mb-4">
                  <span className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                    answers[idx] === q.correct ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                  )}>{idx + 1}</span>
                  <p className="font-bold text-sm text-slate-800">{q.text}</p>
                </div>
                <div className="pl-12 space-y-2">
                  <p className="text-xs text-slate-700"><span className="font-bold">Jawaban Anda:</span> {answers[idx] ? `${answers[idx]}. ${q.options[answers[idx]]}` : '-'}</p>
                  <p className="text-xs text-slate-700"><span className="font-bold text-emerald-600">Jawaban Benar:</span> {q.correct}. {q.options[q.correct]}</p>
                  <div className="text-xs text-slate-500 mt-2 bg-white border border-slate-200 p-3 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    <p className="italic">{q.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}
