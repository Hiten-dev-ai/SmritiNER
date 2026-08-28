import React, { useEffect, useState } from 'react';
import { BellRing, ChevronRight, Droplets, Flower2, Heart, Leaf, PhoneCall, Pill, Sparkles, Volume2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { getLocalDateKey } from '../../services/localDate';
import { journeyDefinitions, localizedGame, nextStage, type JourneyGameType } from '../../services/journeyEngine';
import type { JourneyGameSession, ReminiscencePhoto, ReminderItem } from '../../types';
import { GameSelection } from '../games/GameSelection';
import { JourneyGame } from '../games/JourneyGame';

type View = 'home' | 'games' | 'game' | 'routine';
const patientCopy = {
  English: { journey: 'Continue your Memory Journey', fresh: 'A fresh, familiar game is ready. Take your time and enjoy each round.', play: 'Play', todayGames: "Today’s three fresh games", balanced: 'A balanced 6–10 minute memory journey', allGames: 'All 7 games', garden: 'Garden flowers', todayJourney: "Today’s journey", routine: 'Routine & medicines', hydration: 'Hydration', addWater: 'Add water', family: 'Family / SOS', loading: 'Loading your fresh journey…', support: 'Engagement support only—not a medical diagnosis.', complete: 'Complete', home: 'Home' },
  Hindi: { journey: 'अपनी स्मृति यात्रा जारी रखें', fresh: 'एक नया परिचित खेल तैयार है। आराम से हर दौर का आनंद लें।', play: 'खेलें', todayGames: 'आज के तीन नए खेल', balanced: '6–10 मिनट की संतुलित स्मृति यात्रा', allGames: 'सभी 7 खेल', garden: 'स्मृति बगिया', todayJourney: 'आज की यात्रा', routine: 'दिनचर्या और दवाइयाँ', hydration: 'पानी', addWater: 'पानी जोड़ें', family: 'परिवार / SOS', loading: 'आपकी नई यात्रा तैयार हो रही है…', support: 'केवल सहभागिता सहायता—चिकित्सीय निदान नहीं।', complete: 'पूरा', home: 'मुख्य पृष्ठ' },
  Assamese: { journey: 'আপোনাৰ স্মৃতি পথ আগবঢ়াওক', fresh: 'এটা নতুন চিনাকি খেল সাজু। সময় লৈ প্ৰতিটো পৰ্ব উপভোগ কৰক।', play: 'খেলক', todayGames: 'আজিৰ তিনিটা নতুন খেল', balanced: '৬–১০ মিনিটৰ সুষম স্মৃতি পথ', allGames: 'সকলো ৭টা খেল', garden: 'স্মৃতি বাগিচা', todayJourney: 'আজিৰ পথ', routine: 'নিয়ম আৰু ঔষধ', hydration: 'পানী', addWater: 'পানী যোগ কৰক', family: 'পৰিয়াল / SOS', loading: 'আপোনাৰ নতুন পথ সাজু হৈছে…', support: 'কেৱল অংশগ্ৰহণ সহায়—চিকিৎসা নিৰ্ণয় নহয়।', complete: 'সম্পূৰ্ণ', home: 'মূল পৃষ্ঠা' },
};

export const PatientHome: React.FC = () => {
  const { currentPatient, readAloud, speechSupported, isOnline, isOfflineSession, selectedLanguage, t } = useApp();
  const copy = patientCopy[selectedLanguage];
  const [view, setView] = useState<View>('home');
  const [selectedGame, setSelectedGame] = useState<JourneyGameType>('majuli_memory');
  const [sessions, setSessions] = useState<JourneyGameSession[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [photos, setPhotos] = useState<ReminiscencePhoto[]>([]);
  const [hydration, setHydration] = useState(0);
  const [loading, setLoading] = useState(true);
  const today = getLocalDateKey();

  useEffect(() => {
    if (!currentPatient) return;
    let active = true;
    Promise.all([
      api.listSessions(currentPatient.id).then((result) => result.sessions),
      api.listCollection<ReminderItem>(currentPatient.id, 'reminders').then((result) => result.items),
      api.listCollection<{ date: string; glassesDrunk: number }>(currentPatient.id, 'hydration').then((result) => result.items),
      api.listCollection<ReminiscencePhoto>(currentPatient.id, 'photos').then((result) => result.items),
    ]).then(([nextSessions, nextReminders, logs, nextPhotos]) => {
      if (!active) return;
      setSessions(nextSessions); setReminders(nextReminders); setPhotos(nextPhotos);
      setHydration(logs.find((entry) => entry.date === today)?.glassesDrunk || 0);
    }).catch(() => {
      try { setSessions(JSON.parse(localStorage.getItem(`smriti-sessions-${currentPatient.id}`) || '[]')); } catch { setSessions([]); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [currentPatient, today]);

  useEffect(() => { if (currentPatient) localStorage.setItem(`smriti-sessions-${currentPatient.id}`, JSON.stringify(sessions)); }, [currentPatient, sessions]);
  useEffect(() => {
    if (!currentPatient || !isOnline || isOfflineSession) return;
    const outboxKey = `smriti-session-outbox-${currentPatient.id}`;
    let pending: JourneyGameSession[] = [];
    try { pending = JSON.parse(localStorage.getItem(outboxKey) || '[]'); } catch { pending = []; }
    if (!pending.length) return;
    void Promise.all(pending.map((session) => api.addSession(currentPatient.id, session))).then(() => localStorage.removeItem(outboxKey)).catch(() => undefined);
  }, [currentPatient, isOfflineSession, isOnline]);
  if (!currentPatient) return <div className="p-8 text-center text-xl font-bold">Patient profile unavailable.</div>;

  const launch = (game: JourneyGameType) => { setSelectedGame(game); setView('game'); window.scrollTo({ top: 0 }); };
  const completeSession = async (session: JourneyGameSession) => {
    setSessions((values) => [...values, session]);
    try { await api.addSession(currentPatient.id, session); }
    catch { const outboxKey = `smriti-session-outbox-${currentPatient.id}`; const outbox = JSON.parse(localStorage.getItem(outboxKey) || '[]'); localStorage.setItem(outboxKey, JSON.stringify([...outbox, session])); }
  };
  if (view === 'game') return <JourneyGame gameType={selectedGame} stage={nextStage(selectedGame, sessions)} recentVariantIds={sessions.slice(-3).flatMap((session) => session.contentVariantIds)} patientId={currentPatient.id} photos={photos} onBack={() => setView('games')} onComplete={completeSession} />;
  if (view === 'games') return <div className="mx-auto max-w-6xl p-4 sm:p-7"><button onClick={() => setView('home')} className="mb-5 min-h-12 rounded-xl border border-stone-300 bg-white px-4 font-black">← {copy.home}</button><GameSelection sessions={sessions} onSelectGame={launch} /></div>;

  const dueReminder = reminders.find((reminder) => !(reminder.completedDates || []).includes(today));
  const completedToday = sessions.filter((session) => session.completionStatus === 'completed' && getLocalDateKey(new Date(session.completedAt)) === today);
  const gardenFlowers = sessions.filter((session) => session.completionStatus === 'completed').length;
  const dayIndex = new Date().getDate() % journeyDefinitions.length;
  const dailyGames = [0, 1, 2].map((offset) => journeyDefinitions[(dayIndex + offset) % journeyDefinitions.length]);
  const recommended = dailyGames.find((game) => !completedToday.some((session) => session.gameType === game.id)) || dailyGames[0];
  const recommendedText = localizedGame(recommended.id, selectedLanguage);
  const markReminderDone = async () => {
    if (!dueReminder) return;
    const updated = { ...dueReminder, completedDates: [...(dueReminder.completedDates || []), today] };
    setReminders((values) => values.map((entry) => entry.id === dueReminder.id ? updated : entry));
    await api.saveCollectionItem(currentPatient.id, 'reminders', updated).catch(() => undefined);
  };
  const updateHydration = async (value: number) => {
    const next = Math.max(0, Math.min(8, value)); setHydration(next);
    await api.saveCollectionItem(currentPatient.id, 'hydration', { id: `${currentPatient.id}-${today}`, patientId: currentPatient.id, date: today, glassesDrunk: next, targetGlasses: 6 }).catch(() => undefined);
  };

  return <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-7">
    {(isOfflineSession || !isOnline) && <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 font-bold text-amber-950">Offline — games remain available and completed journeys will sync when this device reconnects.</div>}
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-tea-950 via-tea-800 to-emerald-700 p-5 text-white shadow-xl sm:p-8">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-assamGold-300/20 blur-2xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div className="max-w-2xl"><p className="text-base font-bold text-assamGold-300">{t.welcome}, {currentPatient.name}</p><h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">{copy.journey}</h1><p className="mt-3 text-lg font-semibold text-emerald-50">{copy.fresh}</p><button onClick={() => launch(recommended.id as JourneyGameType)} className="mt-6 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-assamGold-300 px-6 text-xl font-black text-tea-950 shadow-lg sm:w-auto"><Sparkles className="h-7 w-7" />{copy.play} {recommendedText.title}<ChevronRight /></button></div><div className="relative grid min-w-64 grid-cols-2 gap-3"><div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-center"><Flower2 className="mx-auto h-8 w-8 text-assamGold-300" /><span className="mt-2 block text-3xl font-black">{gardenFlowers}</span><span className="text-sm font-bold text-emerald-100">{copy.garden}</span></div><div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-center"><Leaf className="mx-auto h-8 w-8 text-emerald-200" /><span className="mt-2 block text-3xl font-black">{completedToday.length}/3</span><span className="text-sm font-bold text-emerald-100">{copy.todayJourney}</span></div></div></div>
    </section>

    <section className="rounded-[1.75rem] border-2 border-tea-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black text-tea-950">{copy.todayGames}</h2><p className="text-base font-semibold text-stone-600">{copy.balanced}</p></div><button onClick={() => setView('games')} className="min-h-12 shrink-0 rounded-xl bg-tea-100 px-4 font-black text-tea-900">{copy.allGames}</button></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{dailyGames.map((game, index) => { const done = completedToday.some((session) => session.gameType === game.id); const localized = localizedGame(game.id, selectedLanguage); return <button key={game.id} onClick={() => launch(game.id as JourneyGameType)} className={`flex min-h-28 items-center gap-3 rounded-2xl border-2 p-4 text-left ${done ? 'border-emerald-300 bg-emerald-50' : 'border-stone-200 bg-stone-50'}`}><span className="text-4xl">{game.emoji}</span><span><span className="block text-sm font-black text-stone-500">{done ? `✓ ${copy.complete}` : `${copy.todayJourney} ${index + 1}`}</span><span className="block text-lg font-black text-stone-950">{localized.title}</span><span className="block text-sm font-bold text-tea-800">{t.level} {nextStage(game.id, sessions)}</span></span></button>; })}</div></section>

    {dueReminder && <section className="flex flex-col gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-amber-950"><BellRing /></span><div className="min-w-0 flex-1"><p className="text-sm font-black uppercase text-amber-800">{t.dueNow} · {dueReminder.time}</p><h2 className="text-xl font-black text-stone-950">{dueReminder.title}</h2></div>{speechSupported && <button onClick={() => readAloud(`${dueReminder.title}. ${dueReminder.time}`)} className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-300 bg-white" aria-label={t.listen}><Volume2 /></button>}<button onClick={markReminderDone} className="min-h-12 rounded-xl bg-amber-800 px-5 font-black text-white">{t.markDone}</button></section>}

    <section className="grid gap-4 md:grid-cols-3"><button onClick={() => setView('routine')} className="flex min-h-32 items-center gap-4 rounded-3xl border-2 border-rose-200 bg-white p-5 text-left shadow-sm"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-800"><Pill /></span><span><span className="text-xl font-black">{copy.routine}</span><span className="mt-1 block font-semibold text-stone-600">{reminders.filter((item) => item.completedDates?.includes(today)).length}/{reminders.length} {t.done}</span></span></button><section className="rounded-3xl border-2 border-sky-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><Droplets /></span><div><h2 className="text-xl font-black">{copy.hydration}</h2><p className="font-bold text-stone-600">{hydration}/6 {t.glasses}</p></div></div><div className="mt-4 flex gap-2"><button onClick={() => updateHydration(hydration - 1)} className="h-12 flex-1 rounded-xl border border-stone-300 text-xl font-black">−</button><button onClick={() => updateHydration(hydration + 1)} className="h-12 flex-1 rounded-xl bg-sky-600 text-xl font-black text-white">+ {copy.addWater}</button></div></section><a href={`tel:${currentPatient.emergencyContactPhone.replace(/\s/g, '')}`} className="flex min-h-32 items-center gap-4 rounded-3xl bg-rose-700 p-5 text-white shadow-sm"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20"><PhoneCall /></span><span><span className="block text-sm font-black uppercase text-rose-100">{copy.family}</span><span className="block text-xl font-black">{currentPatient.emergencyContactName}</span><span className="font-semibold">{currentPatient.emergencyContactPhone}</span></span></a></section>

    {view === 'routine' && <section className="fixed inset-0 z-50 overflow-y-auto bg-[#f8fbf9] p-4"><div className="mx-auto max-w-2xl"><button onClick={() => setView('home')} className="mb-4 min-h-12 rounded-xl border bg-white px-4 font-black">← {copy.home}</button><h1 className="text-3xl font-black">{t.todaysRoutine}</h1><div className="mt-5 space-y-3">{reminders.map((reminder) => { const done = reminder.completedDates?.includes(today); return <button key={String(reminder.id)} onClick={async () => { const updated = { ...reminder, completedDates: done ? reminder.completedDates.filter((date) => date !== today) : [...(reminder.completedDates || []), today] }; setReminders((values) => values.map((entry) => entry.id === reminder.id ? updated : entry)); await api.saveCollectionItem(currentPatient.id, 'reminders', updated); }} className={`flex min-h-20 w-full items-center gap-4 rounded-2xl border-2 p-4 text-left ${done ? 'border-emerald-300 bg-emerald-50' : 'border-stone-200 bg-white'}`}><span className="text-2xl">{reminder.category === 'medicine' ? '💊' : '🌤️'}</span><span className="flex-1"><span className="block text-lg font-black">{reminder.title}</span><span className="font-bold text-stone-600">{reminder.time}</span></span><span className="font-black">{done ? `${t.done} ✓` : t.markDone}</span></button>; })}</div></div></section>}
    {loading && <p className="text-center font-bold text-stone-500">{copy.loading}</p>}
    <p className="flex items-center justify-center gap-2 pb-2 text-center text-sm font-semibold text-stone-500"><Heart className="h-4 w-4" />{copy.support}</p>
  </div>;
};
