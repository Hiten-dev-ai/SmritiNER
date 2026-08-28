import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const port = 3197;
const origin = `http://127.0.0.1:${port}`;
const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'smritiner-api-'));
let serverProcess;

const waitForHealth = async () => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(`${origin}/api/health`)).ok) return; } catch { /* server is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Test server did not start.');
};
const login = async (identifier, password) => {
  const response = await fetch(`${origin}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password }) });
  return { response, cookie: response.headers.get('set-cookie')?.split(';')[0] || '', body: await response.json() };
};

beforeAll(async () => {
  serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve('.'), stdio: 'ignore',
    env: { ...process.env, PORT: String(port), DATABASE_PATH: path.join(temporaryRoot, 'smritiner.sqlite'), UPLOADS_PATH: path.join(temporaryRoot, 'uploads') },
  });
  await waitForHealth();
});
afterAll(async () => {
  serverProcess?.kill();
  await new Promise((resolve) => setTimeout(resolve, 100));
  rmSync(temporaryRoot, { recursive: true, force: true });
});

describe.sequential('server-backed multi-user access', () => {
  it('routes seeded caretaker and patient accounts by server role', async () => {
    const caretaker = await login('hiten', '1234');
    expect(caretaker.response.status).toBe(200); expect(caretaker.body.user.role).toBe('caregiver'); expect(caretaker.body.patients[0].accessRole).toBe('owner');
    const patient = await login('bhaben', '1234');
    expect(patient.response.status).toBe(200); expect(patient.body.user.role).toBe('patient'); expect(patient.body.patients[0].accessRole).toBe('self');
  });

  it('enforces owner, editor, patient, and cross-patient authorization', async () => {
    const editor = await login('mahalakshmi', '1234');
    expect(editor.body.patients[0].accessRole).toBe('editor');
    const reset = await fetch(`${origin}/api/patients/pat-ner-001/reset-password`, { method: 'POST', headers: { Cookie: editor.cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'newpassword' }) });
    expect(reset.status).toBe(403);
    const patient = await login('bhaben', '1234');
    expect((await fetch(`${origin}/api/patients/pat-ner-001/observations`, { headers: { Cookie: patient.cookie } })).status).toBe(403);
    expect((await fetch(`${origin}/api/patients/pat-ner-001/photos`, { method: 'POST', headers: { Cookie: patient.cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'forbidden-photo', imageUrl: 'https://example.com/photo.jpg' }) })).status).toBe(403);
    expect((await fetch(`${origin}/api/patients/pat-ner-001`, { method: 'PATCH', headers: { Cookie: editor.cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ careNotes: 'Editor should not alter the profile.' }) })).status).toBe(403);
    expect((await fetch(`${origin}/api/patients/not-their-patient/game-sessions`, { headers: { Cookie: editor.cookie } })).status).toBe(403);
  });

  it('allows public caretaker registration but rejects weak new passwords', async () => {
    const weak = await fetch(`${origin}/api/auth/register-caregiver`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: 'Test Carer', username: 'testcarer', email: 'test@example.com', password: '1234' }) });
    expect(weak.status).toBe(400);
    const strong = await fetch(`${origin}/api/auth/register-caregiver`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: 'Test Carer', username: 'testcarer', email: 'test@example.com', password: 'securepass8' }) });
    expect(strong.status).toBe(201); expect((await strong.json()).user.role).toBe('caregiver');
  });

  it('stores personal memory images outside the release and returns them to the patient', async () => {
    const caretaker = await login('hiten', '1234');
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const upload = await fetch(`${origin}/api/patients/pat-ner-001/photos/upload`, { method: 'POST', headers: { Cookie: caretaker.cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUrl, title: 'Family tea', relationshipOrPlace: 'Home', memoryPromptQuestion: 'Who is here?', correctAnswer: 'Family' }) });
    expect(upload.status).toBe(201);
    const item = (await upload.json()).item; expect(item.imageUrl).toMatch(/^\/uploads\//);
    const patient = await login('bhaben', '1234');
    const photos = await fetch(`${origin}/api/patients/pat-ner-001/photos`, { headers: { Cookie: patient.cookie } });
    expect((await photos.json()).items).toHaveLength(1);
    expect((await fetch(`${origin}${item.imageUrl}`, { headers: { Cookie: patient.cookie } })).status).toBe(200);
  });

  it('creates patient with 4-character password and supports clientRequestId idempotency', async () => {
    const caretaker = await login('hiten', '1234');
    const clientRequestId = `req-test-${Date.now()}`;
    const payload = {
      name: 'Ramen Borah',
      username: 'ramen_borah',
      password: '1234', // 4 chars permitted for elder accessibility
      age: 72,
      gender: 'Male',
      preferredLanguage: 'Assamese',
      state: 'Assam',
      district: 'Jorhat',
      emergencyContactName: 'Anil Borah',
      emergencyContactPhone: '+919876543210',
      clientRequestId,
    };

    // First creation call
    const res1 = await fetch(`${origin}/api/patients`, {
      method: 'POST',
      headers: { Cookie: caretaker.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res1.status).toBe(201);
    const body1 = await res1.json();
    expect(body1.patient.name).toBe('Ramen Borah');
    expect(body1.patient.username).toBe('ramen_borah');

    // Idempotent retry with same clientRequestId returns existing patient without error
    const res2 = await fetch(`${origin}/api/patients`, {
      method: 'POST',
      headers: { Cookie: caretaker.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res2.status).toBe(201);
    const body2 = await res2.json();
    expect(body2.patient.id).toBe(body1.patient.id);

    // Patient can log in with 4-character password
    const patientLogin = await login('ramen_borah', '1234');
    expect(patientLogin.response.status).toBe(200);
    expect(patientLogin.body.user.displayName).toBe('Ramen Borah');
  });

  it('provides 8 game progression records and updates progress on game session submission', async () => {
    const caretaker = await login('hiten', '1234');

    // Fetch initial progress for pat-ner-001
    const progressRes = await fetch(`${origin}/api/patients/pat-ner-001/game-progress`, {
      headers: { Cookie: caretaker.cookie },
    });
    expect(progressRes.status).toBe(200);
    const progressBody = await progressRes.json();
    expect(progressBody.progress).toHaveLength(8);
    const mahjongProg = progressBody.progress.find((p) => p.gameType === 'mahjong_memory');
    expect(mahjongProg).toBeDefined();
    expect(mahjongProg.unlockedStage).toBeGreaterThanOrEqual(1);

    // Submit Mahjong game session
    const sessionPayload = {
      gameType: 'mahjong_memory',
      domain: 'visual-memory',
      stage: 1,
      accuracy: 100,
      durationSeconds: 45,
      memoryLoad: 3,
      mistakes: 0,
      hintsUsed: 0,
      medianResponseMs: 1400,
      responseVariabilityMs: 120,
      completionStatus: 'completed',
      roundResults: [
        { round: 1, correct: true, responseMs: 1400, mistakes: 0, hintsUsed: 0, contentVariantId: 'm1' },
      ],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      clientEventId: `mahjong-event-${Date.now()}`,
    };

    const sessionRes = await fetch(`${origin}/api/patients/pat-ner-001/game-sessions`, {
      method: 'POST',
      headers: { Cookie: caretaker.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionPayload),
    });
    expect(sessionRes.status).toBe(201);
    const sessionBody = await sessionRes.json();
    expect(sessionBody.progress).toBeDefined();
    expect(sessionBody.decision).toBeDefined();
  });

  it('saves, retrieves, and clears active Mahjong Solitaire games', async () => {
    const patient = await login('bhaben', '1234');

    // 1. Initially no save
    const initialGet = await fetch(`${origin}/api/patients/pat-ner-001/mahjong-save`, {
      headers: { Cookie: patient.cookie },
    });
    expect(initialGet.status).toBe(200);
    const initialBody = await initialGet.json();
    expect(initialBody.save).toBeNull();

    // 2. Save active board state
    const savePayload = {
      stage: 3,
      layoutId: 'stage_3_bamboo_bridge',
      dealSeed: 'deal_12345',
      themeId: 'ner-heritage',
      tableFelt: 'tea-garden',
      tiles: [{ instanceId: 't1', identityId: 'suit1_1', positionId: 'p1', x: 0, y: 0, z: 0, active: true }],
      moveHistory: [],
      pairsCleared: 4,
      activeDurationMs: 45000,
      hintCount: 1,
      mismatchCount: 0,
      blockedTapCount: 2,
      shuffleCount: 0,
      startedAt: new Date().toISOString(),
    };

    const putRes = await fetch(`${origin}/api/patients/pat-ner-001/mahjong-save`, {
      method: 'PUT',
      headers: { Cookie: patient.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify(savePayload),
    });
    expect(putRes.status).toBe(200);
    const putBody = await putRes.json();
    expect(putBody.save).toBeDefined();
    expect(putBody.save.stage).toBe(3);
    expect(putBody.save.layoutId).toBe('stage_3_bamboo_bridge');
    expect(putBody.save.pairsCleared).toBe(4);

    // 3. Retrieve saved board state
    const getRes = await fetch(`${origin}/api/patients/pat-ner-001/mahjong-save`, {
      headers: { Cookie: patient.cookie },
    });
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.save.stage).toBe(3);
    expect(getBody.save.pairsCleared).toBe(4);

    // 4. Delete saved board state upon completion
    const delRes = await fetch(`${origin}/api/patients/pat-ner-001/mahjong-save`, {
      method: 'DELETE',
      headers: { Cookie: patient.cookie },
    });
    expect(delRes.status).toBe(200);

    // 5. Verify save is gone
    const finalGet = await fetch(`${origin}/api/patients/pat-ner-001/mahjong-save`, {
      headers: { Cookie: patient.cookie },
    });
    expect((await finalGet.json()).save).toBeNull();
  });

  it('supports atomic reminder completion, snooze, alerts listing, and SOS triggers', async () => {
    const caretaker = await login('hiten', '1234');
    const patient = await login('bhaben', '1234');

    // 1. Caregiver creates a reminder
    const remRes = await fetch(`${origin}/api/patients/pat-ner-001/reminders`, {
      method: 'POST',
      headers: { Cookie: caretaker.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'rem-test-01',
        title: 'Morning BP Medicine',
        category: 'medicine',
        time: '08:00 AM',
        completedDates: [],
      }),
    });
    expect(remRes.status).toBe(201);

    // 2. Patient triggers SOS
    const sosRes = await fetch(`${origin}/api/patients/pat-ner-001/sos`, {
      method: 'POST',
      headers: { Cookie: patient.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Assistance Needed', notes: 'Patient called family' }),
    });
    expect(sosRes.status).toBe(201);
    const sosBody = await sosRes.json();
    expect(sosBody.alert.alertKind).toBe('sos');

    // 3. Patient snoozes the reminder
    const snoozeRes = await fetch(`${origin}/api/patients/pat-ner-001/reminders/rem-test-01/snooze`, {
      method: 'POST',
      headers: { Cookie: patient.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutes: 10 }),
    });
    expect(snoozeRes.status).toBe(200);
    const snoozeBody = await snoozeRes.json();
    expect(snoozeBody.success).toBe(true);
    expect(snoozeBody.snoozedUntil).toBeDefined();

    // 4. Patient completes the reminder
    const compRes = await fetch(`${origin}/api/patients/pat-ner-001/reminders/rem-test-01/complete`, {
      method: 'POST',
      headers: { Cookie: patient.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateKey: '2026-08-28' }),
    });
    expect(compRes.status).toBe(200);
    const compBody = await compRes.json();
    expect(compBody.success).toBe(true);
    expect(compBody.reminder.completedDates).toContain('2026-08-28');

    // 5. Caregiver lists alerts
    const alertsRes = await fetch(`${origin}/api/patients/pat-ner-001/alerts`, {
      headers: { Cookie: caretaker.cookie },
    });
    expect(alertsRes.status).toBe(200);
    const alertsBody = await alertsRes.json();
    expect(alertsBody.alerts.length).toBeGreaterThan(0);

    // 6. Caregiver resolves the SOS alert
    const resolveRes = await fetch(`${origin}/api/patients/pat-ner-001/alerts/${sosBody.alert.id}`, {
      method: 'PATCH',
      headers: { Cookie: caretaker.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved', notes: 'Spoke with son Anil' }),
    });
    expect(resolveRes.status).toBe(200);
  });
});

