import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import {
  addGameSession, addObservation, authenticate, createPatient, createSession, deactivatePatient,
  deleteSession, getPatientAccess, getUserBySession, listAccessiblePatients, listCollection,
  listGameProgress, listGameSessions, listObservations, listShares, registerCaregiver, resetPatientPassword,
  sharePatient, unsharePatient, updatePatient, upsertCollectionItem,
  getMahjongSave, saveMahjongSave, deleteMahjongSave,
  completeReminderOccurrence, snoozeReminderOccurrence, listAlertEvents, updateAlertEventStatus,
  createSosAlert, savePushSubscription, deletePushSubscription,
  createChatInvite, revokeChatInvite, redeemChatInvite, acknowledgeConnection,
  listPatientConnections, listConversations, getConversationMessages, sendChatMessage,
  muteConnection, unmuteConnection, blockConnection, createModerationFlag,
  listModerationFlags, updateModerationFlag, hideChatMessage, releaseHeldChatMessage,
  updateConversationRead, listConversationAuditEvents, syncChatOutbox,
} from './server/store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3050);
const production = process.env.NODE_ENV === 'production';
const cookieName = 'smriti_session';
const loginAttempts = new Map();
const uploadsPath = path.resolve(process.env.UPLOADS_PATH || path.join(__dirname, 'uploads'));
mkdirSync(uploadsPath, { recursive: true });

app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
app.use(express.json({ limit: '6mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin) {
    const allowedOrigins = new Set([`https://${req.headers.host}`, `http://${req.headers.host}`, 'http://localhost:5173', 'http://127.0.0.1:5173']);
    if (!allowedOrigins.has(req.headers.origin)) return res.status(403).json({ error: 'Origin not allowed.' });
  }
  next();
});

const parseCookies = (header = '') => Object.fromEntries(header.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
  const index = part.indexOf('=');
  return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
}));
const setSessionCookie = (res, token, expiresAt) => res.cookie(cookieName, token, { httpOnly: true, secure: production, sameSite: 'lax', path: '/', expires: new Date(expiresAt) });
const clearSessionCookie = (res) => res.clearCookie(cookieName, { httpOnly: true, secure: production, sameSite: 'lax', path: '/' });

function authRequired(req, res, next) {
  const token = parseCookies(req.headers.cookie)[cookieName];
  const user = getUserBySession(token);
  if (!user) return res.status(401).json({ error: 'Please sign in.' });
  req.authUser = user;
  req.sessionToken = token;
  next();
}
const caregiverRequired = (req, res, next) => req.authUser.role === 'caregiver' ? next() : res.status(403).json({ error: 'Caretaker access required.' });
const withPatientAccess = (minimum = 'self') => (req, res, next) => {
  const access = getPatientAccess(req.authUser, req.params.patientId);
  if (!access) return res.status(403).json({ error: 'You do not have access to this patient.' });
  if (minimum === 'owner' && access !== 'owner') return res.status(403).json({ error: 'Patient owner access required.' });
  req.patientAccess = access;
  next();
};
const requiredText = (value, label, minimum = 1) => {
  const text = String(value || '').trim();
  if (text.length < minimum) throw new Error(`${label} is required and must contain at least ${minimum} characters.`);
  return text;
};
const handleError = (res, error) => {
  const message = error instanceof Error ? error.message : 'Request failed.';
  if (/UNIQUE constraint failed/i.test(message)) return res.status(409).json({ error: 'That record already exists.' });
  if (/required|at least|valid|invalid|username|template|reaction|participant|connection|active|paused|limit|wait|safety|not found|exist|blocked|already|expired|mismatch|access|permission/i.test(message)) {
    return res.status(400).json({ error: message });
  }
  console.error(error);
  return res.status(500).json({ error: 'The request could not be completed.' });
};

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'SmritiNER', storage: 'sqlite', authentication: 'server-session', schemaVersion: '2.0.0' }));
app.post('/api/auth/login', (req, res) => {
  const key = req.ip || 'unknown';
  const attempt = loginAttempts.get(key) || { count: 0, resetAt: Date.now() + 15 * 60000 };
  if (Date.now() > attempt.resetAt) { attempt.count = 0; attempt.resetAt = Date.now() + 15 * 60000; }
  if (attempt.count >= 10) return res.status(429).json({ error: 'Too many attempts. Please wait before trying again.' });
  try {
    const user = authenticate(requiredText(req.body.identifier, 'Username or email'), requiredText(req.body.password, 'Password'));
    if (!user) {
      attempt.count += 1; loginAttempts.set(key, attempt);
      return res.status(401).json({ error: 'Username/email or password is incorrect.' });
    }
    loginAttempts.delete(key);
    const session = createSession(user.id);
    setSessionCookie(res, session.token, session.expiresAt);
    return res.json({ user, patients: listAccessiblePatients(user), expiresAt: session.expiresAt });
  } catch (error) { return handleError(res, error); }
});
app.post('/api/auth/register-caregiver', (req, res) => {
  try {
    const input = {
      displayName: requiredText(req.body.displayName, 'Full name', 2), username: requiredText(req.body.username, 'Username', 3),
      email: requiredText(req.body.email, 'Email', 5), password: requiredText(req.body.password, 'Password', 8),
    };
    if (!/^[a-z0-9._-]+$/i.test(input.username)) throw new Error('Username may use letters, numbers, dots, dashes, and underscores.');
    if (!/^\S+@\S+\.\S+$/.test(input.email)) throw new Error('Enter a valid email address.');
    const user = registerCaregiver(input);
    const session = createSession(user.id);
    setSessionCookie(res, session.token, session.expiresAt);
    return res.status(201).json({ user, patients: [], expiresAt: session.expiresAt });
  } catch (error) { return handleError(res, error); }
});
app.post('/api/auth/logout', authRequired, (req, res) => { deleteSession(req.sessionToken); clearSessionCookie(res); res.status(204).end(); });
app.get('/api/auth/me', authRequired, (req, res) => res.json({ user: req.authUser, patients: listAccessiblePatients(req.authUser) }));

