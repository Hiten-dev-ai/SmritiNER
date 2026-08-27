import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Brain, ChevronRight, Clock3, Heart, PhoneCall, Pill, ShieldAlert, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import { db } from '../../services/db';
import type { GameType } from '../../types';
import { ChaiHarvestGame } from '../games/ChaiHarvestGame';
import { DailyLifeSequenceGame } from '../games/DailyLifeSequenceGame';
import { GameSelection } from '../games/GameSelection';
import { MajuliMemoryGame } from '../games/MajuliMemoryGame';
import { ReminiscenceAlbumGame } from '../games/ReminiscenceAlbumGame';
import { WeavePatternGame } from '../games/WeavePatternGame';
import { DailyRoutineView } from './DailyRoutineView';
import { HydrationTracker } from './HydrationTracker';

type ActiveView = 'dashboard' | 'games_menu' | 'routine' | 'game_play';

const timeToMinutes = (time: string) => {
  const value = time.trim();
  const twelveHour = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHour) {
    let hours = Number(twelveHour[1]) % 12;
    if (twelveHour[3].toUpperCase() === 'PM') hours += 12;
    return hours * 60 + Number(twelveHour[2]);
  }
  const twentyFourHour = value.match(/^(\d{1,2}):(\d{2})$/);
  return twentyFourHour ? Number(twentyFourHour[1]) * 60 + Number(twentyFourHour[2]) : 24 * 60;
};

