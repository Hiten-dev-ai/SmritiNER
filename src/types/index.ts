export type AppMode = 'patient' | 'caregiver' | 'asha';

export type ThemeMode = 'tea' | 'brahma' | 'contrast';
export type FontSizeScale = 'normal' | 'large' | 'extralarge';

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  nativeLanguage: 'Assamese' | 'Bengali' | 'Bodo' | 'Manipuri' | 'Hindi' | 'English';
  villageOrDistrict: string;
  state: 'Assam' | 'Meghalaya' | 'Manipur' | 'Mizoram' | 'Nagaland' | 'Tripura' | 'Arunachal Pradesh' | 'Sikkim';
  diagnosisStage: 'Mild Cognitive Impairment' | 'Early Stage Dementia' | 'Moderate Dementia';
  emergencyContactName: string;
  emergencyContactPhone: string;
  ashaWorkerAssigned?: string;
  notes?: string;
}

export type GameType = 
  | 'majuli_memory'
  | 'chai_harvest'
  | 'daily_sequence'
  | 'weave_pattern'
  | 'reminiscence_album';

export type DifficultyTier = 1 | 2 | 3 | 4 | 5;

export interface GameSession {
  id?: number;
  patientId: string;
  gameType: GameType;
  gameTitle: string;
  score: number;
  maxPossibleScore: number;
  accuracy: number; // 0 - 100%
  durationSeconds: number;
  difficultyLevel: DifficultyTier; // 1 to 5
  hesitationsCount: number;
  hintsUsedCount: number;
  avgReactionTimeMs: number;
  completedAt: string; // ISO string
  synced: boolean;
}

export interface CognitiveMetrics {
  memoryIndex: number;        // 0 - 100
  attentionIndex: number;     // 0 - 100
  executiveFunction: number;  // 0 - 100
  motorReactionScore: number; // 0 - 100
  overallCognitiveScore: number; // 0 - 100
  fatigueIndex: number;       // 0 - 100
  riskOfDecline: 'Low' | 'Moderate' | 'High';
  clinicalSummary: string;
}

export interface ReminderItem {
  id?: number;
  patientId: string;
  title: string;
  category: 'medicine' | 'hydration' | 'routine' | 'appointment' | 'prayer';
  time: string; // e.g. "08:00 AM"
  notes?: string;
  dosage?: string;
  completedDates: string[]; // ['2026-08-27', ...]
  iconName: string;
  synced: boolean;
}

export interface ReminiscencePhoto {
  id?: number;
  patientId: string;
  imageUrl: string;
  title: string;
  relationshipOrPlace: string;
  year?: string;
  memoryPromptQuestion: string;
  correctAnswer: string;
  audioPromptHint?: string;
  synced: boolean;
}

export interface AshaScreeningRecord {
  id?: number;
  elderName: string;
  elderAge: number;
  villageName: string;
  district: string;
  ashaWorkerName: string;
  screeningDate: string;
  orientationScore: number; // Max 5 (Year, Season, Month, Day, Place)
  memoryRecallScore: number; // Max 5 (5 regional words)
  attentionMathScore: number; // Max 5 (Counting reverse / sequence)
  handloomPatternScore: number; // Max 5
  routineRecallScore: number; // Max 5
  totalScore: number; // Max 25
  dementiaRiskCategory: 'Normal Cognitive Aging' | 'Mild Impairment / Watchlist' | 'Urgent Neurological Referral';
  ashaNotes: string;
  synced: boolean;
}

export interface DailyHydrationLog {
  id?: number;
  patientId: string;
  date: string; // YYYY-MM-DD
  glassesDrunk: number;
  targetGlasses: number;
  synced: boolean;
}