app.get('/api/patients', authRequired, (req, res) => res.json({ patients: listAccessiblePatients(req.authUser) }));
app.post('/api/patients', authRequired, caregiverRequired, (req, res) => {
  try {
    const input = {
      name: requiredText(req.body.name, 'Patient name', 2), username: requiredText(req.body.username, 'Patient username', 3),
      password: requiredText(req.body.password, 'Temporary password', 4), age: Number(req.body.age), dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender, preferredLanguage: req.body.preferredLanguage, state: requiredText(req.body.state, 'State'),
      district: requiredText(req.body.district, 'District'), emergencyContactName: requiredText(req.body.emergencyContactName, 'Emergency contact name'),
      emergencyContactPhone: requiredText(req.body.emergencyContactPhone, 'Emergency contact phone'), clinicianCondition: req.body.clinicianCondition,
      careNotes: req.body.careNotes, clientRequestId: req.body.clientRequestId ? String(req.body.clientRequestId) : undefined,
    };
    if (!/^[a-z0-9._-]+$/i.test(input.username)) throw new Error('Username may use letters, numbers, dots, dashes, and underscores.');
    if (input.password.length > 64) throw new Error('Password must not exceed 64 characters.');
    if (!Number.isInteger(input.age) || input.age < 45 || input.age > 120) throw new Error('Enter a valid age between 45 and 120.');
    res.status(201).json({ patient: createPatient(req.authUser.id, input) });
  } catch (error) { handleError(res, error); }
});
app.patch('/api/patients/:patientId', authRequired, caregiverRequired, withPatientAccess('owner'), (req, res) => {
  try { updatePatient(req.params.patientId, req.body); res.json({ patient: listAccessiblePatients(req.authUser).find((item) => item.id === req.params.patientId) }); }
  catch (error) { handleError(res, error); }
});
app.delete('/api/patients/:patientId', authRequired, caregiverRequired, withPatientAccess('owner'), (req, res) => { deactivatePatient(req.params.patientId); res.status(204).end(); });
app.get('/api/patients/:patientId/shares', authRequired, caregiverRequired, withPatientAccess(), (req, res) => res.json({ shares: listShares(req.params.patientId) }));
app.post('/api/patients/:patientId/shares', authRequired, caregiverRequired, withPatientAccess('owner'), (req, res) => {
  const share = sharePatient(req.params.patientId, req.body.identifier);
  if (!share) return res.status(404).json({ error: 'Registered caretaker not found.' });
  res.status(201).json({ share });
});
app.delete('/api/patients/:patientId/shares/:caregiverId', authRequired, caregiverRequired, withPatientAccess('owner'), (req, res) => {
  if (!unsharePatient(req.params.patientId, req.params.caregiverId)) return res.status(400).json({ error: 'Owner access cannot be removed.' });
  res.status(204).end();
});
app.post('/api/patients/:patientId/reset-password', authRequired, caregiverRequired, withPatientAccess('owner'), (req, res) => {
  try { resetPatientPassword(req.params.patientId, requiredText(req.body.password, 'Temporary password', 4)); res.status(204).end(); }
  catch (error) { handleError(res, error); }
});