export const PatientHome: React.FC = () => {
  const { currentPatient, selectedLanguage, t } = useApp();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [gameReturnView, setGameReturnView] = useState<'dashboard' | 'games_menu'>('games_menu');
  const reminders = useLiveQuery(() => db.reminders.toArray());
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeView, selectedGame]);

  const nextReminder = useMemo(
    () => (reminders ?? [])
      .filter((reminder) => !reminder.completedDates.includes(today))
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))[0],
    [reminders, today]
  );
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const locale = selectedLanguage === 'Hindi' ? 'hi-IN' : selectedLanguage === 'Assamese' ? 'as-IN' : 'en-IN';

  const handleLaunchGame = (game: GameType) => {
    setSelectedGame(game);
    setGameReturnView('games_menu');
    setActiveView('game_play');
  };

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

  if (activeView === 'games_menu') {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <button
          onClick={() => { audioManager.playTap(); setActiveView('dashboard'); }}
          className="tactile-btn elder-touch mb-6 flex items-center gap-2 text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 px-4 rounded-xl text-sm font-bold shadow-sm"
        >
          ← {t.home}
        </button>
        <GameSelection onSelectGame={handleLaunchGame} />
      </div>
    );
  }

  if (activeView === 'routine') return <DailyRoutineView onBack={() => setActiveView('dashboard')} />;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 animate-fade-in space-y-6 min-w-0">
      <section className="bg-gradient-to-r from-tea-800 to-tea-950 rounded-3xl p-6 text-white shadow-sm flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-assamGold-300 text-xs font-bold mb-1">
            <Sun className="w-4 h-4" />
            <span>{new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight break-words">{t.welcome}, {currentPatient?.name || 'Bhaben Barua'}</h1>
          <span className="inline-flex mt-2 rounded-full bg-white/15 border border-white/30 px-2.5 py-1 text-[11px] font-bold">{t.demoProfile}</span>
        </div>
        <span className="hidden sm:block shrink-0 text-xs font-semibold bg-tea-950/60 px-3 py-2 rounded-xl border border-tea-700 max-w-56 text-right">
          {currentPatient?.villageOrDistrict || 'Jorhat'}, {currentPatient?.state || 'Assam'}
        </span>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button onClick={() => { audioManager.playTap(); setActiveView('games_menu'); }} className="tactile-btn group rounded-3xl p-6 bg-gradient-to-b from-emerald-50 to-tea-100/60 border-2 border-tea-500 text-left shadow-sm flex flex-col justify-between min-h-52">
          <span><span className="w-14 h-14 rounded-2xl bg-tea-700 text-white flex items-center justify-center mb-4"><Brain className="w-7 h-7" /></span><span className="text-xs font-black uppercase text-tea-800 tracking-wider block">{t.mindGamesDesc}</span><span className="text-2xl font-black text-tea-950 mt-1 block">{t.mindGames}</span></span>
          <span className="mt-6 pt-3 border-t border-tea-200 flex items-center justify-between text-xs font-black text-tea-800"><span>{t.activities}</span><ChevronRight className="w-5 h-5" /></span>
        </button>
        <button onClick={() => { audioManager.playTap(); setActiveView('routine'); }} className="tactile-btn group rounded-3xl p-6 bg-gradient-to-b from-amber-50 to-orange-100/60 border-2 border-amber-500 text-left shadow-sm flex flex-col justify-between min-h-52">
          <span><span className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-4"><Pill className="w-7 h-7" /></span><span className="text-xs font-black uppercase text-amber-800 tracking-wider block">{t.dailyCareDesc}</span><span className="text-2xl font-black text-amber-950 mt-1 block">{t.dailyCare}</span></span>
          <span className="mt-6 pt-3 border-t border-amber-200 flex items-center justify-between text-xs font-black text-amber-800"><span>{t.checklist}</span><ChevronRight className="w-5 h-5" /></span>
        </button>
        <button onClick={() => { audioManager.playTap(); setGameReturnView('dashboard'); setSelectedGame('reminiscence_album'); setActiveView('game_play'); }} className="tactile-btn group rounded-3xl p-6 bg-gradient-to-b from-rose-50 to-pink-100/60 border-2 border-rose-400 text-left shadow-sm flex flex-col justify-between min-h-52">
          <span><span className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center mb-4"><Heart className="w-7 h-7" /></span><span className="text-xs font-black uppercase text-rose-800 tracking-wider block">{t.photoLaneDesc}</span><span className="text-2xl font-black text-rose-950 mt-1 block">{t.photoLane}</span></span>
          <span className="mt-6 pt-3 border-t border-rose-200 flex items-center justify-between text-xs font-black text-rose-800"><span>{t.openPhotos}</span><ChevronRight className="w-5 h-5" /></span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
        <section className="rounded-3xl bg-white border-2 border-brahma-200 p-5 sm:p-6 shadow-sm" aria-labelledby="up-next-title">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <span className="w-12 h-12 shrink-0 rounded-2xl bg-brahma-100 text-brahma-800 flex items-center justify-center"><Clock3 className="w-6 h-6" /></span>
              <div className="min-w-0">
                <h2 id="up-next-title" className="text-lg font-black text-stone-950">{t.upNext}</h2>
                {nextReminder ? <><p className="text-xl font-black text-stone-900 mt-1 break-words">{nextReminder.title}</p><p className="text-sm font-bold text-stone-600 mt-1">{nextReminder.time} · <span className={timeToMinutes(nextReminder.time) < nowMinutes ? 'text-rose-700' : 'text-tea-800'}>{timeToMinutes(nextReminder.time) < nowMinutes ? t.overdue : t.upcoming}</span></p></> : <p className="text-sm font-semibold text-stone-600 mt-1">{t.noUpcoming}</p>}
              </div>
            </div>
            <button onClick={() => setActiveView('routine')} className="tactile-btn min-h-12 shrink-0 rounded-xl bg-brahma-600 text-white px-4 font-bold text-sm">{t.viewRoutine}</button>
          </div>
        </section>

        <a href={`tel:${(currentPatient?.emergencyContactPhone || '').replace(/\s/g, '')}`} className="tactile-btn min-h-24 md:min-w-64 rounded-3xl bg-rose-600 hover:bg-rose-700 text-white border-2 border-rose-700 p-5 flex items-center gap-4 shadow-sm" aria-label={`${t.callFamily}: ${currentPatient?.emergencyContactName || ''}`}>
          <span className="w-12 h-12 shrink-0 rounded-2xl bg-white/20 flex items-center justify-center"><PhoneCall className="w-6 h-6" /></span>
          <span><span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide"><ShieldAlert className="w-4 h-4" /> {t.emergencySos}</span><span className="block text-xl font-black mt-1">{t.callFamily}</span><span className="block text-xs font-semibold text-rose-100 mt-0.5">{currentPatient?.emergencyContactPhone}</span></span>
        </a>
      </div>

      <HydrationTracker />
    </div>
  );
};
