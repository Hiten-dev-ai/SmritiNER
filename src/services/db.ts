import Dexie, { type Table } from 'dexie';
import type {
  PatientProfile,
  GameSession,
  ReminderItem,
  ReminiscencePhoto,
  AshaScreeningRecord,
  DailyHydrationLog,
} from '../types';

export class SmritiDatabase extends Dexie {
  patients!: Table<PatientProfile, string>;
  gameSessions!: Table<GameSession, number>;
  reminders!: Table<ReminderItem, number>;
  reminiscenceItems!: Table<ReminiscencePhoto, number>;
  ashaScreenings!: Table<AshaScreeningRecord, number>;
  hydrationLogs!: Table<DailyHydrationLog, number>;

  constructor() {
    super('SmritiNER_DB');
    this.version(1).stores({
      patients: 'id, name, state',
      gameSessions: '++id, patientId, gameType, completedAt, synced',
      reminders: '++id, patientId, category, synced',
      reminiscenceItems: '++id, patientId, synced',
      ashaScreenings: '++id, elderName, district, dementiaRiskCategory, synced',
      hydrationLogs: '++id, patientId, date, synced',
    });
  }
}

export const db = new SmritiDatabase();

// Default seed data for initial profile setup
let seedPromise: Promise<void> | null = null;

export function initializeDatabaseSeed(): Promise<void> {
  if (!seedPromise) seedPromise = seedDatabase();
  return seedPromise;
}