app.get('/api/patients/:patientId/game-progress', authRequired, withPatientAccess(), (req, res) => {
  res.json({ progress: listGameProgress(req.params.patientId) });
});
app.get('/api/patients/:patientId/game-sessions', authRequired, withPatientAccess(), (req, res) => res.json({ sessions: listGameSessions(req.params.patientId) }));
app.post('/api/patients/:patientId/game-sessions', authRequired, withPatientAccess(), (req, res) => {
  try {
    const validGames = new Set(['majuli_memory', 'tea_tray_recall', 'market_list_recall', 'missing_object', 'daily_steps', 'weave_pattern', 'memory_lane', 'mahjong_memory']);
    if (!validGames.has(req.body.gameType) || !Number.isInteger(req.body.stage) || req.body.stage < 1 || req.body.stage > 12 || !Number.isFinite(req.body.accuracy) || req.body.accuracy < 0 || req.body.accuracy > 100) throw new Error('Enter a valid game session.');
    const result = addGameSession(req.params.patientId, req.body);
    res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) { handleError(res, error); }
});
for (const collection of ['reminders', 'hydration', 'photos']) {
  app.get(`/api/patients/:patientId/${collection}`, authRequired, withPatientAccess(), (req, res) => res.json({ items: listCollection(req.params.patientId, collection) }));
}
app.post('/api/patients/:patientId/reminders', authRequired, withPatientAccess(), (req, res) => {
  try {
    let input = req.body;
    if (req.authUser.role === 'patient') {
      const existing = listCollection(req.params.patientId, 'reminders').find((item) => String(item.id) === String(req.body.id));
      if (!existing) return res.status(404).json({ error: 'Reminder not found.' });
      input = { ...existing, completedDates: Array.isArray(req.body.completedDates) ? req.body.completedDates : existing.completedDates, snoozedUntil: req.body.snoozedUntil, lastAlertedDate: req.body.lastAlertedDate };
    }
    res.status(201).json({ item: upsertCollectionItem(req.params.patientId, 'reminders', input) });
  } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/reminders/:reminderId/complete', authRequired, withPatientAccess(), (req, res) => {
  try {
    const result = completeReminderOccurrence(req.params.patientId, req.params.reminderId, req.body.dateKey);
    res.json(result);
  } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/reminders/:reminderId/snooze', authRequired, withPatientAccess(), (req, res) => {
  try {
    const result = snoozeReminderOccurrence(req.params.patientId, req.params.reminderId, req.body.minutes || 10);
    res.json(result);
  } catch (error) { handleError(res, error); }
});
app.get('/api/patients/:patientId/alerts', authRequired, withPatientAccess(), (req, res) => {
  try {
    const alerts = listAlertEvents(req.params.patientId, req.query.status);
    res.json({ alerts });
  } catch (error) { handleError(res, error); }
});
app.patch('/api/patients/:patientId/alerts/:alertId', authRequired, caregiverRequired, withPatientAccess(), (req, res) => {
  try {
    const alert = updateAlertEventStatus(req.params.alertId, req.authUser.id, req.body.status, req.body.notes);
    res.json({ alert });
  } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/sos', authRequired, withPatientAccess(), (req, res) => {
  try {
    const alert = createSosAlert(req.params.patientId, req.body);
    res.status(201).json({ alert });
  } catch (error) { handleError(res, error); }
});
app.post('/api/notifications/subscriptions', authRequired, (req, res) => {
  try {
    const patientId = req.body.patientId || req.authUser.id;
    const result = savePushSubscription(req.authUser.id, patientId, req.body.subscription);
    res.status(201).json(result);
  } catch (error) { handleError(res, error); }
});
app.delete('/api/notifications/subscriptions/:id', authRequired, (req, res) => {
  try {
    res.json(deletePushSubscription(req.params.id));
  } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/hydration', authRequired, withPatientAccess(), (req, res) => {
  try { res.status(201).json({ item: upsertCollectionItem(req.params.patientId, 'hydration', req.body) }); } catch (error) { handleError(res, error); }
});
app.get('/api/patients/:patientId/mahjong-save', authRequired, withPatientAccess(), (req, res) => {
  try { res.json({ save: getMahjongSave(req.params.patientId) }); } catch (error) { handleError(res, error); }
});
app.put('/api/patients/:patientId/mahjong-save', authRequired, withPatientAccess(), (req, res) => {
  try { res.json({ save: saveMahjongSave(req.params.patientId, req.body) }); } catch (error) { handleError(res, error); }
});
app.delete('/api/patients/:patientId/mahjong-save', authRequired, withPatientAccess(), (req, res) => {
  try { res.json(deleteMahjongSave(req.params.patientId)); } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/photos', authRequired, caregiverRequired, withPatientAccess(), (req, res) => {
  try { res.status(201).json({ item: upsertCollectionItem(req.params.patientId, 'photos', req.body) }); } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/photos/upload', authRequired, caregiverRequired, withPatientAccess(), (req, res) => {
  try {
    const match = String(req.body.dataUrl || '').match(/^data:image\/(jpeg|png|webp);base64,([a-zA-Z0-9+/=]+)$/);
    if (!match) return res.status(400).json({ error: 'Upload a JPEG, PNG, or WebP image.' });
    const bytes = Buffer.from(match[2], 'base64');
    if (!bytes.length || bytes.length > 4 * 1024 * 1024) return res.status(400).json({ error: 'Image must be smaller than 4 MB.' });
    const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
    const fileName = `${req.params.patientId}__${randomUUID()}.${extension}`;
    writeFileSync(path.join(uploadsPath, fileName), bytes, { flag: 'wx' });
    const item = upsertCollectionItem(req.params.patientId, 'photos', {
      id: randomUUID(), patientId: req.params.patientId, imageUrl: `/uploads/${fileName}`,
      title: requiredText(req.body.title, 'Photo title', 2), relationshipOrPlace: String(req.body.relationshipOrPlace || ''),
      year: String(req.body.year || ''), memoryPromptQuestion: requiredText(req.body.memoryPromptQuestion, 'Memory prompt', 2),
      correctAnswer: requiredText(req.body.correctAnswer, 'Answer', 1), audioPromptHint: String(req.body.audioPromptHint || ''), synced: true,
    });
    res.status(201).json({ item });
  } catch (error) { handleError(res, error); }
});
app.get('/api/patients/:patientId/observations', authRequired, caregiverRequired, withPatientAccess(), (req, res) => res.json({ observations: listObservations(req.params.patientId) }));
app.post('/api/patients/:patientId/observations', authRequired, caregiverRequired, withPatientAccess(), (req, res) => {
  try { res.status(201).json({ observation: addObservation(req.params.patientId, req.authUser.id, { ...req.body, note: requiredText(req.body.note, 'Observation', 2) }) }); }
  catch (error) { handleError(res, error); }
});

