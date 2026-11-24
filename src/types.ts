import { Timestamp } from 'firebase/firestore';

export type Tab = 'home' | 'solver' | 'generator' | 'tryout' | 'tips' | 'dashboard' | 'profile';

export const SUBTESTS = [
  "Teknik Dasar (Alat & Gradasi)",
  "Gaya Rambut (Modern & Klasik)",
  "Komunikasi Isyarat & Visual"
] as const;

export type SubtestName = typeof SUBTESTS[number];

export const SUBTEST_TOPICS: Record<SubtestName, string[]> = {
  "Teknik Dasar (Alat & Gradasi)": [
    "Memegang Gunting & Clipper",
    "Sectioning (Pembagian Rambut)",
    "Tapering & Fading (Gradasi)",
    "Finishing, Lining & Razor Work"
  ],
  "Gaya Rambut (Modern & Klasik)": [
    "Buzz Cut & Crew Cut (Cepak)",
    "Sidepart & Undercut",
    "Pompadour & Quiff",
    "Two-Block Style & Comma Hair",
    "Mullet & Wolf Cut"
  ],
  "Komunikasi Isyarat & Visual": [
    "Isyarat Model Potongan Rambut",
    "Membaca Referensi Foto Pelanggan",
    "Isyarat Panjang Rambut (Atas & Samping)",
    "Isyarat Feedback & Kepuasan Pelanggan"
  ]
};

// Maps for Firestore-compatibility (since the rules enforce subtest in ['TWK', 'TIU', 'TKP'])
export const SUBTEST_MAP: Record<string, string> = {
  "TWK": "Teknik Dasar (Alat & Gradasi)",
  "TIU": "Gaya Rambut (Modern & Klasik)",
  "TKP": "Komunikasi Isyarat & Visual"
};

export const REVERSE_SUBTEST_MAP: Record<string, string> = {
  "Teknik Dasar (Alat & Gradasi)": "TWK",
  "Gaya Rambut (Modern & Klasik)": "TIU",
  "Komunikasi Isyarat & Visual": "TKP"
};

export interface UserProgress {
  streak: number;
  totalSolved: number;
  accuracy: Record<string, number>;
  lastActive: any;
}

export interface SolvedQuestion {
  id?: string;
  uid: string;
  question: string;
  subtest: "TWK" | "TIU" | "TKP";
  answer: string;
  timestamp: Timestamp;
}

export interface TryoutResult {
  id?: string;
  uid: string;
  type: 'tryout' | 'drilling';
  subtest: string; // TWK, TIU, TKP in DB
  difficulty: 'mudah' | 'sedang' | 'sulit' | 'campuran';
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  duration: number;
  timestamp: Timestamp;
}

export interface AnalysisResult {
  id?: string;
  status: string;
  learningPath: string;
  recommendedSubtest: string; // e.g. "Teknik Dasar (Alat & Gradasi)"
  recommendedTopic: string;
  actionPlanMarkdown: string;
  timestamp: Timestamp;
}