async function seedDatabase() {
  const patientCount = await db.patients.count();
  if (patientCount > 0) return;

  const defaultPatient: PatientProfile = {
    id: 'pat-ner-001',
    name: 'Bhaben Barua (ভবেন বৰুৱা)',
    age: 74,
    gender: 'Male',
    nativeLanguage: 'Assamese',
    villageOrDistrict: 'Teok, Jorhat District',
    state: 'Assam',
    diagnosisStage: 'Early Stage Dementia',
    emergencyContactName: 'Anuradha Barua (Daughter)',
    emergencyContactPhone: '+91 94350 12890',
    ashaWorkerAssigned: 'Jonali Das (ASHA Jorhat North)',
    notes: 'Enjoys morning walks and Bihu folklore. Mild memory recall slips in afternoon.',
  };

  await db.patients.add(defaultPatient);

  // Seed Reminders
  const today = new Date().toISOString().split('T')[0];
  const initialReminders: Omit<ReminderItem, 'id'>[] = [
    {
      patientId: 'pat-ner-001',
      title: 'Donepezil (Memory Medicine)',
      category: 'medicine',
      time: '08:00 AM',
      dosage: '1 Tablet after morning tea',
      notes: 'Doctor prescribed for cognitive support',
      completedDates: [today],
      iconName: 'Pill',
      synced: true,
    },
    {
      patientId: 'pat-ner-001',
      title: 'Morning Brahmaputra Walk & Tea',
      category: 'routine',
      time: '07:00 AM',
      notes: '15 minutes fresh air stroll',
      completedDates: [today],
      iconName: 'Footprints',
      synced: true,
    },
    {
      patientId: 'pat-ner-001',
      title: 'Drink Fresh Water (Glass 3 of 6)',
      category: 'hydration',
      time: '11:30 AM',
      notes: 'Stay hydrated in afternoon heat',
      completedDates: [],
      iconName: 'Droplets',
      synced: true,
    },
    {
      patientId: 'pat-ner-001',
      title: 'Evening Namghar Prayer Chime',
      category: 'prayer',
      time: '06:00 PM',
      notes: 'Listen to devotional Dihanaam',
      completedDates: [],
      iconName: 'Bell',
      synced: true,
    },
    {
      patientId: 'pat-ner-001',
      title: 'BP & Multi-Vitamin',
      category: 'medicine',
      time: '08:30 PM',
      dosage: 'Amlodipine 5mg',
      notes: 'With dinner',
      completedDates: [],
      iconName: 'HeartPulse',
      synced: true,
    }
  ];

  await db.reminders.bulkAdd(initialReminders as ReminderItem[]);

  // Seed Hydration for today
  await db.hydrationLogs.add({
    patientId: 'pat-ner-001',
    date: today,
    glassesDrunk: 3,
    targetGlasses: 6,
    synced: true,
  });

  // Seed Historical Game Sessions for Analytics Baseline
  const pastDays = [6, 5, 4, 3, 2, 1, 0];
  const initialSessions: Omit<GameSession, 'id'>[] = [];

  pastDays.forEach((daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString();

    // Memory Game Session
    initialSessions.push({
      patientId: 'pat-ner-001',
      gameType: 'majuli_memory',
      gameTitle: 'Majuli Memory Cards',
      score: 80 + ((6 - daysAgo) * 2 % 18),
      maxPossibleScore: 100,
      accuracy: 82 + (daysAgo * 3 % 15),
      durationSeconds: 95 - daysAgo * 2,
      difficultyLevel: 2,
      hesitationsCount: 3 + (daysAgo % 3),
      hintsUsedCount: 1,
      avgReactionTimeMs: 1400 + daysAgo * 37,
      completedAt: dateStr,
      synced: true,
    });

    // Chai Garden Focus Session
    initialSessions.push({
      patientId: 'pat-ner-001',
      gameType: 'chai_harvest',
      gameTitle: 'Chai Garden Harvest',
      score: 75 + ((6 - daysAgo) * 3 % 20),
      maxPossibleScore: 100,
      accuracy: 88 + (daysAgo * 2 % 10),
      durationSeconds: 60,
      difficultyLevel: 2,
      hesitationsCount: 2,
      hintsUsedCount: 0,
      avgReactionTimeMs: 1100 + daysAgo * 23,
      completedAt: dateStr,
      synced: true,
    });

    // Routine Sequence Session
    initialSessions.push({
      patientId: 'pat-ner-001',
      gameType: 'daily_sequence',
      gameTitle: 'Daily Life Sequence',
      score: 90,
      maxPossibleScore: 100,
      accuracy: 92,
      durationSeconds: 45,
      difficultyLevel: 1,
      hesitationsCount: 1,
      hintsUsedCount: 0,
      avgReactionTimeMs: 1800,
      completedAt: dateStr,
      synced: true,
    });
  });

  await db.gameSessions.bulkAdd(initialSessions as GameSession[]);

  // Seed Reminiscence Photos
  const initialPhotos: Omit<ReminiscencePhoto, 'id'>[] = [
    {
      patientId: 'pat-ner-001',
      imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
      title: 'Family Bihu Celebration in Jorhat',
      relationshipOrPlace: 'Daughter Anuradha and Grandson Nilav',
      year: 'April 2021 (Rongali Bihu)',
      memoryPromptQuestion: 'Who is holding the traditional Bihu Dhol drum in this photo?',
      correctAnswer: 'Grandson Nilav',
      audioPromptHint: 'Your younger grandson with the yellow silk shirt!',
      synced: true,
    },
    {
      patientId: 'pat-ner-001',
      imageUrl: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=600&auto=format&fit=crop&q=80',
      title: 'Morning Walk at Teok Tea Estate',
      relationshipOrPlace: 'Jorhat, Assam',
      year: 'Summer 2018',
      memoryPromptQuestion: 'Which tea estate did you supervise for 30 proud years?',
      correctAnswer: 'Teok Tea Estate',
      audioPromptHint: 'The lush green garden near the old wooden bridge!',
      synced: true,
    },
    {
      patientId: 'pat-ner-001',
      imageUrl: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=600&auto=format&fit=crop&q=80',
      title: 'Majuli Island Satra Visit',
      relationshipOrPlace: 'Kamalabari Satra, Majuli',
      year: 'Winter 2019',
      memoryPromptQuestion: 'Which sacred island on the Brahmaputra is this Satra located on?',
      correctAnswer: 'Majuli Island',
      audioPromptHint: 'The world famous river island known for mask making!',
      synced: true,
    },
  ];

  await db.reminiscenceItems.bulkAdd(initialPhotos as ReminiscencePhoto[]);

  // Seed ASHA Field Screenings
  const initialAshaRecords: Omit<AshaScreeningRecord, 'id'>[] = [
    {
      elderName: 'Bhaben Barua',
      elderAge: 74,
      villageName: 'Teok Gaon',
      district: 'Jorhat',
      ashaWorkerName: 'Jonali Das',
      screeningDate: today,
      orientationScore: 4,
      memoryRecallScore: 4,
      attentionMathScore: 3,
      handloomPatternScore: 4,
      routineRecallScore: 5,
      totalScore: 20,
      dementiaRiskCategory: 'Mild Impairment / Watchlist',
      ashaNotes: 'Elder is alert and cheerful. Needs gentle reminder for afternoon hydration and names of distant relatives.',
      synced: true,
    },
    {
      elderName: 'Himani Gogoi',
      elderAge: 81,
      villageName: 'Dergaon Chariali',
      district: 'Golaghat',
      ashaWorkerName: 'Jonali Das',
      screeningDate: '2026-08-20',
      orientationScore: 3,
      memoryRecallScore: 2,
      attentionMathScore: 2,
      handloomPatternScore: 3,
      routineRecallScore: 3,
      totalScore: 13,
      dementiaRiskCategory: 'Urgent Neurological Referral',
      ashaNotes: 'Frequent disorientation regarding day of week. Caregiver advised for Jorhat Medical College visit.',
      synced: true,
    }
  ];

  await db.ashaScreenings.bulkAdd(initialAshaRecords as AshaScreeningRecord[]);
}
