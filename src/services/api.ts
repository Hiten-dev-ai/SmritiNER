import type { AuthenticatedPatient, CaregiverObservation, DifficultyDecision, GameProgress, JourneyGameSession, PatientCaregiverAccess, ReminiscencePhoto, UserAccount } from '../types';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Request failed.' }));
    throw new ApiError(payload.error || 'Request failed.', response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export interface AuthPayload { user: UserAccount; patients: AuthenticatedPatient[]; expiresAt?: string }

export const api = {
  login: (identifier: string, password: string) => request<AuthPayload>('/api/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }),
  registerCaregiver: (input: { displayName: string; username: string; email: string; password: string }) => request<AuthPayload>('/api/auth/register-caregiver', { method: 'POST', body: JSON.stringify(input) }),
  me: () => request<AuthPayload>('/api/auth/me'),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  listPatients: () => request<{ patients: AuthenticatedPatient[] }>('/api/patients'),
  createPatient: (input: Record<string, unknown>) => request<{ patient: AuthenticatedPatient }>('/api/patients', { method: 'POST', body: JSON.stringify(input) }),
  updatePatient: (patientId: string, input: Record<string, unknown>) => request<{ patient: AuthenticatedPatient }>(`/api/patients/${patientId}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deactivatePatient: (patientId: string) => request<void>(`/api/patients/${patientId}`, { method: 'DELETE' }),
  listShares: (patientId: string) => request<{ shares: PatientCaregiverAccess[] }>(`/api/patients/${patientId}/shares`),
  sharePatient: (patientId: string, identifier: string) => request<{ share: PatientCaregiverAccess }>(`/api/patients/${patientId}/shares`, { method: 'POST', body: JSON.stringify({ identifier }) }),
  unsharePatient: (patientId: string, caregiverId: string) => request<void>(`/api/patients/${patientId}/shares/${caregiverId}`, { method: 'DELETE' }),
  resetPatientPassword: (patientId: string, password: string) => request<void>(`/api/patients/${patientId}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),
  getGameProgress: (patientId: string) => request<{ progress: GameProgress[] }>(`/api/patients/${patientId}/game-progress`),
  listSessions: (patientId: string) => request<{ sessions: JourneyGameSession[] }>(`/api/patients/${patientId}/game-sessions`),
  addSession: (patientId: string, session: JourneyGameSession) => request<{ id: string; progress?: GameProgress[]; decision?: DifficultyDecision; duplicate?: boolean }>(`/api/patients/${patientId}/game-sessions`, { method: 'POST', body: JSON.stringify(session) }),
  listCollection: <T>(patientId: string, collection: 'reminders' | 'hydration' | 'photos') => request<{ items: T[] }>(`/api/patients/${patientId}/${collection}`),
  saveCollectionItem: <T>(patientId: string, collection: 'reminders' | 'hydration' | 'photos', item: T) => request<{ item: T }>(`/api/patients/${patientId}/${collection}`, { method: 'POST', body: JSON.stringify(item) }),
  uploadPhoto: (patientId: string, input: { dataUrl: string; title: string; relationshipOrPlace: string; year?: string; memoryPromptQuestion: string; correctAnswer: string; audioPromptHint?: string }) => request<{ item: ReminiscencePhoto }>(`/api/patients/${patientId}/photos/upload`, { method: 'POST', body: JSON.stringify(input) }),
  listObservations: (patientId: string) => request<{ observations: CaregiverObservation[] }>(`/api/patients/${patientId}/observations`),
  addObservation: (patientId: string, input: { note: string; tags: string[]; observedAt?: string }) => request<{ observation: CaregiverObservation }>(`/api/patients/${patientId}/observations`, { method: 'POST', body: JSON.stringify(input) }),
  getMahjongSave: (patientId: string) => request<{ save: import('./mahjongEngine').MahjongSavedGame | null }>(`/api/patients/${patientId}/mahjong-save`),
  saveMahjongSave: (patientId: string, save: import('./mahjongEngine').MahjongSavedGame) => request<{ save: import('./mahjongEngine').MahjongSavedGame }>(`/api/patients/${patientId}/mahjong-save`, { method: 'PUT', body: JSON.stringify(save) }),
  deleteMahjongSave: (patientId: string) => request<{ success: boolean }>(`/api/patients/${patientId}/mahjong-save`, { method: 'DELETE' }),
  completeReminder: (patientId: string, reminderId: string | number, dateKey?: string) =>
    request<{ success: boolean; reminder: import('../types').ReminderItem }>(`/api/patients/${patientId}/reminders/${reminderId}/complete`, { method: 'POST', body: JSON.stringify({ dateKey }) }),
  snoozeReminder: (patientId: string, reminderId: string | number, minutes: number = 10) =>
    request<{ success: boolean; reminder: import('../types').ReminderItem; snoozedUntil: string }>(`/api/patients/${patientId}/reminders/${reminderId}/snooze`, { method: 'POST', body: JSON.stringify({ minutes }) }),
  listAlerts: (patientId: string, status?: string) =>
    request<{ alerts: import('../types').AlertEvent[] }>(`/api/patients/${patientId}/alerts${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  updateAlert: (patientId: string, alertId: string, status: import('../types').AlertStatus, notes?: string) =>
    request<{ alert: import('../types').AlertEvent }>(`/api/patients/${patientId}/alerts/${alertId}`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),
  triggerSos: (patientId: string, details?: { title?: string; notes?: string }) =>
    request<{ alert: import('../types').AlertEvent }>(`/api/patients/${patientId}/sos`, { method: 'POST', body: JSON.stringify(details || {}) }),
  subscribePush: (patientId: string, subscription: PushSubscriptionJSON) =>
    request<{ id: string; endpoint: string; saved: boolean }>('/api/notifications/subscriptions', { method: 'POST', body: JSON.stringify({ patientId, subscription }) }),
  unsubscribePush: (subscriptionId: string) =>
    request<{ success: boolean }>(`/api/notifications/subscriptions/${subscriptionId}`, { method: 'DELETE' }),
};
