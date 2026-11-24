import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COMMUNICATION_CUES, CommunicationCue } from '../data';
import { 
  Sparkles, ChevronLeft, Eye, BookOpen, Volume2, ArrowRight, CheckCircle2, Copy, Check, Info, Scissors, Target, Layers, HelpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

interface HeadZone {
  id: string;
  name: string;
  indonesianName: string;
  technique: string;
  clipperGuard: string;
  angle: number;
  description: string;
  visualSteps: string[];
  color: string;
  textColor: string;
  icon: string;
}

const HEAD_ZONES: HeadZone[] = [
  {
    id: 'top-apex',
    name: 'Top / Apex',
    indonesianName: 'Bagian Atas Kepala',
    technique: 'Overdirection & Scissor Work (Potong Gunting)',
    clipperGuard: 'Hanya Gunting manual (atau Clipper Guard besar #6 - #8)',
    angle: 90,
    description: 'Bagian paling atas kepala di mana panjang rambut menentukan style utama. Di sini kita menentukan volume dan arah sisiran (pompadour, quiff, sidepart).',
    visualSteps: [
      'Semprotkan air agar rambut lembab dan mudah dijepit jari.',
      'Ambil sekat rambut lurus (section), tarik tegak lurus ke atas (sudut 90 derajat).',
      'Jepit erat di antara jari telunjuk dan jari tengah Anda.',
      'Potong sejajar dengan jari secara merata sebagai panduan panjang utama.'
    ],
    color: 'bg-blue-600',
    textColor: 'text-blue-600',
    icon: '📏'
  },
  {
    id: 'crown',
    name: 'Crown',
    indonesianName: 'Ubun-ubun / Pusaran',
    technique: 'Point Cutting (Menghindari Rambut Berdiri)',
    clipperGuard: 'Clipper Guard #4 - #6 atau Gunting Penipis',
    angle: 45,
    description: 'Area pusaran rambut di bagian belakang atas. Di area ini, arah pusaran rambut pelanggan sangat kuat. Memotong terlalu pendek akan membuat rambut berdiri (mencuat).',
    visualSteps: [
      'Perhatikan arah melingkar pusaran rambut alami pelanggan sebelum memotong.',
      'Jangan potong terlalu pendek agar rambut atas tetap jatuh dengan rapi.',
      'Gunakan ujung gunting vertikal (point cutting) untuk memberi tekstur lembut.',
      'Hindari penggunaan clipper terlalu tinggi di area sensitif ini.'
    ],
    color: 'bg-emerald-600',
    textColor: 'text-emerald-600',
    icon: '🌀'
  },
  {
    id: 'temple-sides',
    name: 'Temple & Sides',
    indonesianName: 'Samping & Pelipis',
    technique: 'Fading / Gradasi & Clipper Over Comb',
    clipperGuard: 'Clipper Guard #1, #2, #3 untuk gradasi mulus',
    angle: 0,
    description: 'Bagian samping di atas telinga hingga pelipis. Bagian krusial untuk membuat gradasi samping (fade) yang bersih dan simetris kanan-kiri.',
    visualSteps: [
      'Gunakan gerakan melenting keluar (C-cup motion) saat mengayunkan clipper.',
      'Mulai dari ukuran terkecil di bagian bawah pelipis (clipper tanpa pelindung atau #1).',
      'Naikkan ukuran sepatu clipper secara bertahap untuk menghapus garis batas rambut.',
      'Gunakan teknik clipper-over-comb (sisir miring) untuk menyambung ke bagian atas.'
    ],
    color: 'bg-purple-600',
    textColor: 'text-purple-600',
    icon: '💈'
  },
  {
    id: 'occipital',
    name: 'Occipital Bone',
    indonesianName: 'Belakang Tengah (Tulang Menonjol)',
    technique: 'Blending & Gradasi Menengah',
    clipperGuard: 'Clipper Guard #2 atau #3',
    angle: 45,
    description: 'Bagian tengah belakang kepala di area tulang oksipital. Ini adalah area transisi antara gradasi tipis di bawah tengkuk dan rambut panjang di atas.',
    visualSteps: [
      'Jaga ketebalan di area ini agar bentuk kepala belakang terlihat bulat ideal (tidak peyang).',
      'Ayunkan clipper menjauh dari kulit kepala saat mencapai tulang menonjol ini.',
      'Gunakan sisir pemandu datar untuk menyelaraskan rambut panjang atas dengan sisi bawah.'
    ],
    color: 'bg-orange-600',
    textColor: 'text-orange-600',
    icon: '🦴'
  },
  {
    id: 'nape',
    name: 'Nape / Neckline',
    indonesianName: 'Tengkuk / Batas Leher',
    technique: 'Tapering & Neckline Lining (Perapian Batas)',
    clipperGuard: 'Trimmer, Razor (Pisau Lipat), atau Clipper 0.5',
    angle: 0,
    description: 'Bagian paling bawah di batas leher. Kebersihan pengerjaan di sini menentukan kerapian akhir dari seluruh potongan rambut.',
    visualSteps: [
      'Buat batas garis potongan (outlining) yang bersih menggunakan alat Trimmer.',
      'Regangkan kulit leher dengan tangan kiri agar pisau cukur meluncur aman.',
      'Gunakan pisau lipat (razor) dengan kemiringan 30 derajat untuk mencukur rambut halus.',
      'Berikan pijatan ringan atau bersihkan sisa rambut leher dengan kuas lembut.'
    ],
    color: 'bg-rose-600',
    textColor: 'text-rose-600',
    icon: '🪒'
  }
];

export default function SignLibraryView({ onTabChange }: { onTabChange: (tab: any) => void }) {
  const [subTab, setSubTab] = useState<'sign' | 'head-map'>('sign');
  
  // State for Sign Library
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Model' | 'Panjang Samping' | 'Panjang Atas' | 'Feedback'>('All');
  const [activeCue, setActiveCue] = useState<CommunicationCue | null>(null);
  const [copied, setCopied] = useState(false);

  // State for Head Map
  const [selectedZone, setSelectedZone] = useState<HeadZone>(HEAD_ZONES[0]);

  const categories: ('All' | 'Model' | 'Panjang Samping' | 'Panjang Atas' | 'Feedback')[] = [
    'All', 'Model', 'Panjang Samping', 'Panjang Atas', 'Feedback'
  ];

  const filteredCues = selectedCategory === 'All' 
    ? COMMUNICATION_CUES 
    : COMMUNICATION_CUES.filter(cue => cue.category === selectedCategory);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => onTabChange('home')} className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Pusat Belajar Visual & Komunikasi Barber</h2>
            <p className="text-sm text-slate-600 font-medium">Modul visual ramah Teman Tuli untuk menguasai komunikasi salon dan anatomi potongan.</p>
          </div>
        </div>
      </div>

      {/* Dual Sub-tab Selector */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 max-w-lg shadow-sm">
        <button 
          onClick={() => setSubTab('sign')}
          className={cn(
            "flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
            subTab === 'sign' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          <BookOpen className="w-4 h-4" /> Kamus Isyarat Pelanggan
        </button>
        <button 
          onClick={() => setSubTab('head-map')}
          className={cn(
            "flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
            subTab === 'head-map' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          <Layers className="w-4 h-4" /> Peta Visual Potongan Kepala
        </button>
      </div>

      {subTab === 'sign' ? (
        <div className="space-y-8">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border",
                  selectedCategory === cat 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                {cat === 'All' ? 'Semua Isyarat' : cat}
              </button>
            ))}
          </div>

          {/* Helper Banner */}
          <div className="bg-blue-50 border border-blue-100 p-5 rounded-3xl flex items-start gap-4">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-blue-900 text-sm md:text-base">Mode Presentasi Pelanggan (Visual Chat)</h4>
              <p className="text-xs md:text-sm text-blue-800 leading-relaxed mt-0.5">
                Klik salah satu kartu komunikasi di bawah untuk membuka <strong>Layar Penuh Dialog</strong>. Tunjukkan layar HP/Tablet Anda langsung kepada pelanggan di kursi pangkas agar mereka dapat membaca instruksi dengan ukuran teks besar dan nyaman!
              </p>
            </div>
          </div>

          {/* Grid of Cues */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCues.map((cue) => (
              <div 
                key={cue.id}
                onClick={() => setActiveCue(cue)}
                className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col hover:-translate-y-0.5 group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{cue.emoji}</span>
                  <div>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold uppercase tracking-wider">{cue.category}</span>
                    <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors mt-1">{cue.title}</h3>
                  </div>
                </div>
                
                <p className="text-slate-600 text-xs leading-relaxed flex-grow">{cue.description}</p>
                
                <div className="border-t border-slate-100 pt-4 mt-4 space-y-2">
                  <p className="text-[11px] text-slate-500">
                    <span className="font-bold text-blue-600 uppercase tracking-wide text-[9px] block">👋 Gerakan Isyarat Anda:</span>
                    {cue.signInstruction}
                  </p>
                </div>

                <button className="mt-4 w-full py-2.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-100 hover:border-blue-100">
                  <Eye className="w-4 h-4" /> Tunjukkan ke Pelanggan
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Head Graphic representation */}
          <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
            <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">Pilih Zona Kepala</h3>
            
            {/* Interactive Anatomical Silhouette Head Mockup */}
            <div className="relative w-full max-w-[280px] aspect-square bg-slate-950 rounded-[40px] flex items-center justify-center border-4 border-slate-800 overflow-hidden shadow-inner">
              {/* Profile Background Graphics lines */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              {/* Silhouette representation styled in pure beautiful CSS */}
              <div className="w-48 h-48 rounded-full bg-slate-900 border-2 border-slate-800 relative">
                {/* Hair Outline Glow */}
                <div className="absolute -top-4 -left-4 w-56 h-56 rounded-full border-4 border-blue-500/10 blur-xl pointer-events-none"></div>
                {/* Ear Shape */}
                <div className="absolute top-[45%] left-[40%] w-10 h-14 rounded-full border-2 border-slate-700 bg-slate-950 flex items-center justify-center text-[10px] text-slate-500 font-bold">👂</div>
              </div>

              {/* Glowing Interactive Buttons positioned absolutely over anatomical head positions */}
              {/* 1. TOP APEX BUTTON */}
              <button 
                onClick={() => setSelectedZone(HEAD_ZONES[0])}
                className={cn(
                  "absolute top-[18%] left-[50%] -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer z-20 shadow-md",
                  selectedZone.id === 'top-apex' ? "bg-blue-600 text-white ring-4 ring-blue-500/30 scale-110" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                )}
              >
                <span>📏</span> Top/Apex
              </button>

              {/* 2. CROWN BUTTON */}
              <button 
                onClick={() => setSelectedZone(HEAD_ZONES[1])}
                className={cn(
                  "absolute top-[28%] left-[22%] -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer z-20 shadow-md",
                  selectedZone.id === 'crown' ? "bg-emerald-600 text-white ring-4 ring-emerald-500/30 scale-110" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                )}
              >
                <span>🌀</span> Crown
              </button>

              {/* 3. TEMPLE SIDES BUTTON */}
              <button 
                onClick={() => setSelectedZone(HEAD_ZONES[2])}
                className={cn(
                  "absolute top-[48%] left-[70%] -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer z-20 shadow-md",
                  selectedZone.id === 'temple-sides' ? "bg-purple-600 text-white ring-4 ring-purple-500/30 scale-110" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                )}
              >
                <span>💈</span> Sides
              </button>

              {/* 4. OCCIPITAL BUTTON */}
              <button 
                onClick={() => setSelectedZone(HEAD_ZONES[3])}
                className={cn(
                  "absolute top-[55%] left-[22%] -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer z-20 shadow-md",
                  selectedZone.id === 'occipital' ? "bg-orange-600 text-white ring-4 ring-orange-500/30 scale-110" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                )}
              >
                <span>🦴</span> Occipital
              </button>

              {/* 5. NAPE BUTTON */}
              <button 
                onClick={() => setSelectedZone(HEAD_ZONES[4])}
                className={cn(
                  "absolute top-[75%] left-[34%] -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer z-20 shadow-md",
                  selectedZone.id === 'nape' ? "bg-rose-600 text-white ring-4 ring-rose-500/30 scale-110" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                )}
              >
                <span>🪒</span> Nape
              </button>
            </div>

            {/* Zone List below graphic */}
            <div className="w-full mt-6 space-y-2">
              {HEAD_ZONES.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className={cn(
                    "w-full p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3",
                    selectedZone.id === zone.id 
                      ? "bg-slate-900 border-slate-900 text-white shadow-md scale-[1.02]" 
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  )}
                >
                  <span className="text-xl">{zone.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-extrabold uppercase tracking-wide opacity-80">{zone.name}</p>
                    <p className="text-sm font-bold line-clamp-1">{zone.indonesianName}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Zone Detailed Guidelines */}
          <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl p-3 bg-slate-50 border border-slate-100 rounded-2xl">{selectedZone.icon}</span>
                <div>
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white", selectedZone.color)}>
                    ZONA: {selectedZone.name}
                  </span>
                  <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">{selectedZone.indonesianName}</h3>
                </div>
              </div>
              
              {/* Dynamic Cutting Angle Indicator */}
              <div className="text-center p-3 bg-slate-50 border border-slate-200 rounded-2xl min-w-[80px]">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sudut Potong</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{selectedZone.angle}°</p>
              </div>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed border-l-4 border-blue-500 pl-4 py-1 italic bg-slate-50/50 rounded-r-xl">
              "{selectedZone.description}"
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Teknik Utama</span>
                <p className="font-bold text-sm text-slate-800">{selectedZone.technique}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Panduan Clipper Guard</span>
                <p className="font-bold text-sm text-blue-600">{selectedZone.clipperGuard}</p>
              </div>
            </div>

            {/* Step by Step Visual Guide for Deaf barbers */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
                <Scissors className="w-4 h-4 text-blue-600" /> Panduan Langkah Kerja Visual (Ramah Teman Tuli)
              </h4>
              <div className="space-y-3">
                {selectedZone.visualSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-slate-50 hover:bg-slate-100/50 transition-all rounded-2xl border border-slate-100 items-start">
                    <span className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5",
                      selectedZone.color
                    )}>
                      {idx + 1}
                    </span>
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-semibold">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Presentation Modal */}
      <AnimatePresence>
        {activeCue && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white rounded-[32px] max-w-2xl w-full p-8 md:p-12 shadow-2xl relative overflow-hidden"
            >
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-600 to-indigo-600" />
              
              <button 
                onClick={() => setActiveCue(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>

              <div className="text-center space-y-6">
                <span className="text-7xl block animate-bounce">{activeCue.emoji}</span>
                
                <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xs font-extrabold uppercase tracking-widest">
                  {activeCue.category}
                </span>

                <h1 className="text-2xl md:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                  {activeCue.title}
                </h1>

                {/* GIANT card for customer to read */}
                <div className="bg-slate-950 text-white p-8 rounded-[24px] border-4 border-blue-500 shadow-inner relative group text-left">
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                      onClick={() => copyToClipboard(activeCue.customerInstruction)}
                      className="p-1.5 text-slate-400 hover:text-white bg-white/10 rounded-lg transition-all"
                      title="Salin Teks"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">Pesan Untuk Pelanggan (Silakan Baca):</span>
                  <p className="text-xl md:text-2xl font-bold leading-relaxed text-slate-100">
                    "{activeCue.customerInstruction}"
                  </p>
                </div>

                <div className="text-left bg-slate-50 p-6 rounded-[20px] border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Panduan Isyarat untuk Anda (Barber):</span>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    👉 <strong>{activeCue.signInstruction}</strong>
                  </p>
                </div>

                <button 
                  onClick={() => setActiveCue(null)}
                  className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold shadow-lg transition-all text-sm md:text-base flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-400" /> Selesai / Tutup Mode Tampil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
