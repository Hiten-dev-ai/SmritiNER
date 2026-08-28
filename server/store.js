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

export function createPatient(ownerId, input) {
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

export function addGameSession(patientId, input) {
  const id = input.id || randomUUID();
  database.prepare(`INSERT INTO game_sessions (id, patient_id, game_type, domain, stage, accuracy, duration_seconds, memory_load,
    mistakes, hints_used, median_response_ms, response_variability_ms, completion_status, content_variant_ids, round_results,
    started_at, completed_at, client_event_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(client_event_id) DO NOTHING`).run(
      id, patientId, input.gameType, input.domain, input.stage, input.accuracy, input.durationSeconds, input.memoryLoad,
      input.mistakes, input.hintsUsed, input.medianResponseMs, input.responseVariabilityMs, input.completionStatus || 'completed',
      JSON.stringify(input.contentVariantIds || []), JSON.stringify(input.roundResults || []), input.startedAt, input.completedAt,
      input.clientEventId || id, nowIso()
    );
  return id;
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

seedDemoData();
