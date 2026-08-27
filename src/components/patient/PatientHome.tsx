import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Brain, ChevronRight, Clock3, Heart, PhoneCall, Pill, ShieldAlert, Sun, Volume2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import { db } from '../../services/db';
import { getIndiaMinutesNow, getLocalDateKey, isReminderScheduledForDate, timeToMinutes } from '../../services/localDate';
import type { GameType, ReminderItem } from '../../types';
import { ChaiHarvestGame } from '../games/ChaiHarvestGame';
import { DailyLifeSequenceGame } from '../games/DailyLifeSequenceGame';
import { GameSelection } from '../games/GameSelection';
import { MajuliMemoryGame } from '../games/MajuliMemoryGame';
import { ReminiscenceAlbumGame } from '../games/ReminiscenceAlbumGame';
import { WeavePatternGame } from '../games/WeavePatternGame';
import { DailyRoutineView } from './DailyRoutineView';
import { DueReminderAlert } from './DueReminderAlert';
import { HydrationTracker } from './HydrationTracker';

type ActiveView = 'dashboard' | 'games_menu' | 'routine' | 'game_play';

export const PatientHome: React.FC = () => {
  const { currentPatient, selectedLanguage, setGameActive, readAloud, speechSupported, t } = useApp();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [gameReturnView, setGameReturnView] = useState<'dashboard' | 'games_menu'>('games_menu');
  const [clockNow, setClockNow] = useState(() => new Date());
  const queriedReminders = useLiveQuery(() => db.reminders.toArray());
  const reminders = useMemo(() => queriedReminders ?? [], [queriedReminders]);
  const today = getLocalDateKey(clockNow);
  const nowMinutes = getIndiaMinutesNow(clockNow);
  const locale = selectedLanguage === 'Hindi' ? 'hi-IN' : selectedLanguage === 'Assamese' ? 'as-IN' : 'en-IN';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setGameActive(activeView === 'game_play');
    return () => setGameActive(false);
  }, [activeView, selectedGame, setGameActive]);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const pendingReminders = useMemo(() => reminders.filter((reminder) =>
    isReminderScheduledForDate(reminder, today) && !reminder.completedDates.includes(today)
  ), [reminders, today]);

  const nextReminder = useMemo(() => {
    const future = pendingReminders.filter((reminder) => timeToMinutes(reminder.time) >= nowMinutes).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    if (future[0]) return future[0];
    return [...pendingReminders].sort((a, b) => timeToMinutes(b.time) - timeToMinutes(a.time))[0];
  }, [nowMinutes, pendingReminders]);

  const dueReminder = useMemo(() => pendingReminders
    .filter((reminder) => reminder.alertsEnabled !== false)
    .filter((reminder) => timeToMinutes(reminder.time) <= nowMinutes)
    .filter((reminder) => !reminder.snoozedUntil || new Date(reminder.snoozedUntil).getTime() <= clockNow.getTime())
    .sort((a, b) => timeToMinutes(b.time) - timeToMinutes(a.time))[0], [clockNow, nowMinutes, pendingReminders]);

  const handleLaunchGame = (game: GameType) => { setSelectedGame(game); setGameReturnView('games_menu'); setActiveView('game_play'); };
  const renderActiveGame = () => {
    switch (selectedGame) {
      case 'majuli_memory': return <MajuliMemoryGame onBack={() => setActiveView('games_menu')} />;
      case 'chai_harvest': return <ChaiHarvestGame onBack={() => setActiveView('games_menu')} />;
      case 'daily_sequence': return <DailyLifeSequenceGame onBack={() => setActiveView('games_menu')} />;
      case 'weave_pattern': return <WeavePatternGame onBack={() => setActiveView('games_menu')} />;
      case 'reminiscence_album': return <ReminiscenceAlbumGame onBack={() => setActiveView(gameReturnView)} />;
      default: return <GameSelection onSelectGame={handleLaunchGame} />;
    }
  };

  if (activeView === 'game_play') return renderActiveGame();
  if (activeView === 'games_menu') return <div className="mx-auto max-w-5xl p-4 sm:p-6"><button onClick={() => { audioManager.playTap(); setActiveView('dashboard'); }} className="tactile-btn mb-5 flex min-h-[56px] items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-base font-bold text-stone-800 shadow-sm">← {t.home}</button><GameSelection onSelectGame={handleLaunchGame} /></div>;
  if (activeView === 'routine') return <DailyRoutineView onBack={() => setActiveView('dashboard')} />;

  const reminderStatus = nextReminder && timeToMinutes(nextReminder.time) < nowMinutes ? t.overdue : t.upcoming;
  const readReminder = (reminder?: ReminderItem) => reminder && readAloud(`${t.upNext}. ${reminder.title}. ${reminder.time}. ${reminder.notes ?? ''}`);

  return (
    <div className="mx-auto max-w-5xl min-w-0 space-y-5 p-4 sm:p-8 animate-fade-in">
      <section className="flex items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-tea-800 to-tea-950 p-5 text-white shadow-sm">
        <div className="min-w-0"><div className="mb-1 flex items-center gap-2 text-base font-bold text-assamGold-300"><Sun className="h-5 w-5" /><span>{clockNow.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div><h1 className="break-words text-2xl font-black leading-tight tracking-tight sm:text-3xl">{t.welcome}, {currentPatient?.name || 'Bhaben Barua'}</h1><span className="mt-2 inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-sm font-bold">{t.demoProfile}</span></div>
      </section>

      {dueReminder && <DueReminderAlert reminder={dueReminder} onOpenRoutine={() => setActiveView('routine')} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
        <section className="rounded-3xl border-2 border-brahma-200 bg-white p-5 shadow-sm" aria-labelledby="up-next-title">
          <div className="flex items-start gap-3"><span className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl bg-brahma-100 text-brahma-800"><Clock3 className="h-6 w-6" /></span><div className="min-w-0 flex-1"><h2 id="up-next-title" className="text-lg font-black text-stone-950">{t.upNext}</h2>{nextReminder ? <><p className="mt-1 break-words text-xl font-black text-stone-900">{nextReminder.title}</p><p className="mt-1 text-base font-bold text-stone-600">{nextReminder.time} · <span className={reminderStatus === t.overdue ? 'text-rose-700' : 'text-tea-800'}>{reminderStatus}</span></p></> : <p className="mt-1 text-base font-semibold text-stone-600">{t.noUpcoming}</p>}</div>{nextReminder && speechSupported && <button onClick={() => readReminder(nextReminder)} className="tactile-btn flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl border border-brahma-300 bg-brahma-50 text-brahma-900" aria-label={t.listen}><Volume2 className="h-6 w-6" /></button>}</div>
          <button onClick={() => setActiveView('routine')} className="tactile-btn mt-4 min-h-[56px] w-full rounded-2xl bg-brahma-600 px-4 text-base font-black text-white sm:w-auto">{t.viewRoutine}</button>
        </section>
        <a href={`tel:${(currentPatient?.emergencyContactPhone || '').replace(/\s/g, '')}`} className="tactile-btn flex min-h-[112px] items-center gap-4 rounded-3xl border-2 border-rose-700 bg-rose-600 p-5 text-white shadow-sm md:min-w-64" aria-label={`${t.callFamily}: ${currentPatient?.emergencyContactName || ''}`}><span className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl bg-white/20"><PhoneCall className="h-6 w-6" /></span><span><span className="flex items-center gap-1.5 text-base font-black"><ShieldAlert className="h-5 w-5" />{t.emergencySos}</span><span className="mt-1 block text-xl font-black">{t.callFamily}</span><span className="mt-1 block text-base font-semibold text-rose-100">{currentPatient?.emergencyContactPhone}</span></span></a>
      </div>

      <section aria-labelledby="recommended-title"><h2 id="recommended-title" className="mb-3 text-xl font-black text-tea-950">{t.recommendedActivity}</h2><div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button onClick={() => { audioManager.playTap(); setActiveView('games_menu'); }} className="tactile-btn flex min-h-[160px] items-center justify-between gap-4 rounded-3xl border-2 border-tea-500 bg-gradient-to-br from-emerald-50 to-tea-100/60 p-5 text-left shadow-sm"><span className="flex min-w-0 items-center gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-tea-700 text-white"><Brain className="h-7 w-7" /></span><span><span className="block text-base font-black text-tea-800">{t.mindGamesDesc}</span><span className="mt-1 block text-2xl font-black text-tea-950">{t.mindGames}</span><span className="mt-1 block text-base font-bold text-tea-800">{t.activities}</span></span></span><ChevronRight className="h-6 w-6 shrink-0 text-tea-800" /></button>
        <button onClick={() => { audioManager.playTap(); setActiveView('routine'); }} className="tactile-btn flex min-h-[160px] items-center justify-between gap-4 rounded-3xl border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-orange-100/60 p-5 text-left shadow-sm"><span className="flex min-w-0 items-center gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white"><Pill className="h-7 w-7" /></span><span><span className="block text-base font-black text-amber-800">{t.dailyCareDesc}</span><span className="mt-1 block text-2xl font-black text-amber-950">{t.dailyCare}</span><span className="mt-1 block text-base font-bold text-amber-800">{t.checklist}</span></span></span><ChevronRight className="h-6 w-6 shrink-0 text-amber-800" /></button>
      </div></section>

      <section aria-labelledby="more-title"><h2 id="more-title" className="mb-3 text-xl font-black text-tea-950">{t.otherActivities}</h2><div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <button onClick={() => { audioManager.playTap(); setGameReturnView('dashboard'); setSelectedGame('reminiscence_album'); setActiveView('game_play'); }} className="tactile-btn flex min-h-[128px] items-center justify-between gap-4 rounded-3xl border-2 border-rose-400 bg-gradient-to-br from-rose-50 to-pink-100/60 p-5 text-left shadow-sm"><span className="flex min-w-0 items-center gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white"><Heart className="h-7 w-7" /></span><span><span className="block text-base font-black text-rose-800">{t.photoLaneDesc}</span><span className="mt-1 block text-2xl font-black text-rose-950">{t.photoLane}</span></span></span><ChevronRight className="h-6 w-6 shrink-0 text-rose-800" /></button>
        <HydrationTracker />
      </div></section>
    </div>
  );
};
