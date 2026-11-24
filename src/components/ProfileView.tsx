import { motion } from 'motion/react';
import { 
  ChevronLeft, Award, LogOut, Settings2, Scissors, Star, MessageSquare
} from 'lucide-react';

export default function ProfileView({ user, progress, onLogout, onTabChange }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => onTabChange('home')} className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-2xl font-bold">Profil Akun Barber</h2>
      </div>
      <div className="bg-white p-6 md:p-10 rounded-[30px] md:rounded-[40px] border border-slate-200 shadow-sm text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 md:h-32 bg-slate-900" />
        <div className="relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white mx-auto mb-4 md:mb-6 overflow-hidden shadow-xl">
            <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black mb-1 text-slate-900">{user?.displayName}</h2>
          <p className="text-sm md:text-base text-slate-500 mb-6">{user?.email}</p>
          
          <div className="flex justify-center gap-4">
            <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Tingkatan Barber</p>
              <p className="font-black text-blue-600 flex items-center justify-center gap-1">
                <Scissors className="w-4 h-4" /> Barber Junior
              </p>
            </div>
            <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Lencana Latihan</p>
              <p className="font-black text-blue-600 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Professional
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        <ProfileMenuItem icon={<Settings2 className="text-slate-400" />} label="Pengaturan Akun & Bahasa Isyarat" />
        <ProfileMenuItem icon={<Award className="text-slate-400" />} label="Pencapaian & Sertifikat Pelatihan" />
        <ProfileMenuItem icon={<MessageSquare className="text-slate-400" />} label="Daftar Kritik & Saran Pelanggan" />
        <button onClick={onLogout} className="w-full flex items-center gap-4 p-6 hover:bg-red-50 transition-all text-red-600 cursor-pointer">
          <LogOut className="w-6 h-6" />
          <span className="font-bold">Keluar dari Aplikasi</span>
        </button>
      </div>
    </motion.div>
  );
}

function ProfileMenuItem({ icon, label }: any) {
  return (
    <div onClick={() => alert('Fitur ini akan segera hadir. Terus semangat berlatih teknik memotong!')} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="w-6 h-6">{icon}</div>
        <span className="font-bold text-slate-700">{label}</span>
      </div>
      <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-all rotate-180" />
    </div>
  );
}
