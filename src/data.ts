export interface CommunicationCue {
  id: string;
  title: string;
  category: 'Model' | 'Panjang Samping' | 'Panjang Atas' | 'Feedback';
  description: string;
  signInstruction: string;
  customerInstruction: string;
  emoji: string;
}

export const COMMUNICATION_CUES: CommunicationCue[] = [
  {
    id: 'cue-1',
    title: 'Pilihan Model Potongan (Pilih Foto)',
    category: 'Model',
    description: 'Menanyakan model potongan rambut yang diinginkan pelanggan dengan menunjukkan katalog foto.',
    signInstruction: 'Tunjuk layar/katalog foto, lalu berikan gestur jempol terbuka dan senyum ramah bertanya.',
    customerInstruction: 'Silakan tunjuk foto gaya rambut yang Anda inginkan pada layar atau tunjukkan foto dari HP Anda.',
    emoji: '📸'
  },
  {
    id: 'cue-2',
    title: 'Samping Sangat Tipis (Skin / Gradasi Tinggi)',
    category: 'Panjang Samping',
    description: 'Menanyakan apakah bagian samping ingin dibuat gradasi sangat tipis (skin fade/clipper guard 0-0.5).',
    signInstruction: 'Gunakan dua jari menggesek samping kulit kepala dekat telinga untuk menunjukkan potongan kulit.',
    customerInstruction: 'Apakah bagian samping ingin dicukur sangat tipis hingga kulit kepala terlihat (gradasi tipis)?',
    emoji: '💈'
  },
  {
    id: 'cue-3',
    title: 'Samping Sedang (Clipper Guard 2-3)',
    category: 'Panjang Samping',
    description: 'Menanyakan apakah bagian samping dicukur dengan panjang sedang (~6mm - 9mm).',
    signInstruction: 'Tunjukkan clipper guard (sepatu clipper) nomor 2 atau 3, tempelkan di bagian samping dengan senyum.',
    customerInstruction: 'Apakah sampingnya dipotong dengan ketebalan sedang (sekitar sepatu clipper ukuran 2 atau 3)?',
    emoji: '✂️'
  },
  {
    id: 'cue-4',
    title: 'Konfirmasi Panjang Rambut Atas',
    category: 'Panjang Atas',
    description: 'Menanyakan seberapa banyak rambut atas yang ingin dipotong.',
    signInstruction: 'Jepit sebagian rambut atas pelanggan dengan jari telunjuk dan tengah, lalu tunjukkan sisa ketebalan dengan jari tangan lainnya.',
    customerInstruction: 'Apakah ketebalan bagian atas yang dipotong segini cukup? (Silakan berikan tanda jempol 👍 jika OK atau tunjukkan dengan jari Anda).',
    emoji: '📏'
  },
  {
    id: 'cue-5',
    title: 'Pemakaian Pomade / Hair Powder',
    category: 'Feedback',
    description: 'Menawarkan penataan rambut akhir menggunakan pomade, powder, atau hair tonic.',
    signInstruction: 'Tunjukkan botol pomade/powder, gosok kedua telapak tangan Anda dan lakukan gerakan menata rambut di atas kepala.',
    customerInstruction: 'Apakah Anda ingin rambut Anda ditata menggunakan pomade atau bedak rambut (hair powder)?',
    emoji: '🧴'
  },
  {
    id: 'cue-6',
    title: 'Konfirmasi Cermin Bagian Belakang',
    category: 'Feedback',
    description: 'Menunjukkan hasil cukuran bagian belakang kepala menggunakan cermin tambahan.',
    signInstruction: 'Pegang cermin kecil di belakang kepala pelanggan, lalu buat gestur jempol bertanya dengan wajah tersenyum.',
    customerInstruction: 'Silakan lihat potongan bagian belakang pada cermin. Apakah sudah sesuai atau ada yang kurang?',
    emoji: '🪞'
  },
  {
    id: 'cue-7',
    title: 'Terima Kasih & Senyum Ramah',
    category: 'Feedback',
    description: 'Mengucapkan terima kasih dengan sopan setelah sesi cukur selesai.',
    signInstruction: 'Satukan kedua telapak tangan di depan dada (gestur namaste) diikuti dengan membungkuk kecil dan senyuman tulus.',
    customerInstruction: 'Terima kasih atas kunjungan Anda! Semoga Anda puas dengan potongan rambut hari ini.',
    emoji: '🙏'
  }
];
