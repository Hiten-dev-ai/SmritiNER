import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databasePath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'smritiner.sqlite');
mkdirSync(path.dirname(databasePath), { recursive: true });

export const database = new DatabaseSync(databasePath);
database.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('caregiver', 'patient')),
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT UNIQUE COLLATE NOCASE,
    display_name TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    date_of_birth TEXT,
    gender TEXT NOT NULL,
    preferred_language TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    emergency_contact_name TEXT NOT NULL,
    emergency_contact_phone TEXT NOT NULL,
    clinician_condition TEXT,
    care_notes TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS patient_caregivers (
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    caregiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_role TEXT NOT NULL CHECK (access_role IN ('owner', 'editor')),
    created_at TEXT NOT NULL,
    PRIMARY KEY (patient_id, caregiver_id)
  );
  CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL,
    domain TEXT NOT NULL,
    stage INTEGER NOT NULL,
    accuracy REAL NOT NULL,
    duration_seconds INTEGER NOT NULL,
    memory_load INTEGER NOT NULL,
    mistakes INTEGER NOT NULL,
    hints_used INTEGER NOT NULL,
    median_response_ms INTEGER NOT NULL,
    response_variability_ms INTEGER NOT NULL,
    completion_status TEXT NOT NULL,
    content_variant_ids TEXT NOT NULL,
    round_results TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    client_event_id TEXT UNIQUE,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_game_patient_completed ON game_sessions(patient_id, completed_at);
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS hydration_logs (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reminiscence_items (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS caregiver_observations (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    caregiver_id TEXT NOT NULL REFERENCES users(id),
    note TEXT NOT NULL,
    tags_json TEXT NOT NULL,
    observed_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS patient_creation_requests (
    client_request_id TEXT NOT NULL,
    caretaker_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (client_request_id, caretaker_id)
  );
  CREATE TABLE IF NOT EXISTS patient_game_progress (
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL,
    unlocked_stage INTEGER NOT NULL DEFAULT 1,
    recommended_stage INTEGER NOT NULL DEFAULT 1,
    last_played_stage INTEGER,
    last_stage_source TEXT,
    last_decision TEXT NOT NULL DEFAULT 'start',
    reason_text TEXT NOT NULL DEFAULT '',
    consecutive_strong INTEGER NOT NULL DEFAULT 0,
    consecutive_support INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (patient_id, game_type)
  );
  CREATE TABLE IF NOT EXISTS patient_mahjong_saves (
    patient_id TEXT PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
    stage INTEGER NOT NULL,
    layout_id TEXT NOT NULL,
    deal_seed TEXT NOT NULL,
    theme_id TEXT NOT NULL,
    table_felt TEXT NOT NULL DEFAULT 'sand',
    tiles_json TEXT NOT NULL,
    move_history_json TEXT NOT NULL,
    metrics_json TEXT NOT NULL,
    pairs_cleared INTEGER NOT NULL DEFAULT 0,
    active_duration_ms INTEGER NOT NULL DEFAULT 0,
    started_at TEXT NOT NULL,
    last_saved_at TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1
  );
`);

const nowIso = () => new Date().toISOString();
const normalizeIdentifier = (value) => String(value || '').trim().toLowerCase();
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export function createPasswordRecord(password) {
  const salt = randomBytes(16).toString('hex');
  return { salt, hash: scryptSync(String(password), salt, 64).toString('hex') };
}

export function verifyPassword(password, salt, storedHash) {
  const actual = scryptSync(String(password), salt, 64);
  const expected = Buffer.from(storedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const publicUser = (row) => row ? {
  id: row.id,
  role: row.role,
  username: row.username,
  email: row.email || undefined,
  displayName: row.display_name,
} : null;

const publicPatient = (row) => row ? {
  id: row.id,
  userId: row.user_id,
  username: row.username,
  name: row.name,
  age: row.age,
  dateOfBirth: row.date_of_birth || undefined,
  gender: row.gender,
  preferredLanguage: row.preferred_language,
  state: row.state,
  district: row.district,
  emergencyContactName: row.emergency_contact_name,
  emergencyContactPhone: row.emergency_contact_phone,
  clinicianCondition: row.clinician_condition || undefined,
  careNotes: row.care_notes || undefined,
  active: Boolean(row.active),
  accessRole: row.access_role,
} : null;

function insertUser({ id = randomUUID(), role, username, email, displayName, password }) {
  const passwordRecord = createPasswordRecord(password);
  database.prepare(`INSERT INTO users (id, role, username, email, display_name, password_salt, password_hash, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`).run(
      id, role, normalizeIdentifier(username), email ? normalizeIdentifier(email) : null,
      displayName.trim(), passwordRecord.salt, passwordRecord.hash, nowIso()
    );
  return id;
}

export function seedDemoData() {
  const existing = database.prepare('SELECT COUNT(*) AS count FROM users').get();
  if (existing.count > 0) return;
  database.exec('BEGIN IMMEDIATE');
  try {
    const caregivers = [
      ['usr-cg-hiten', 'hiten', 'Hiten'],
      ['usr-cg-maha', 'mahalakshmi', 'Maha Lakshmi'],
      ['usr-cg-bala', 'bala', 'Bala'],
      ['usr-cg-jasmine', 'jasmine', 'Jasmine'],
      ['usr-cg-vaishali', 'vaishali', 'Vaishali'],
      ['usr-cg-aishwarya', 'aishwarya', 'Aishwarya'],
    ];
    for (const [id, username, displayName] of caregivers) {
      insertUser({ id, role: 'caregiver', username, email: `${username}@smritiner.demo`, displayName, password: '1234' });
    }
    insertUser({ id: 'usr-pat-bhaben', role: 'patient', username: 'bhaben', displayName: 'Bhaben Barua', password: '1234' });
    database.prepare(`INSERT INTO patients (id, user_id, name, age, gender, preferred_language, state, district,
      emergency_contact_name, emergency_contact_phone, clinician_condition, care_notes, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`).run(
        'pat-ner-001', 'usr-pat-bhaben', 'Bhaben Barua (ভবেন বৰুৱা)', 74, 'Male', 'Assamese', 'Assam',
        'Teok, Jorhat District', 'Anuradha Barua (Daughter)', '+91 94350 12890', 'Clinician-recorded: early-stage dementia',
        'Enjoys morning walks, Bihu folklore, tea gardens, and family photographs.', nowIso()
      );
    for (const [id] of caregivers) {
      database.prepare('INSERT INTO patient_caregivers (patient_id, caregiver_id, access_role, created_at) VALUES (?, ?, ?, ?)')
        .run('pat-ner-001', id, id === 'usr-cg-hiten' ? 'owner' : 'editor', nowIso());
    }

    const reminderSeed = [
      { title: 'Morning medicine', category: 'medicine', time: '08:00', dosage: 'As prescribed', repeat: 'daily', alertsEnabled: true },
      { title: 'Morning walk', category: 'routine', time: '07:00', repeat: 'daily', alertsEnabled: true },
      { title: 'Drink water', category: 'hydration', time: '11:30', repeat: 'daily', alertsEnabled: true },
      { title: 'Evening medicine', category: 'medicine', time: '20:30', dosage: 'As prescribed', repeat: 'daily', alertsEnabled: true },
    ];
    for (const reminder of reminderSeed) {
      const id = randomUUID();
      database.prepare('INSERT INTO reminders (id, patient_id, data_json, updated_at) VALUES (?, ?, ?, ?)')
        .run(id, 'pat-ner-001', JSON.stringify({ id, patientId: 'pat-ner-001', ...reminder, completedDates: [] }), nowIso());
    }

    const demoGames = ['majuli_memory', 'tea_tray_recall', 'market_list_recall', 'missing_object', 'daily_steps', 'weave_pattern'];
    for (let day = 10; day >= 1; day -= 1) {
      const completed = new Date(Date.now() - day * 86400000);
      const gameType = demoGames[day % demoGames.length];
      const accuracy = 72 + ((day * 7) % 22);
      database.prepare(`INSERT INTO game_sessions (id, patient_id, game_type, domain, stage, accuracy, duration_seconds,
        memory_load, mistakes, hints_used, median_response_ms, response_variability_ms, completion_status,
        content_variant_ids, round_results, started_at, completed_at, client_event_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, '[]', ?, ?, ?, ?)`).run(
          randomUUID(), 'pat-ner-001', gameType,
          gameType === 'daily_steps' ? 'sequencing' : gameType === 'weave_pattern' ? 'pattern-recognition' : 'memory',
          Math.min(6, Math.max(1, 7 - Math.ceil(day / 2))), accuracy, 70 + day * 3, 3 + (day % 4),
          Math.max(0, Math.round((100 - accuracy) / 12)), day % 3, 1350 + day * 45, 240 + day * 12,
          JSON.stringify([`${gameType}-demo-${day}`]), completed.toISOString(), completed.toISOString(), `seed-${day}`, nowIso()
        );
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export function authenticate(identifier, password) {
  const normalized = normalizeIdentifier(identifier);
  const row = database.prepare('SELECT * FROM users WHERE active = 1 AND (username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE)').get(normalized, normalized);
  if (!row || !verifyPassword(password, row.password_salt, row.password_hash)) return null;
  return publicUser(row);
}

export function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
  database.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').run(nowIso());
  database.prepare('INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .run(hashToken(token), userId, expiresAt, nowIso());
  return { token, expiresAt };
}

export function deleteSession(token) {
  if (token) database.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(hashToken(token));
}

export function getUserBySession(token) {
  if (!token) return null;
  const row = database.prepare(`SELECT u.* FROM auth_sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`).get(hashToken(token), nowIso());
  return publicUser(row);
}

export function registerCaregiver({ displayName, username, email, password }) {
  const id = insertUser({ role: 'caregiver', displayName, username, email, password });
  return publicUser(database.prepare('SELECT * FROM users WHERE id = ?').get(id));
}

export function listAccessiblePatients(user) {
  if (user.role === 'patient') {
    const row = database.prepare(`SELECT p.*, u.username, 'self' AS access_role FROM patients p JOIN users u ON u.id = p.user_id WHERE p.user_id = ? AND p.active = 1`).get(user.id);
    return row ? [publicPatient(row)] : [];
  }
  return database.prepare(`SELECT p.*, u.username, pc.access_role FROM patient_caregivers pc
    JOIN patients p ON p.id = pc.patient_id JOIN users u ON u.id = p.user_id
    WHERE pc.caregiver_id = ? AND p.active = 1 ORDER BY p.name`).all(user.id).map(publicPatient);
}

export function getPatientAccess(user, patientId) {
  if (user.role === 'patient') {
    const patient = database.prepare('SELECT id FROM patients WHERE id = ? AND user_id = ? AND active = 1').get(patientId, user.id);
    return patient ? 'self' : null;
  }
  return database.prepare('SELECT access_role FROM patient_caregivers WHERE patient_id = ? AND caregiver_id = ?').get(patientId, user.id)?.access_role || null;
}

const ALL_JOURNEY_GAMES = [
  'majuli_memory', 'tea_tray_recall', 'market_list_recall', 'missing_object',
  'daily_steps', 'weave_pattern', 'memory_lane', 'mahjong_memory'
];

export function listGameProgress(patientId) {
  const rows = database.prepare('SELECT * FROM patient_game_progress WHERE patient_id = ?').all(patientId);
  const foundMap = new Map(rows.map((r) => [r.game_type, r]));
  const result = [];
  for (const gameType of ALL_JOURNEY_GAMES) {
    let row = foundMap.get(gameType);
    if (!row) {
      database.prepare(`INSERT INTO patient_game_progress (patient_id, game_type, unlocked_stage, recommended_stage, last_decision, reason_text, consecutive_strong, consecutive_support, updated_at)
        VALUES (?, ?, 1, 1, 'start', 'Starting at stage 1 baseline.', 0, 0, ?)`).run(patientId, gameType, nowIso());
      row = database.prepare('SELECT * FROM patient_game_progress WHERE patient_id = ? AND game_type = ?').get(patientId, gameType);
    }
    result.push({
      patientId: row.patient_id,
      gameType: row.game_type,
      unlockedStage: row.unlocked_stage,
      recommendedStage: row.recommended_stage,
      lastPlayedStage: row.last_played_stage || undefined,
      lastStageSource: row.last_stage_source || undefined,
      lastDecision: row.last_decision,
      reasonText: row.reason_text,
      consecutiveStrong: row.consecutive_strong,
      consecutiveSupport: row.consecutive_support,
      updatedAt: row.updated_at,
    });
  }
  return result;
}

export function createPatient(ownerId, input) {
  if (input.clientRequestId) {
    const existing = database.prepare('SELECT patient_id FROM patient_creation_requests WHERE client_request_id = ? AND caretaker_id = ?').get(input.clientRequestId, ownerId);
    if (existing) {
      return listAccessiblePatients({ id: ownerId, role: 'caregiver' }).find((patient) => patient.id === existing.patient_id);
    }
  }

  database.exec('BEGIN IMMEDIATE');
  try {
    const userId = insertUser({ role: 'patient', username: input.username, displayName: input.name, password: input.password });
    const patientId = `pat-${randomUUID()}`;
    database.prepare(`INSERT INTO patients (id, user_id, name, age, date_of_birth, gender, preferred_language, state, district,
      emergency_contact_name, emergency_contact_phone, clinician_condition, care_notes, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`).run(
        patientId, userId, input.name.trim(), Number(input.age), input.dateOfBirth || null, input.gender || 'Prefer not to say',
        input.preferredLanguage || 'English', input.state, input.district, input.emergencyContactName,
        input.emergencyContactPhone, input.clinicianCondition || null, input.careNotes || null, nowIso()
      );
    database.prepare('INSERT INTO patient_caregivers (patient_id, caregiver_id, access_role, created_at) VALUES (?, ?, ?, ?)')
      .run(patientId, ownerId, 'owner', nowIso());

    // Seed progress records for all 8 games
    for (const gameType of ALL_JOURNEY_GAMES) {
      database.prepare(`INSERT INTO patient_game_progress (patient_id, game_type, unlocked_stage, recommended_stage, last_decision, reason_text, consecutive_strong, consecutive_support, updated_at)
        VALUES (?, ?, 1, 1, 'start', 'Starting at stage 1 baseline.', 0, 0, ?)`).run(patientId, gameType, nowIso());
    }

    if (input.clientRequestId) {
      database.prepare('INSERT INTO patient_creation_requests (client_request_id, caretaker_id, patient_id, created_at) VALUES (?, ?, ?, ?)')
        .run(input.clientRequestId, ownerId, patientId, nowIso());
    }

    database.exec('COMMIT');
    return listAccessiblePatients({ id: ownerId, role: 'caregiver' }).find((patient) => patient.id === patientId);
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export function updatePatient(patientId, input) {
  const allowed = ['name', 'age', 'dateOfBirth', 'gender', 'preferredLanguage', 'state', 'district', 'emergencyContactName', 'emergencyContactPhone', 'clinicianCondition', 'careNotes'];
  const mapping = { dateOfBirth: 'date_of_birth', preferredLanguage: 'preferred_language', emergencyContactName: 'emergency_contact_name', emergencyContactPhone: 'emergency_contact_phone', clinicianCondition: 'clinician_condition', careNotes: 'care_notes' };
  const entries = allowed.filter((key) => input[key] !== undefined);
  if (!entries.length) return;
  const values = entries.map((key) => input[key] || null);
  database.prepare(`UPDATE patients SET ${entries.map((key) => `${mapping[key] || key} = ?`).join(', ')} WHERE id = ?`).run(...values, patientId);
}

export function sharePatient(patientId, identifier) {
  const normalized = normalizeIdentifier(identifier);
  const caregiver = database.prepare("SELECT id, username, display_name, email FROM users WHERE role = 'caregiver' AND active = 1 AND (username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE)").get(normalized, normalized);
  if (!caregiver) return null;
  database.prepare(`INSERT INTO patient_caregivers (patient_id, caregiver_id, access_role, created_at) VALUES (?, ?, 'editor', ?)
    ON CONFLICT(patient_id, caregiver_id) DO UPDATE SET access_role = CASE WHEN access_role = 'owner' THEN 'owner' ELSE 'editor' END`).run(patientId, caregiver.id, nowIso());
  return { id: caregiver.id, username: caregiver.username, displayName: caregiver.display_name, email: caregiver.email, accessRole: 'editor' };
}

export function unsharePatient(patientId, caregiverId) {
  return database.prepare("DELETE FROM patient_caregivers WHERE patient_id = ? AND caregiver_id = ? AND access_role != 'owner'").run(patientId, caregiverId).changes > 0;
}

export function listShares(patientId) {
  return database.prepare(`SELECT u.id, u.username, u.display_name, u.email, pc.access_role FROM patient_caregivers pc
    JOIN users u ON u.id = pc.caregiver_id WHERE pc.patient_id = ? ORDER BY pc.access_role DESC, u.display_name`).all(patientId)
    .map((row) => ({ id: row.id, username: row.username, displayName: row.display_name, email: row.email, accessRole: row.access_role }));
}

export function resetPatientPassword(patientId, password) {
  const patient = database.prepare('SELECT user_id FROM patients WHERE id = ?').get(patientId);
  if (!patient) return false;
  const record = createPasswordRecord(password);
  database.prepare('UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?').run(record.salt, record.hash, patient.user_id);
  database.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(patient.user_id);
  return true;
}

export function deactivatePatient(patientId) {
  const patient = database.prepare('SELECT user_id FROM patients WHERE id = ?').get(patientId);
  if (!patient) return false;
  database.prepare('UPDATE patients SET active = 0 WHERE id = ?').run(patientId);
  database.prepare('UPDATE users SET active = 0 WHERE id = ?').run(patient.user_id);
  database.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(patient.user_id);
  return true;
}

const json = (value, fallback) => { try { return JSON.parse(value); } catch { return fallback; } };

export function listGameSessions(patientId) {
  return database.prepare('SELECT * FROM game_sessions WHERE patient_id = ? ORDER BY completed_at').all(patientId).map((row) => ({
    id: row.id, patientId: row.patient_id, gameType: row.game_type, domain: row.domain, stage: row.stage,
    accuracy: row.accuracy, durationSeconds: row.duration_seconds, memoryLoad: row.memory_load, mistakes: row.mistakes,
    hintsUsed: row.hints_used, medianResponseMs: row.median_response_ms, responseVariabilityMs: row.response_variability_ms,
    completionStatus: row.completion_status, contentVariantIds: json(row.content_variant_ids, []), roundResults: json(row.round_results, []),
    startedAt: row.started_at, completedAt: row.completed_at, clientEventId: row.client_event_id,
  }));
}

export function evaluateSessionOutcome(session, currentProgress) {
  const totalRounds = session.roundResults?.length || 3;
  const scoredRounds = session.roundResults?.filter((r) => r.responseMs > 0).length || 0;
  if (session.completionStatus === 'abandoned' && scoredRounds === 0) {
    return { outcome: 'ignored', isFrontier: false };
  }
  const isFrontier = session.stage >= currentProgress.unlockedStage || session.stage >= currentProgress.recommendedStage;
  const supportNeeded =
    session.accuracy < 60 ||
    session.hintsUsed >= Math.ceil(totalRounds / 2) ||
    session.mistakes >= totalRounds ||
    (session.completionStatus === 'abandoned' && scoredRounds >= 1);
  if (supportNeeded) return { outcome: 'support-needed', isFrontier };
  const isStrong =
    session.completionStatus === 'completed' &&
    session.accuracy >= 80 &&
    session.hintsUsed <= 1 &&
    session.mistakes <= Math.floor(totalRounds / 3) &&
    isFrontier;
  if (isStrong) return { outcome: 'strong', isFrontier: true };
  return { outcome: 'steady', isFrontier };
}

export function computeNextProgress(currentProgress, session, stageSource = 'recommended') {
  const playedStage = session.stage;
  const prevUnlocked = currentProgress.unlockedStage;
  const prevRecommended = currentProgress.recommendedStage;
  const evaluation = evaluateSessionOutcome(session, currentProgress);

  let nextUnlocked = prevUnlocked;
  let nextRecommended = prevRecommended;
  let consecStrong = currentProgress.consecutiveStrong || 0;
  let consecSupport = currentProgress.consecutiveSupport || 0;
  let reasonCode = 'remain-steady';
  let reasonText = 'Steady performance recorded. Continuing at current stage.';
  let lastDecision = 'steady';

  if (evaluation.outcome === 'ignored') {
    return {
      updatedProgress: {
        ...currentProgress,
        lastPlayedStage: playedStage,
        lastStageSource: stageSource,
        updatedAt: nowIso(),
      },
      decision: { playedStage, previousRecommendedStage: prevRecommended, nextRecommendedStage: prevRecommended, previousUnlockedStage: prevUnlocked, unlockedStage: prevUnlocked, outcome: 'ignored', reasonCode: 'remain-steady' },
    };
  }

  if (stageSource === 'manual' && playedStage < prevUnlocked) {
    if (evaluation.outcome === 'support-needed') {
      consecSupport += 1;
      consecStrong = 0;
      if (consecSupport >= 2) {
        nextRecommended = Math.max(1, prevRecommended - 1);
        consecSupport = 0;
        reasonCode = 'gentler-next-time';
        reasonText = 'Recommending a gentler stage after recent practice sessions.';
        lastDecision = 'gentler';
      } else {
        reasonCode = 'building-evidence';
        reasonText = 'Comfort replay recorded.';
        lastDecision = 'manual-replay';
      }
    } else {
      consecStrong = 0;
      consecSupport = 0;
      reasonCode = 'manual-comfort-replay';
      reasonText = 'Comfort replay completed. All unlocked stages remain available.';
      lastDecision = 'manual-replay';
    }
  } else if (evaluation.outcome === 'strong') {
    consecStrong += 1;
    consecSupport = 0;
    if (consecStrong >= 2) {
      consecStrong = 0;
      if (playedStage === prevUnlocked) {
        if (prevUnlocked >= 12) {
          nextUnlocked = 12;
          nextRecommended = 12;
          reasonCode = 'highest-stage';
          reasonText = 'Outstanding mastery! You are at the highest stage.';
          lastDecision = 'highest-stage';
        } else {
          nextUnlocked = Math.min(12, prevUnlocked + 1);
          nextRecommended = nextUnlocked;
          reasonCode = 'stage-unlocked';
          reasonText = `Wonderful consistency! Stage ${nextUnlocked} is now unlocked and ready.`;
          lastDecision = 'stage-unlocked';
        }
      } else if (playedStage < prevUnlocked) {
        nextRecommended = Math.min(prevUnlocked, prevRecommended + 1);
        reasonCode = 'stage-unlocked';
        reasonText = `Great focus! Recommending Stage ${nextRecommended}.`;
        lastDecision = 'steady';
      }
    } else {
      reasonCode = 'building-evidence';
      reasonText = 'Strong session! One more consistent session at this stage will unlock the next.';
      lastDecision = 'steady';
    }
  } else if (evaluation.outcome === 'support-needed') {
    consecSupport += 1;
    consecStrong = 0;
    if (consecSupport >= 2) {
      consecSupport = 0;
      nextRecommended = Math.max(1, prevRecommended - 1);
      reasonCode = 'gentler-next-time';
      reasonText = 'A gentler stage is recommended next time for your comfort.';
      lastDecision = 'gentler';
    } else {
      reasonCode = 'building-evidence';
      reasonText = 'Support noted. Practice comfortably at your own pace.';
      lastDecision = 'steady';
    }
  } else {
    consecStrong = 0;
    consecSupport = 0;
    reasonCode = 'remain-steady';
    reasonText = 'Steady progress. Continuing at the current stage.';
    lastDecision = 'steady';
  }

  nextUnlocked = Math.max(1, Math.min(12, nextUnlocked));
  nextRecommended = Math.max(1, Math.min(nextUnlocked, nextRecommended));

  const updatedProgress = {
    patientId: currentProgress.patientId,
    gameType: currentProgress.gameType,
    unlockedStage: nextUnlocked,
    recommendedStage: nextRecommended,
    lastPlayedStage: playedStage,
    lastStageSource: stageSource,
    lastDecision,
    reasonText,
    consecutiveStrong: consecStrong,
    consecutiveSupport: consecSupport,
    updatedAt: nowIso(),
  };

  const decision = {
    playedStage,
    previousRecommendedStage: prevRecommended,
    nextRecommendedStage: nextRecommended,
    previousUnlockedStage: prevUnlocked,
    unlockedStage: nextUnlocked,
    outcome: evaluation.outcome,
    reasonCode,
  };

  return { updatedProgress, decision };
}

export function addGameSession(patientId, input) {
  const clientEventId = input.clientEventId || input.id;
  if (clientEventId) {
    const existing = database.prepare('SELECT id FROM game_sessions WHERE client_event_id = ?').get(clientEventId);
    if (existing) {
      return { id: existing.id, progress: listGameProgress(patientId), duplicate: true };
    }
  }

  const id = input.id || randomUUID();
  database.exec('BEGIN IMMEDIATE');
  try {
    database.prepare(`INSERT INTO game_sessions (id, patient_id, game_type, domain, stage, accuracy, duration_seconds, memory_load,
      mistakes, hints_used, median_response_ms, response_variability_ms, completion_status, content_variant_ids, round_results,
      started_at, completed_at, client_event_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(client_event_id) DO NOTHING`).run(
        id, patientId, input.gameType, input.domain, input.stage, input.accuracy, input.durationSeconds, input.memoryLoad,
        input.mistakes, input.hintsUsed, input.medianResponseMs, input.responseVariabilityMs, input.completionStatus || 'completed',
        JSON.stringify(input.contentVariantIds || []), JSON.stringify(input.roundResults || []), input.startedAt, input.completedAt,
        clientEventId || id, nowIso()
      );

    // Get current progress for game
    const progressRows = listGameProgress(patientId);
    const currentProgress = progressRows.find((p) => p.gameType === input.gameType) || {
      patientId,
      gameType: input.gameType,
      unlockedStage: 1,
      recommendedStage: 1,
      lastDecision: 'start',
      reasonText: '',
      consecutiveStrong: 0,
      consecutiveSupport: 0,
      updatedAt: nowIso(),
    };

    const { updatedProgress, decision } = computeNextProgress(currentProgress, input, input.stageSource || 'recommended');

    database.prepare(`INSERT INTO patient_game_progress (patient_id, game_type, unlocked_stage, recommended_stage, last_played_stage, last_stage_source, last_decision, reason_text, consecutive_strong, consecutive_support, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(patient_id, game_type) DO UPDATE SET
        unlocked_stage = excluded.unlocked_stage,
        recommended_stage = excluded.recommended_stage,
        last_played_stage = excluded.last_played_stage,
        last_stage_source = excluded.last_stage_source,
        last_decision = excluded.last_decision,
        reason_text = excluded.reason_text,
        consecutive_strong = excluded.consecutive_strong,
        consecutive_support = excluded.consecutive_support,
        updated_at = excluded.updated_at`).run(
          patientId, input.gameType, updatedProgress.unlockedStage, updatedProgress.recommendedStage,
          updatedProgress.lastPlayedStage || null, updatedProgress.lastStageSource || null, updatedProgress.lastDecision,
          updatedProgress.reasonText, updatedProgress.consecutiveStrong || 0, updatedProgress.consecutiveSupport || 0, nowIso()
        );

    database.exec('COMMIT');
    return { id, progress: listGameProgress(patientId), decision, duplicate: false };
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

const collectionTables = { reminders: 'reminders', hydration: 'hydration_logs', photos: 'reminiscence_items' };
export function listCollection(patientId, collection) {
  const table = collectionTables[collection];
  if (!table) return [];
  return database.prepare(`SELECT data_json FROM ${table} WHERE patient_id = ? ORDER BY updated_at`).all(patientId).map((row) => json(row.data_json, {}));
}

export function upsertCollectionItem(patientId, collection, input) {
  const table = collectionTables[collection];
  if (!table) throw new Error('Unknown collection');
  const id = String(input.id || randomUUID());
  const data = { ...input, id, patientId };
  database.prepare(`INSERT INTO ${table} (id, patient_id, data_json, updated_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at
    WHERE ${table}.patient_id = excluded.patient_id`).run(id, patientId, JSON.stringify(data), nowIso());
  return data;
}

export function listObservations(patientId) {
  return database.prepare(`SELECT o.*, u.display_name FROM caregiver_observations o JOIN users u ON u.id = o.caregiver_id
    WHERE o.patient_id = ? ORDER BY o.observed_at DESC`).all(patientId).map((row) => ({
      id: row.id, patientId: row.patient_id, caregiverId: row.caregiver_id, caregiverName: row.display_name,
      note: row.note, tags: json(row.tags_json, []), observedAt: row.observed_at, createdAt: row.created_at,
    }));
}

export function addObservation(patientId, caregiverId, input) {
  const id = randomUUID();
  database.prepare(`INSERT INTO caregiver_observations (id, patient_id, caregiver_id, note, tags_json, observed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, patientId, caregiverId, input.note.trim(), JSON.stringify(input.tags || []), input.observedAt || nowIso(), nowIso());
  return listObservations(patientId).find((item) => item.id === id);
}

export function getMahjongSave(patientId) {
  const row = database.prepare('SELECT * FROM patient_mahjong_saves WHERE patient_id = ?').get(patientId);
  if (!row) return null;
  const metrics = json(row.metrics_json, {});
  return {
    patientId: row.patient_id,
    stage: row.stage,
    layoutId: row.layout_id,
    dealSeed: row.deal_seed,
    themeId: row.theme_id,
    tableFelt: row.table_felt,
    tiles: json(row.tiles_json, []),
    moveHistory: json(row.move_history_json, []),
    pairsCleared: row.pairs_cleared,
    activeDurationMs: row.active_duration_ms,
    hintCount: metrics.hintCount || 0,
    mismatchCount: metrics.mismatchCount || 0,
    blockedTapCount: metrics.blockedTapCount || 0,
    shuffleCount: metrics.shuffleCount || 0,
    startedAt: row.started_at,
    lastSavedAt: row.last_saved_at,
    revision: row.revision,
  };
}

export function saveMahjongSave(patientId, saveObj) {
  const metrics = {
    hintCount: saveObj.hintCount || 0,
    mismatchCount: saveObj.mismatchCount || 0,
    blockedTapCount: saveObj.blockedTapCount || 0,
    shuffleCount: saveObj.shuffleCount || 0,
  };
  const nextRev = (saveObj.revision || 0) + 1;
  const now = nowIso();

  database.prepare(`
    INSERT INTO patient_mahjong_saves (
      patient_id, stage, layout_id, deal_seed, theme_id, table_felt,
      tiles_json, move_history_json, metrics_json, pairs_cleared,
      active_duration_ms, started_at, last_saved_at, revision
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(patient_id) DO UPDATE SET
      stage = excluded.stage,
      layout_id = excluded.layout_id,
      deal_seed = excluded.deal_seed,
      theme_id = excluded.theme_id,
      table_felt = excluded.table_felt,
      tiles_json = excluded.tiles_json,
      move_history_json = excluded.move_history_json,
      metrics_json = excluded.metrics_json,
      pairs_cleared = excluded.pairs_cleared,
      active_duration_ms = excluded.active_duration_ms,
      last_saved_at = excluded.last_saved_at,
      revision = excluded.revision
  `).run(
    patientId,
    saveObj.stage || 1,
    saveObj.layoutId || 'stage_1_tea_tray',
    saveObj.dealSeed || `${Date.now()}`,
    saveObj.themeId || 'ner-heritage',
    saveObj.tableFelt || 'sand',
    JSON.stringify(saveObj.tiles || []),
    JSON.stringify(saveObj.moveHistory || []),
    JSON.stringify(metrics),
    saveObj.pairsCleared || 0,
    saveObj.activeDurationMs || 0,
    saveObj.startedAt || now,
    now,
    nextRev
  );

  return getMahjongSave(patientId);
}

export function deleteMahjongSave(patientId) {
  database.prepare('DELETE FROM patient_mahjong_saves WHERE patient_id = ?').run(patientId);
  return { success: true };
}

seedDemoData();
