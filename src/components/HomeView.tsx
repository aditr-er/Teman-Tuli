import { motion } from 'motion/react';
import { 
  Zap, Target, TrendingUp, BookOpen, ChevronRight, Scissors, MessageSquareCode, Sparkles, AlertCircle, Award, LayoutDashboard
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '../lib/utils';

interface HomeViewProps {
  user: any;
  progress: any;
  history: any[];
  tryoutResults: any[];
  onTabChange: (tab: any) => void;
  onLogin: () => void;
}

export default function HomeView({ 
  user, progress, history, tryoutResults, onTabChange, onLogin 
}: HomeViewProps) {
  const combinedLog = [...(history || []), ...(tryoutResults || [])].sort((a: any, b: any) => {
    const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
    const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
    return tB - tA;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 pt-4 md:pt-0">
        <div>
          <div className="md:hidden flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">KawanCukur</h1>
            </div>
            {user && (
              <button onClick={() => onTabChange('profile')} className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-200">
                <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            )}
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">Halo, {user?.displayName?.split(' ')[0] || 'Rekan Barber'}! ✂️👋</h2>
          <p className="text-sm md:text-base text-slate-600 mt-1">
            Siap untuk mengasah teknik cukuran dan komunikasi visual terbaik hari ini?
          </p>
        </div>
        {!user && (
          <button onClick={onLogin} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all">
            Mulai Belajar Sekarang
          </button>
        )}
      </header>

      {user && progress && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          <StatCard icon={<Zap className="text-orange-500 w-5 h-5 md:w-6 md:h-6" />} label="Streak Belajar" value={`${progress.streak || 0} Hari`} color="bg-orange-50" />
          <StatCard icon={<Target className="text-blue-500 w-5 h-5 md:w-6 md:h-6" />} label="Latihan Selesai" value={progress.totalSolved || 0} color="bg-blue-50" />
          <div className="col-span-2 md:col-span-1">
            <StatCard icon={<TrendingUp className="text-green-500 w-5 h-5 md:w-6 md:h-6" />} label="Rata-rata Skor" value={`${progress.accuracy?.TIU || 0}%`} color="bg-green-50" />
          </div>
        </div>
      )}

      {/* Visual Learning Assist Banner for Deaf Employees */}
      <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="p-3 bg-amber-100 rounded-2xl text-amber-700 shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-amber-900 text-sm md:text-base">Fitur Ramah Teman Tuli (Visual-First)</h4>
          <p className="text-xs md:text-sm text-amber-800 leading-relaxed mt-0.5">
            Gunakan <strong>Kamus Isyarat</strong> di bawah saat berkonsultasi dengan pelanggan hearing. Anda dapat menunjukkan layar HP/Tablet berisi kartu komunikasi visual agar pelanggan dapat memilih panjang rambut atas/samping secara instan!
          </p>
        </div>
      </div>

      <section>
        <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-slate-800">Akses Cepat Pelatihan</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <QuickActionCard 
            onClick={() => onTabChange('solver')}
            icon={<Scissors className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />}
            title="Analisis Gaya AI"
            desc="Unggah foto gaya rambut untuk membedah nomor clipper, gradasi, & langkah guntingnya."
          />
          <QuickActionCard 
            onClick={() => onTabChange('generator')}
            icon={<BookOpen className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />}
            title="Panduan Belajar"
            desc="Buat panduan materi teknik dasar atau gaya rambut populer dengan petunjuk visual."
          />
          <QuickActionCard 
            onClick={() => onTabChange('tryout')}
            icon={<Target className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />}
            title="Simulasi Kuis"
            desc="Uji kemampuan teknik cukur & komunikasi dalam skenario barbershop nyata."
          />
          <QuickActionCard 
            onClick={() => onTabChange('tips')}
            icon={<MessageSquareCode className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />}
            title="Kamus Isyarat"
            desc="Kartu komunikasi visual & bahasa isyarat barber untuk interaksi dengan pelanggan."
          />
        </div>
      </section>

      <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-slate-800">Lanjutkan Belajar</h3>
          <button onClick={() => onTabChange('dashboard')} className="text-blue-600 font-bold text-sm flex items-center gap-1">Lihat Semua <ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          {combinedLog && combinedLog.length > 0 ? (
            <div onClick={() => onTabChange('dashboard')} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all cursor-pointer group">
              <div className={cn(
                "p-3 rounded-xl shadow-sm",
                combinedLog[0].type === 'tryout' || combinedLog[0].type === 'drilling' ? "bg-orange-50 text-orange-600" : "bg-white text-blue-600"
              )}>
                {combinedLog[0].type === 'tryout' || combinedLog[0].type === 'drilling' ? <Target className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 line-clamp-1">
                  {combinedLog[0].type === 'tryout' ? 'Simulasi Evaluasi' : combinedLog[0].type === 'drilling' ? 'Latihan Soal Kustom' : `${combinedLog[0].subtest || 'Analisis'} - AI Assistant`}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1 mb-1">
                  {combinedLog[0].type === 'tryout' || combinedLog[0].type === 'drilling' 
                    ? `Skor: ${combinedLog[0].score}% • Betul: ${combinedLog[0].correctAnswers}/${combinedLog[0].totalQuestions}` 
                    : (combinedLog[0].question || "Generated Practice")}
                </p>
                <p className="text-xs text-blue-600 font-medium opacity-80">
                  {combinedLog[0].timestamp ? formatDistanceToNow(combinedLog[0].timestamp.toDate(), { addSuffix: true, locale: id }) : 'baru saja'}
                </p>
              </div>
              <ChevronRight className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          ) : (
            <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-sm">
              Belum ada riwayat aktivitas. Mulai pelajari teknik dasar atau simulasi kuis!
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-3 md:gap-4 bg-white">
      <div className={cn("p-3 md:p-4 rounded-xl md:rounded-2xl w-fit", color)}>{icon}</div>
      <div>
        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-lg md:text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function QuickActionCard({ icon, title, desc, onClick }: any) {
  return (
    <button onClick={onClick} className="group relative bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left overflow-hidden flex flex-col h-full w-full">
      <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-slate-50 rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16 transition-all group-hover:scale-150 opacity-50" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-3 md:mb-4">{icon}</div>
        <h4 className="text-base md:text-lg font-bold mb-1 md:mb-2 text-slate-800">{title}</h4>
        <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 md:line-clamp-none flex-grow">{desc}</p>
      </div>
    </button>
  );
}
