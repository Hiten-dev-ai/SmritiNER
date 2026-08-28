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
});