// --- SUPERVISED PATIENT MESSAGING ("GREETINGS") API ---
app.get('/api/patients/:patientId/chat/connections', authRequired, withPatientAccess(), (req, res) => {
  try { res.json({ connections: listPatientConnections(req.params.patientId) }); } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/chat/invites', authRequired, caregiverRequired, withPatientAccess('owner'), (req, res) => {
  try { res.status(201).json({ invite: createChatInvite(req.params.patientId, req.authUser.id) }); } catch (error) { handleError(res, error); }
});
app.delete('/api/patients/:patientId/chat/invites/:inviteId', authRequired, caregiverRequired, withPatientAccess('owner'), (req, res) => {
  try { res.json(revokeChatInvite(req.params.inviteId, req.authUser.id)); } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/chat/invites/redeem', authRequired, caregiverRequired, withPatientAccess('owner'), (req, res) => {
  try {
    const connection = redeemChatInvite(req.params.patientId, req.authUser.id, req.body.code);
    res.status(201).json({ connection });
  } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/chat/connections/:connectionId/acknowledge', authRequired, withPatientAccess('self'), (req, res) => {
  try {
    if (req.authUser.role !== 'patient') return res.status(403).json({ error: 'Only the patient can acknowledge this connection.' });
    const connection = acknowledgeConnection(req.params.connectionId, req.authUser.id);
    res.json({ connection });
  } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/chat/connections/:connectionId/mute', authRequired, caregiverRequired, withPatientAccess(), (req, res) => {
  try { res.json(muteConnection(req.params.connectionId, req.authUser.id, req.params.patientId)); } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/chat/connections/:connectionId/unmute', authRequired, caregiverRequired, withPatientAccess(), (req, res) => {
  try { res.json(unmuteConnection(req.params.connectionId, req.authUser.id, req.params.patientId)); } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/chat/connections/:connectionId/block', authRequired, caregiverRequired, withPatientAccess(), (req, res) => {
  try { res.json(blockConnection(req.params.connectionId, req.authUser.id, req.params.patientId, req.body.reason)); } catch (error) { handleError(res, error); }
});
app.get('/api/patients/:patientId/chat/conversations', authRequired, withPatientAccess(), (req, res) => {
  try { res.json({ conversations: listConversations(req.params.patientId, req.authUser) }); } catch (error) { handleError(res, error); }
});
app.get('/api/patients/:patientId/chat/conversations/:conversationId/messages', authRequired, withPatientAccess(), (req, res) => {
  try {
    const cursor = req.query.cursor ? JSON.parse(req.query.cursor) : null;
    const limit = Number(req.query.limit) || 40;
    res.json(getConversationMessages(req.params.conversationId, req.authUser, req.params.patientId, { cursor, limit }));
  } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/chat/conversations/:conversationId/messages', authRequired, withPatientAccess('self'), (req, res) => {
  try {
    if (req.authUser.role !== 'patient') return res.status(403).json({ error: 'Caregivers cannot send greetings on behalf of patients.' });
    const result = sendChatMessage(req.params.patientId, req.params.conversationId, req.body);
    res.status(result.isDuplicate ? 200 : 201).json(result);
  } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/chat/conversations/:conversationId/read', authRequired, withPatientAccess(), (req, res) => {
  try { res.json(updateConversationRead(req.params.conversationId, req.authUser.id, req.body.messageId)); } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/chat/sync', authRequired, withPatientAccess('self'), (req, res) => {
  try {
    if (req.authUser.role !== 'patient') return res.status(403).json({ error: 'Patient access required for outbox sync.' });
    res.json(syncChatOutbox(req.params.patientId, req.body.operations || []));
  } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/chat/conversations/:conversationId/flags', authRequired, withPatientAccess(), (req, res) => {
  try { res.status(201).json({ flag: createModerationFlag(req.params.conversationId, req.authUser, req.params.patientId, req.body) }); } catch (error) { handleError(res, error); }
});
app.get('/api/patients/:patientId/chat/moderation-flags', authRequired, caregiverRequired, withPatientAccess(), (req, res) => {
  try { res.json({ flags: listModerationFlags(req.params.patientId, req.query.status) }); } catch (error) { handleError(res, error); }
});
app.patch('/api/patients/:patientId/chat/moderation-flags/:flagId', authRequired, caregiverRequired, withPatientAccess(), (req, res) => {
  try { res.json({ flag: updateModerationFlag(req.params.flagId, req.authUser.id, req.body) }); } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/chat/conversations/:conversationId/messages/:messageId/hide', authRequired, caregiverRequired, withPatientAccess(), (req, res) => {
  try { res.json(hideChatMessage(req.params.conversationId, req.params.messageId, req.authUser.id, req.body.reason)); } catch (error) { handleError(res, error); }
});
app.post('/api/patients/:patientId/chat/conversations/:conversationId/messages/:messageId/release', authRequired, caregiverRequired, withPatientAccess(), (req, res) => {
  try { res.json(releaseHeldChatMessage(req.params.conversationId, req.params.messageId, req.authUser.id)); } catch (error) { handleError(res, error); }
});
app.get('/api/patients/:patientId/chat/conversations/:conversationId/audit', authRequired, caregiverRequired, withPatientAccess(), (req, res) => {
  try { res.json({ events: listConversationAuditEvents(req.params.conversationId) }); } catch (error) { handleError(res, error); }
});

const distPath = path.join(__dirname, 'dist');
app.get('/uploads/:fileName', authRequired, (req, res) => {
  const fileName = path.basename(req.params.fileName);
  const patientId = fileName.split('__')[0];
  if (!patientId || !getPatientAccess(req.authUser, patientId)) return res.status(403).json({ error: 'You do not have access to this memory.' });
  res.setHeader('Cache-Control', 'private, max-age=604800');
  res.sendFile(path.join(uploadsPath, fileName));
});
app.use('/assets', express.static(path.join(distPath, 'assets'), { maxAge: '1y', immutable: true }));
app.use(express.static(distPath, { maxAge: 0 }));
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
app.listen(port, '127.0.0.1', () => console.log(`[SmritiNER] listening on http://127.0.0.1:${port}`));
