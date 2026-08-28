import React, { useEffect, useState } from 'react';
import {
  Activity,
  BellRing,
  CheckCircle2,
  ClipboardPenLine,
  Download,
  HardDrive,
  Images,
  Pill,
  Plus,
  Share2,
  ShieldCheck,
  UserRoundPlus,
  UsersRound,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import type {
  AlertEvent,
  CaregiverObservation,
  DailyHydrationLog,
  JourneyGameSession,
  PatientCaregiverAccess,
  ReminiscencePhoto,
  ReminderItem,
} from '../../types';
import { CognitiveCharts } from './CognitiveCharts';
import { MemoryManager } from './MemoryManager';
import { ObservationsPanel } from './ObservationsPanel';
import { PatientFormModal } from './PatientFormModal';
import { CaregiverChatPanel } from './CaregiverChatPanel';
import { MessageCircle } from 'lucide-react';

type Tab = 'overview' | 'alerts' | 'messages' | 'care' | 'memories' | 'observations' | 'access';

export const CaregiverDashboard: React.FC = () => {
  const {
    user,
    patients,
    currentPatient,
    setCurrentPatient,
    refreshPatients,
    isOfflineSession,
    gameProgress,
    t,
  } = useApp();

  const [tab, setTab] = useState<Tab>('overview');
  const [patientFormOpen, setPatientFormOpen] = useState(false);
  const [sessions, setSessions] = useState<JourneyGameSession[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [observations, setObservations] = useState<CaregiverObservation[]>([]);
  const [shares, setShares] = useState<PatientCaregiverAccess[]>([]);
  const [photos, setPhotos] = useState<ReminiscencePhoto[]>([]);
  const [hydrationLogs, setHydrationLogs] = useState<DailyHydrationLog[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [alertFilter, setAlertFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [loading, setLoading] = useState(false);
  const [shareIdentifier, setShareIdentifier] = useState('');
  const [shareError, setShareError] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderDraft, setReminderDraft] = useState({
    title: '',
    time: '08:30',
    category: 'routine' as ReminderItem['category'],
    notes: '',
  });
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!currentPatient || isOfflineSession) return;
    setLoading(true);
    Promise.all([
      api.listSessions(currentPatient.id).catch(() => ({ sessions: [] })),
      api.listCollection<ReminderItem>(currentPatient.id, 'reminders').catch(() => ({ items: [] })),
      api.listObservations(currentPatient.id).catch(() => ({ observations: [] })),
      api.listShares(currentPatient.id).catch(() => ({ shares: [] })),
      api.listCollection<ReminiscencePhoto>(currentPatient.id, 'photos').catch(() => ({ items: [] })),
      api.listCollection<DailyHydrationLog>(currentPatient.id, 'hydration').catch(() => ({ items: [] })),
      api.listAlerts(currentPatient.id).catch(() => ({ alerts: [] })),
    ])
      .then(
        ([
          sessionResult,
          reminderResult,
          observationResult,
          shareResult,
          photoResult,
          hydrationResult,
          alertResult,
        ]) => {
          setSessions(sessionResult.sessions || []);
          setReminders(reminderResult.items || []);
          setObservations(observationResult.observations || []);
          setShares(shareResult.shares || []);
          setPhotos(photoResult.items || []);
          setHydrationLogs(hydrationResult.items || []);
          setAlerts(alertResult.alerts || []);
        }
      )
      .finally(() => setLoading(false));
  }, [currentPatient, isOfflineSession]);

  if (!currentPatient) {
    return (
      <div className="mx-auto max-w-5xl p-5 sm:p-8">
        <section className="rounded-[2rem] border-2 border-dashed border-brahma-300 bg-white p-10 text-center">
          <UserRoundPlus className="mx-auto h-14 w-14 text-brahma-700" />
          <h1 className="mt-4 text-3xl font-black">Create your first patient account</h1>
          <p className="mx-auto mt-2 max-w-xl text-lg font-semibold text-stone-600">
            Patients cannot register themselves. Add their essential care profile and give them a
            private username and temporary password.
          </p>
          <button
            onClick={() => setPatientFormOpen(true)}
            className="mt-6 min-h-14 rounded-2xl bg-brahma-700 px-6 text-lg font-black text-white"
          >
            <Plus className="mr-2 inline" />
            Add patient
          </button>
        </section>
        <PatientFormModal
          open={patientFormOpen}
          onClose={() => setPatientFormOpen(false)}
          onCreated={refreshPatients}
        />
      </div>
    );
  }

  const addReminder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reminderDraft.title.trim()) return;
    const item: ReminderItem = {
      id: crypto.randomUUID(),
      patientId: currentPatient.id,
      title: reminderDraft.title.trim(),
      category: reminderDraft.category,
      time: reminderDraft.time,
      notes: reminderDraft.notes.trim() || undefined,
      completedDates: [],
      iconName: reminderDraft.category === 'medicine' ? 'Pill' : 'Bell',
      repeat: 'daily',
      alertsEnabled: true,
      synced: true,
    };
    const result = await api.saveCollectionItem(currentPatient.id, 'reminders', item);
    setReminders((values) => [...values, result.item]);
    setReminderDraft({ title: '', time: '08:30', category: 'routine', notes: '' });
    setShowReminderForm(false);
    setStatusMessage('Reminder added.');
  };

  const addShare = async () => {
    setShareError('');
    try {
      const result = await api.sharePatient(currentPatient.id, shareIdentifier);
      setShares((values) => [
        ...values.filter((share) => share.id !== result.share.id),
        result.share,
      ]);
      setShareIdentifier('');
    } catch (error) {
      setShareError(error instanceof Error ? error.message : 'Unable to share patient.');
    }
  };

  const resetPassword = async () => {
    if (temporaryPassword.length < 4) return;
    await api.resetPatientPassword(currentPatient.id, temporaryPassword);
    setTemporaryPassword('');
    setStatusMessage('Temporary patient password updated.');
  };

  const downloadSummary = async () => {
    const { generateEngagementPDF } = await import('../../services/reportGenerator');
    generateEngagementPDF(currentPatient, sessions, reminders, observations);
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const res = await api.updateAlert(currentPatient.id, alertId, 'acknowledged');
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? res.alert : a)));
      setStatusMessage('Alert acknowledged.');
    } catch {
      // ignore
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const res = await api.updateAlert(currentPatient.id, alertId, 'resolved', 'Resolved by caregiver.');
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? res.alert : a)));
      setStatusMessage('Alert marked as resolved.');
    } catch {
      // ignore
    }
  };

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: 'overview', label: 'Engagement overview', icon: Activity },
    { id: 'alerts', label: `Alerts (${alerts.filter((a) => a.status === 'due' || a.status === 'overdue').length})`, icon: BellRing },
    { id: 'messages', label: 'Messages & Friends', icon: MessageCircle },
    { id: 'care', label: 'Care plan', icon: Pill },
    { id: 'memories', label: 'Memory Lane', icon: Images },
    { id: 'observations', label: 'Observations', icon: ClipboardPenLine },
    { id: 'access', label: 'Access', icon: ShieldCheck },
  ];

  const filteredAlerts = alerts.filter((a) => {
    if (alertFilter === 'active') return a.status === 'due' || a.status === 'overdue' || a.status === 'snoozed';
    if (alertFilter === 'resolved') return a.status === 'resolved' || a.status === 'completed' || a.status === 'acknowledged';
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-7">
      {/* Header Banner */}
      <section className="rounded-[2rem] bg-gradient-to-r from-brahma-800 to-brahma-600 p-5 text-white shadow-lg sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-bold text-sky-100">Caretaker workspace · {user?.displayName}</p>
            <h1 className="mt-1 text-3xl font-black">Support every patient from one place</h1>
            <p className="mt-2 max-w-2xl font-semibold text-sky-50">
              Game engagement, daily routines, and caregiver observations—never a diagnosis.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => {
                void downloadSummary();
              }}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/30 bg-brahma-900/30 px-5 font-black text-white"
            >
              <Download />
              Summary PDF
            </button>
            <button
              onClick={() => setPatientFormOpen(true)}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-5 font-black text-brahma-900"
            >
              <Plus />
              Add patient
            </button>
          </div>
        </div>
      </section>

      {isOfflineSession && (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 font-bold text-amber-950">
          Offline caretaker view is read-only. Reconnect to manage accounts or care records.
        </p>
      )}

      {/* Patient Switcher Bar */}
      <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-tea-600 to-tea-900 text-2xl font-black text-white">
              {currentPatient.name.charAt(0)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-black">{currentPatient.name}</h2>
              <p className="font-semibold text-stone-600">
                {currentPatient.age} years · {currentPatient.district}, {currentPatient.state} ·{' '}
                <span className="capitalize">{currentPatient.accessRole}</span>
              </p>
              {currentPatient.clinicianCondition && (
                <p className="mt-1 text-sm font-bold text-amber-800">
                  Recorded care context: {currentPatient.clinicianCondition}
                </p>
              )}
            </div>
          </div>
          <label className="min-w-64">
            <span className="mb-1 block text-sm font-black text-stone-500">SELECT PATIENT</span>
            <select
              value={currentPatient.id}
              onChange={(event) => {
                const patient = patients.find((entry) => entry.id === event.target.value);
                if (patient) setCurrentPatient(patient);
              }}
              className="min-h-12 w-full rounded-xl border-2 border-stone-200 bg-white px-3 font-bold"
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="flex max-w-full gap-2 overflow-x-auto pb-1" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-4 font-black ${
              tab === item.id
                ? 'bg-brahma-700 text-white'
                : 'border border-stone-200 bg-white text-stone-700'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="p-8 text-center font-bold text-stone-500">Loading patient workspace…</p>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && (
            <CognitiveCharts
              sessions={sessions}
              reminders={reminders}
              hydrationLogs={hydrationLogs}
              gameProgress={gameProgress}
            />
          )}

          {/* TAB 2: CAREGIVER ALERT CENTRE */}
          {tab === 'alerts' && (
            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-stone-900">{t.alertsCenter}</h2>
                  <p className="text-sm font-semibold text-stone-500">
                    Overdue medicine, missed appointments, SOS assistance requests, and 48-hour inactivity check-ins.
                  </p>
                </div>

                <div className="flex gap-1.5">
                  {(['all', 'active', 'resolved'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAlertFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize ${
                        alertFilter === filter
                          ? 'bg-brahma-700 text-white'
                          : 'border border-stone-200 bg-stone-50 text-stone-700'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {filteredAlerts.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-stone-50 border border-dashed border-stone-200">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 mb-2" />
                  <p className="text-base font-black text-stone-800">No alerts in this view</p>
                  <p className="text-xs font-semibold text-stone-500">
                    All scheduled items and check-ins are currently steady.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredAlerts.map((alert) => {
                    const isSos = alert.alertKind === 'sos';
                    const isOverdue = alert.status === 'overdue' || alert.status === 'due';
                    const isResolved = alert.status === 'resolved' || alert.status === 'completed';

                    return (
                      <article
                        key={alert.id}
                        className={`rounded-2xl border-2 p-4 flex flex-col justify-between transition ${
                          isSos
                            ? 'border-rose-300 bg-rose-50/70'
                            : isOverdue
                            ? 'border-amber-300 bg-amber-50/60'
                            : 'border-stone-200 bg-stone-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                isSos
                                  ? 'bg-rose-600 text-white'
                                  : isOverdue
                                  ? 'bg-amber-500 text-amber-950'
                                  : 'bg-emerald-100 text-emerald-900'
                              }`}
                            >
                              {alert.alertKind} · {alert.status}
                            </span>
                            <span className="text-xs font-semibold text-stone-400">
                              {alert.dueDate} {alert.scheduledTime || ''}
                            </span>
                          </div>

                          <h3 className="mt-2 text-lg font-black text-stone-900">{alert.title}</h3>
                          <p className="mt-1 text-xs font-semibold text-stone-600">
                            {alert.notes || 'Automated care occurrence notification.'}
                          </p>
                        </div>

                        {!isResolved && (
                          <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-end gap-2">
                            {alert.status === 'due' && (
                              <button
                                onClick={() => void handleAcknowledgeAlert(alert.id)}
                                className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-black text-stone-700 hover:bg-stone-100"
                              >
                                {t.acknowledge}
                              </button>
                            )}
                            <button
                              onClick={() => void handleResolveAlert(alert.id)}
                              className="px-3 py-1.5 rounded-xl bg-teal-800 text-xs font-black text-white hover:bg-teal-900"
                            >
                              {t.resolve}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* TAB: MESSAGES & FRIENDS */}
          {tab === 'messages' && (
            <CaregiverChatPanel
              patientId={currentPatient.id}
              patientName={currentPatient.name}
              isOwner={currentPatient.accessRole === 'owner'}
            />
          )}

          {/* TAB 3: CARE PLAN */}
          {tab === 'care' && (
            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black">Medicines and routines</h2>
                  <p className="font-semibold text-stone-500">
                    Patient-visible reminders stored with this care profile.
                  </p>
                </div>
                <button
                  onClick={() => setShowReminderForm((open) => !open)}
                  className="min-h-12 rounded-xl bg-tea-800 px-4 font-black text-white"
                >
                  {showReminderForm ? 'Cancel' : '+ Add reminder'}
                </button>
              </div>

              {showReminderForm && (
                <form
                  onSubmit={addReminder}
                  className="mt-5 grid gap-3 rounded-2xl border border-tea-200 bg-tea-50 p-4 sm:grid-cols-2"
                >
                  <label>
                    <span className="mb-1 block font-bold">Reminder</span>
                    <input
                      required
                      value={reminderDraft.title}
                      onChange={(event) =>
                        setReminderDraft((value) => ({ ...value, title: event.target.value }))
                      }
                      className="min-h-12 w-full rounded-xl border-2 border-stone-200 bg-white px-3"
                      placeholder="Take morning medicine"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block font-bold">Time</span>
                    <input
                      required
                      type="time"
                      value={reminderDraft.time}
                      onChange={(event) =>
                        setReminderDraft((value) => ({ ...value, time: event.target.value }))
                      }
                      className="min-h-12 w-full rounded-xl border-2 border-stone-200 bg-white px-3"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block font-bold">Type</span>
                    <select
                      value={reminderDraft.category}
                      onChange={(event) =>
                        setReminderDraft((value) => ({
                          ...value,
                          category: event.target.value as ReminderItem['category'],
                        }))
                      }
                      className="min-h-12 w-full rounded-xl border-2 border-stone-200 bg-white px-3"
                    >
                      <option value="medicine">Medicine</option>
                      <option value="routine">Routine</option>
                      <option value="hydration">Hydration</option>
                      <option value="appointment">Appointment</option>
                    </select>
                  </label>
                  <label>
                    <span className="mb-1 block font-bold">Helpful note (optional)</span>
                    <input
                      value={reminderDraft.notes}
                      onChange={(event) =>
                        setReminderDraft((value) => ({ ...value, notes: event.target.value }))
                      }
                      className="min-h-12 w-full rounded-xl border-2 border-stone-200 bg-white px-3"
                      placeholder="After breakfast"
                    />
                  </label>
                  <button className="min-h-12 rounded-xl bg-tea-800 px-5 font-black text-white sm:col-span-2">
                    Save reminder
                  </button>
                </form>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {reminders.map((reminder) => (
                  <article
                    key={String(reminder.id)}
                    className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                  >
                    <span className="text-sm font-black uppercase text-tea-700">
                      {reminder.category} · {reminder.time}
                    </span>
                    <h3 className="mt-1 text-lg font-black">{reminder.title}</h3>
                    <p className="mt-1 font-semibold text-stone-600">
                      {reminder.dosage || reminder.notes || 'Daily reminder'}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* TAB 4: MEMORIES */}
          {tab === 'memories' && (
            <MemoryManager
              patientId={currentPatient.id}
              photos={photos}
              onAdded={(photo) => setPhotos((values) => [photo, ...values])}
            />
          )}

          {/* TAB 5: OBSERVATIONS */}
          {tab === 'observations' && (
            <ObservationsPanel
              patientId={currentPatient.id}
              observations={observations}
              onAdded={(observation) => setObservations((values) => [observation, ...values])}
            />
          )}

          {/* TAB 6: ACCESS & CREDENTIALS */}
          {tab === 'access' && (
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Share2 className="h-6 w-6 text-brahma-700" />
                  <h2 className="text-xl font-black">Caretaker access</h2>
                </div>
                <div className="mt-4 space-y-2">
                  {shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between rounded-2xl bg-stone-50 p-3"
                    >
                      <div>
                        <p className="font-black">{share.displayName}</p>
                        <p className="text-sm font-semibold text-stone-500">
                          @{share.username} · {share.accessRole}
                        </p>
                      </div>
                      {currentPatient.accessRole === 'owner' && share.accessRole !== 'owner' && (
                        <button
                          onClick={async () => {
                            await api.unsharePatient(currentPatient.id, share.id);
                            setShares((values) => values.filter((item) => item.id !== share.id));
                          }}
                          className="min-h-10 rounded-xl border border-rose-200 px-3 text-sm font-black text-rose-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {currentPatient.accessRole === 'owner' && (
                  <div className="mt-4 flex gap-2">
                    <input
                      value={shareIdentifier}
                      onChange={(event) => setShareIdentifier(event.target.value)}
                      placeholder="Caretaker username or email"
                      className="min-h-12 min-w-0 flex-1 rounded-xl border-2 border-stone-200 px-3"
                    />
                    <button
                      onClick={addShare}
                      className="rounded-xl bg-brahma-700 px-4 font-black text-white"
                    >
                      Share
                    </button>
                  </div>
                )}
                {shareError && <p className="mt-2 font-bold text-rose-700">{shareError}</p>}
              </section>

              <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <UsersRound className="h-6 w-6 text-tea-700" />
                  <h2 className="text-xl font-black">Patient sign-in</h2>
                </div>
                <p className="mt-3 font-semibold text-stone-600">
                  Username: <strong>{currentPatient.username}</strong>
                </p>
                {currentPatient.accessRole === 'owner' ? (
                  <>
                    <label className="mt-4 block">
                      <span className="mb-1 block font-bold">New temporary password</span>
                      <input
                        type="password"
                        minLength={4}
                        value={temporaryPassword}
                        onChange={(event) => setTemporaryPassword(event.target.value)}
                        className="min-h-12 w-full rounded-xl border-2 border-stone-200 px-3"
                        placeholder="At least 4 characters"
                      />
                    </label>
                    <button
                      onClick={resetPassword}
                      disabled={temporaryPassword.length < 4}
                      className="mt-3 min-h-12 w-full rounded-xl bg-tea-800 font-black text-white disabled:opacity-40"
                    >
                      Reset patient password
                    </button>
                  </>
                ) : (
                  <p className="mt-3 rounded-xl bg-stone-100 p-3 text-sm font-semibold text-stone-600">
                    Only the patient owner can reset credentials.
                  </p>
                )}
              </section>
            </div>
          )}
        </>
      )}

      {statusMessage && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 font-bold text-emerald-900"
        >
          {statusMessage}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-brahma-200 bg-brahma-50 p-4 text-sm font-semibold text-brahma-950">
        <HardDrive className="mt-0.5 h-5 w-5 shrink-0" />
        Prototype records are stored on the SmritiNER VPS and cached on authenticated devices for
        offline play. Engagement trends are descriptive, non-diagnostic observations.
      </div>

      <PatientFormModal
        open={patientFormOpen}
        onClose={() => setPatientFormOpen(false)}
        onCreated={refreshPatients}
      />
    </div>
  );
};
