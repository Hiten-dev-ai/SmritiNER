import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const port = 3198;
const origin = `http://127.0.0.1:${port}`;
const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'smritiner-chat-api-'));
let serverProcess;

const waitForHealth = async () => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      if ((await fetch(`${origin}/api/health`)).ok) return;
    } catch {
      /* server is still starting */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Test server did not start.');
};

const login = async (identifier, password) => {
  const response = await fetch(`${origin}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  return {
    response,
    cookie: response.headers.get('set-cookie')?.split(';')[0] || '',
    body: await response.json(),
  };
};

beforeAll(async () => {
  serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve('.'),
    stdio: 'ignore',
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_PATH: path.join(temporaryRoot, 'smritiner.sqlite'),
      UPLOADS_PATH: path.join(temporaryRoot, 'uploads'),
    },
  });
  await waitForHealth();
});

afterAll(async () => {
  serverProcess?.kill();
  await new Promise((resolve) => setTimeout(resolve, 100));
  rmSync(temporaryRoot, { recursive: true, force: true });
});

describe.sequential('Supervised Patient Messaging ("Greetings") System', () => {
  let caregiver1Cookie = '';
  let caregiver2Cookie = '';
  let patient1Cookie = '';
  let patient2Cookie = '';
  let patient1Id = '';
  let patient2Id = '';
  let inviteCode = '';
  let connectionId = '';
  let conversationId = '';
  let heldMessageId = '';

  it('sets up two separate care circles with patient accounts', async () => {
    // 1. Caregiver 1 (Owner of seeded patient Bhaben)
    const c1 = await login('hiten', '1234');
    caregiver1Cookie = c1.cookie;
    patient1Id = c1.body.patients[0].id; // 'pat-ner-001'

    const p1 = await login('bhaben', '1234');
    patient1Cookie = p1.cookie;

    // 2. Register Caregiver 2
    const regRes = await fetch(`${origin}/api/auth/register-caregiver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Anuradha Devi',
        username: 'anuradha',
        email: 'anuradha@example.com',
        password: 'securepass123',
      }),
    });
    expect(regRes.status).toBe(201);
    const c2 = await login('anuradha', 'securepass123');
    caregiver2Cookie = c2.cookie;

    // 3. Create Patient 2 for Caregiver 2
    const createPatientRes = await fetch(`${origin}/api/patients`, {
      method: 'POST',
      headers: { Cookie: caregiver2Cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pranab Saikia',
        age: 72,
        gender: 'Male',
        state: 'Assam',
        district: 'Sivasagar',
        preferredLanguage: 'Assamese',
        emergencyContactName: 'Anuradha Devi',
        emergencyContactPhone: '+91 94350 99999',
        username: 'pranab',
        password: 'password123',
      }),
    });
    expect(createPatientRes.status).toBe(201);
    const p2Data = await createPatientRes.json();
    patient2Id = p2Data.patient.id;

    const p2 = await login('pranab', 'password123');
    patient2Cookie = p2.cookie;
  });

  it('generates a 10-character one-time invite code by owner caregiver 1', async () => {
    const res = await fetch(`${origin}/api/patients/${patient1Id}/chat/invites`, {
      method: 'POST',
      headers: { Cookie: caregiver1Cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.invite.tokenCode).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
    inviteCode = data.invite.tokenCode;
  });

  it('redeems invite by owner caregiver 2 creating connection in awaiting-patient-ack state', async () => {
    const res = await fetch(`${origin}/api/patients/${patient2Id}/chat/invites/redeem`, {
      method: 'POST',
      headers: { Cookie: caregiver2Cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: inviteCode }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.connection.status).toBe('awaiting-patient-ack');
    connectionId = data.connection.id;
  });

  it('requires bilateral patient acknowledgements before connection unlocks', async () => {
    // Patient 1 acknowledges
    const ack1 = await fetch(`${origin}/api/patients/${patient1Id}/chat/connections/${connectionId}/acknowledge`, {
      method: 'POST',
      headers: { Cookie: patient1Cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(ack1.status).toBe(200);
    const data1 = await ack1.json();
    expect(data1.connection.hasMyPatientAcknowledged).toBe(true);
    expect(data1.connection.status).toBe('awaiting-patient-ack');

    // Patient 2 acknowledges
    const ack2 = await fetch(`${origin}/api/patients/${patient2Id}/chat/connections/${connectionId}/acknowledge`, {
      method: 'POST',
      headers: { Cookie: patient2Cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(ack2.status).toBe(200);
    const data2 = await ack2.json();
    expect(data2.connection.status).toBe('active');
  });

  it('allows patients to send allowlisted template messages and safe reactions', async () => {
    // Get conversation ID
    const convListRes = await fetch(`${origin}/api/patients/${patient1Id}/chat/conversations`, {
      headers: { Cookie: patient1Cookie },
    });
    expect(convListRes.status).toBe(200);
    const convs = await convListRes.json();
    conversationId = convs.conversations[0].id;

    // Send template message
    const sendRes = await fetch(`${origin}/api/patients/${patient1Id}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { Cookie: patient1Cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageType: 'template',
        templateKey: 'good_morning',
        catalogVersion: 1,
        compositionMethod: 'touch',
        clientEventId: 'test-event-001',
      }),
    });
    expect(sendRes.status).toBe(201);
    const sendData = await sendRes.json();
    expect(sendData.message.templateKey).toBe('good_morning');
    expect(sendData.message.recipientVisibility).toBe('visible');

    // Idempotent duplicate replay
    const dupRes = await fetch(`${origin}/api/patients/${patient1Id}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { Cookie: patient1Cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageType: 'template',
        templateKey: 'good_morning',
        clientEventId: 'test-event-001',
      }),
    });
    expect(dupRes.status).toBe(200);
    expect((await dupRes.json()).isDuplicate).toBe(true);

    // Send safe reaction
    const reactRes = await fetch(`${origin}/api/patients/${patient2Id}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { Cookie: patient2Cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageType: 'reaction',
        reactionCode: 'tea',
        compositionMethod: 'touch',
        clientEventId: 'test-event-002',
      }),
    });
    expect(reactRes.status).toBe(201);
  });

  it('rejects arbitrary free-form text and unknown templates with 400 Bad Request', async () => {
    const res = await fetch(`${origin}/api/patients/${patient1Id}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { Cookie: patient1Cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageType: 'template',
        templateKey: 'arbitrary_unapproved_phrase',
        clientEventId: 'test-event-003',
      }),
    });
    expect(res.status).toBe(400);
  });

  it('holds incoming messages when contact is muted by caregiver, and allows individual release', async () => {
    // Caregiver 2 mutes contact for Patient 2
    const muteRes = await fetch(`${origin}/api/patients/${patient2Id}/chat/connections/${connectionId}/mute`, {
      method: 'POST',
      headers: { Cookie: caregiver2Cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(muteRes.status).toBe(200);

    // Patient 1 sends message to muted Patient 2
    const sendRes = await fetch(`${origin}/api/patients/${patient1Id}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { Cookie: patient1Cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageType: 'template',
        templateKey: 'had_tea',
        catalogVersion: 1,
        compositionMethod: 'touch',
        clientEventId: 'test-event-held-001',
      }),
    });
    expect(sendRes.status).toBe(201);
    const sendData = await sendRes.json();
    expect(sendData.message.recipientVisibility).toBe('held');
    heldMessageId = sendData.message.id;

    // Patient 2 message query excludes held message
    const p2MsgsRes = await fetch(`${origin}/api/patients/${patient2Id}/chat/conversations/${conversationId}/messages`, {
      headers: { Cookie: patient2Cookie },
    });
    const p2Msgs = await p2MsgsRes.json();
    expect(p2Msgs.messages.some((m) => m.id === heldMessageId)).toBe(false);

    // Caregiver 2 message query includes held message
    const c2MsgsRes = await fetch(`${origin}/api/patients/${patient2Id}/chat/conversations/${conversationId}/messages`, {
      headers: { Cookie: caregiver2Cookie },
    });
    const c2Msgs = await c2MsgsRes.json();
    expect(c2Msgs.messages.some((m) => m.id === heldMessageId)).toBe(true);

    // Caregiver 2 releases held message
    const relRes = await fetch(`${origin}/api/patients/${patient2Id}/chat/conversations/${conversationId}/messages/${heldMessageId}/release`, {
      method: 'POST',
      headers: { Cookie: caregiver2Cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(relRes.status).toBe(200);

    // Now Patient 2 sees the released message
    const p2AfterRel = await (await fetch(`${origin}/api/patients/${patient2Id}/chat/conversations/${conversationId}/messages`, {
      headers: { Cookie: patient2Cookie },
    })).json();
    expect(p2AfterRel.messages.some((m) => m.id === heldMessageId)).toBe(true);
  });

  it('handles emergency block, rejects new sends, and manages moderation flags', async () => {
    // Caregiver raises flag
    const flagRes = await fetch(`${origin}/api/patients/${patient2Id}/chat/conversations/${conversationId}/flags`, {
      method: 'POST',
      headers: { Cookie: caregiver2Cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: heldMessageId,
        category: 'distress',
        notes: 'Elder expressed mild confusion.',
      }),
    });
    expect(flagRes.status).toBe(201);

    // Emergency Block
    const blockRes = await fetch(`${origin}/api/patients/${patient2Id}/chat/connections/${connectionId}/block`, {
      method: 'POST',
      headers: { Cookie: caregiver2Cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Safety precaution' }),
    });
    expect(blockRes.status).toBe(200);

    // Attempting to send message after block must fail
    const blockedSend = await fetch(`${origin}/api/patients/${patient1Id}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { Cookie: patient1Cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageType: 'template',
        templateKey: 'hello',
        clientEventId: 'test-event-after-block',
      }),
    });
    expect(blockedSend.status).toBe(400);
  });
});
