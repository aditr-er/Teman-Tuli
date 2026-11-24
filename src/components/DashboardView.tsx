import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  SUBTESTS, SUBTEST_TOPICS, SUBTEST_MAP, REVERSE_SUBTEST_MAP 
} from '../types';
import { 
  TrendingUp, Brain, Loader2, Sparkles, PlusCircle, ChevronLeft, Target, Zap, History, Scissors
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { db, auth } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '../lib/utils';

export default function DashboardView({ 
  progress, history, tryoutResults, analyses, onTabChange, onNavigateWithContext 
}: any) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const latestAnalysis = analyses && analyses.length > 0 ? analyses[0] : null;

  const tryouts = tryoutResults.filter((t: any) => t.type === 'tryout');
  const drillings = tryoutResults.filter((t: any) => t.type === 'drilling');

  const chartData = tryoutResults.length > 0 
    ? tryoutResults.slice().reverse().map((t: any) => ({
        name: t.timestamp ? t.timestamp.toDate().toLocaleDateString('id-ID', { weekday: 'short' }) : '...',
        score: t.score,
        type: t.type === 'tryout' ? 'Evaluasi' : 'Latihan'
      }))
    : [];

  const getSubtestAccuracy = (subtestKey: string) => {
    const results = tryoutResults.filter((t: any) => t.subtest === subtestKey);
    if (results.length === 0) return 0;
    const total = results.reduce((acc: number, curr: any) => acc + curr.score, 0);
    return Math.round(total / results.length);
  };

  const generateAnalysis = async () => {
    if (tryoutResults.length === 0) return;
    setIsAnalyzing(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const currentAi = new GoogleGenAI({ apiKey: apiKey || '' });
      
      const stats = tryoutResults.map((t: any) => ({
        type: t.type,
        subtest: SUBTEST_MAP[t.subtest] || t.subtest,
        score: t.score,
        correct: t.correctAnswers,
        total: t.totalQuestions
      }));

      const prompt = `
        Analisis data performa kuis pangkas rambut/barbershop berikut: ${JSON.stringify(stats.slice(0, 10))}
        Rekomendasikan langkah belajar selanjutnya untuk teman tuli ini agar menjadi barber profesional yang mahir baik secara teknis maupun komunikasi visual.
        Berikan output dalam format JSON yang valid dengan struktur persis seperti ini:
        {
          "status": "Ringkasan singkat posisi kemampuan teknik cukur user saat ini (1-2 kalimat)",
          "learningPath": "Saran latihan konkret berikutnya yang direkomendasikan",
          "recommendedSubtest": "Pilih salah satu persis dari daftar ini: Teknik Dasar (Alat & Gradasi), Gaya Rambut (Modern & Klasik), atau Komunikasi Isyarat & Visual",
          "recommendedTopic": "Topik spesifik dari subtes tersebut yang perlu diprioritaskan",
          "actionPlanMarkdown": "Analisis terperinci dan rencana tindakan belajar visual dalam format markdown"
        }
        Jangan sertakan teks lain sebelum atau sesudah JSON.
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

      // Map the recommended subtest back to rule-compliant DB code if it matches
      let recSub = data.recommendedSubtest;
      // Normalizing format
      if (recSub.includes("Teknik Dasar")) recSub = "Teknik Dasar (Alat & Gradasi)";
      else if (recSub.includes("Gaya")) recSub = "Gaya Rambut (Modern & Klasik)";
      else if (recSub.includes("Komunikasi")) recSub = "Komunikasi Isyarat & Visual";

      await addDoc(collection(db, 'users', auth.currentUser!.uid, 'analyses'), {
        status: data.status,
        learningPath: data.learningPath,
        recommendedSubtest: recSub,
        recommendedTopic: data.recommendedTopic,
        actionPlanMarkdown: data.actionPlanMarkdown,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui analisis AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => onTabChange('home')} className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-2xl md:text-3xl font-bold">Dashboard & Perkembangan Barber</h2>
        </div>
      </div>

      {/* Realtime Analysis & Learning Path */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden border border-slate-800">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-400" /> AI Coach & Rencana Belajar
            </h3>
            <button 
              onClick={generateAnalysis} 
              disabled={isAnalyzing || tryoutResults.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 w-fit cursor-pointer"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isAnalyzing ? 'Menganalisis Progres...' : 'Perbarui Analor Coach'}
            </button>
          </div>

          {latestAnalysis ? (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                  <p className="text-blue-300 text-xs font-bold uppercase mb-2">Evaluasi Performa</p>
                  <p className="text-sm md:text-base leading-relaxed">{latestAnalysis.status}</p>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                  <p className="text-blue-300 text-xs font-bold uppercase mb-2">Saran AI Tutor</p>
                  <p className="text-sm md:text-base leading-relaxed">{latestAnalysis.learningPath}</p>
                </div>
              </div>

              <div className="bg-white text-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Rekomendasi Fokus Belajar</p>
                    <h4 className="text-lg font-bold text-blue-600">{latestAnalysis.recommendedSubtest}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Topik: {latestAnalysis.recommendedTopic}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => onNavigateWithContext('generator', latestAnalysis.recommendedSubtest, latestAnalysis.recommendedTopic)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" /> Materi Generator
                    </button>
                    <button 
                      onClick={() => onNavigateWithContext('tryout', latestAnalysis.recommendedSubtest, latestAnalysis.recommendedTopic)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Target className="w-4 h-4" /> Mulai Kuis Fokus
                    </button>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none border-t border-slate-100 pt-4 mt-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{latestAnalysis.actionPlanMarkdown}</ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/10">
              <p className="mb-4 text-slate-300 text-sm">Belum ada analisis performa. Selesaikan minimal satu kuis kustom atau simulasi, lalu klik tombol di atas untuk mendapatkan coaching & rencana belajar Anda.</p>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold mb-4 md:mb-6 flex items-center gap-2 text-slate-800"><TrendingUp className="w-5 h-5 text-blue-600" /> Tren Hasil Latihan (Kuis)</h3>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm">
                Belum ada data kuis untuk membuat grafik tren.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="bg-white p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold mb-4 text-slate-800">Akurasi Per Kategori</h3>
            <div className="space-y-4">
              <ProgressItem label="Teknik Dasar" value={getSubtestAccuracy('TWK')} color="bg-blue-600" />
              <ProgressItem label="Gaya Rambut" value={getSubtestAccuracy('TIU')} color="bg-emerald-600" />
              <ProgressItem label="Komunikasi Isyarat" value={getSubtestAccuracy('TKP')} color="bg-purple-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold mb-4 text-slate-800">Ringkasan Sesi</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Evaluasi</p>
                <p className="text-2xl font-black text-blue-600">{tryouts.length}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Latihan</p>
                <p className="text-2xl font-black text-emerald-600">{drillings.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold mb-4 md:mb-6 flex items-center gap-2 text-blue-600 text-sm md:text-base"><Target className="w-5 h-5" /> Riwayat Evaluasi Menyeluruh</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-4 font-bold">Kategori</th>
                  <th className="pb-4 font-bold">Skor</th>
                  <th className="pb-4 font-bold">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tryouts.map((item: any) => (
                  <tr key={item.id} className="group hover:bg-slate-50 transition-all">
                    <td className="py-4">
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-bold uppercase">{SUBTEST_MAP[item.subtest]?.split(' ')[0] || item.subtest}</span>
                    </td>
                    <td className="py-4 font-bold text-sm text-slate-800">{item.score}%</td>
                    <td className="py-4 text-[10px] text-slate-500">{item.timestamp?.toDate().toLocaleDateString()}</td>
                  </tr>
                ))}
                {tryouts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400 text-xs">Belum ada riwayat evaluasi menyeluruh.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold mb-4 md:mb-6 flex items-center gap-2 text-emerald-600 text-sm md:text-base"><Zap className="w-5 h-5" /> Riwayat Latihan Mandiri</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-4 font-bold">Kategori</th>
                  <th className="pb-4 font-bold">Sulit</th>
                  <th className="pb-4 font-bold">Skor</th>
                  <th className="pb-4 font-bold">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drillings.map((item: any) => (
                  <tr key={item.id} className="group hover:bg-slate-50 transition-all">
                    <td className="py-4">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold uppercase">{SUBTEST_MAP[item.subtest]?.split(' ')[0] || item.subtest}</span>
                    </td>
                    <td className="py-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{item.difficulty}</span>
                    </td>
                    <td className="py-4 font-bold text-sm text-slate-800">{item.score}%</td>
                    <td className="py-4 text-[10px] text-slate-500">{item.timestamp?.toDate().toLocaleDateString()}</td>
                  </tr>
                ))}
                {drillings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">Belum ada riwayat latihan mandiri.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Analysis History */}
      {analyses && analyses.length > 1 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-700"><History className="w-5 h-5 text-slate-400" /> Riwayat Konsultasi AI Coach</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analyses.slice(1).map((ana: any) => (
              <div key={ana.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-sm md:text-base">{ana.recommendedSubtest}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-1 rounded-md">{ana.timestamp ? formatDistanceToNow(ana.timestamp.toDate(), { locale: id, addSuffix: true }) : ''}</span>
                </div>
                <p className="text-xs text-slate-600 mb-4 line-clamp-2">{ana.status}</p>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => onNavigateWithContext('generator', ana.recommendedSubtest, ana.recommendedTopic)}
                    className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" /> Latih Topik Ini
                  </button>
                  <button 
                    onClick={() => onNavigateWithContext('tryout', ana.recommendedSubtest, ana.recommendedTopic)}
                    className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                  >
                    <Target className="w-3 h-3" /> Uji Kuis
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ProgressItem({ label, value, color }: any) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-800">{value}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} className={cn("h-full", color)} />
      </div>
    </div>
  );
}
