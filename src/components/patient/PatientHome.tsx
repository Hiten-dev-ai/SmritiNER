import React, { useEffect, useState } from 'react';
import {
  ChevronRight,
  Droplets,
  Flower2,
  Leaf,
  Mic,
  PhoneCall,
  Pill,
  Play,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { getLocalDateKey } from '../../services/localDate';
import {
  journeyDefinitions,
  localizedGame,
  type JourneyGameType,
} from '../../services/journeyEngine';
import { getLayoutForStage, type MahjongSavedGame } from '../../services/mahjongEngine';
import { voiceService } from '../../services/voiceService';
import type { JourneyGameSession, ReminiscencePhoto, ReminderItem, VoiceActionId } from '../../types';
import { AlertCoordinator } from '../alerts/AlertCoordinator';
import { GameSelection } from '../games/GameSelection';
import { JourneyGame } from '../games/JourneyGame';
import { VoiceAssistModal } from '../voice/VoiceAssistModal';

type View = 'home' | 'games' | 'game' | 'routine';

const patientCopy = {
  English: {
    journey: 'Continue your Memory Journey',
    fresh: 'A fresh, familiar game is ready. Take your time and enjoy each round.',
    play: 'Play',
    todayGames: "Today’s three fresh games",
    balanced: 'A balanced 6–10 minute memory journey',
    allGames: 'All 8 games',
    garden: 'Garden flowers',
    todayJourney: "Today’s journey",
    routine: 'Routine & medicines',
    hydration: 'Hydration',
    addWater: 'Add water',
    family: 'Family / SOS',
    loading: 'Loading your fresh journey…',
    support: 'Engagement support only—not a medical diagnosis.',
    complete: 'Complete',
    home: 'Home',
    continueMahjong: 'Continue Saved Mahjong Board',
  },
  Hindi: {
    journey: 'अपनी स्मृति यात्रा जारी रखें',
    fresh: 'एक नया परिचित खेल तैयार है। आराम से हर दौर का आनंद लें।',
    play: 'खेलें',
    todayGames: 'आज के तीन नए खेल',
    balanced: '6–10 मिनट की संतुलित स्मृति यात्रा',
    allGames: 'सभी 8 खेल',
    garden: 'स्मृति बगिया',
    todayJourney: 'आज की यात्रा',
    routine: 'दिनचर्या और दवाइयाँ',
    hydration: 'पानी',
    addWater: 'पानी जोड़ें',
    family: 'परिवार / SOS',
    loading: 'आपकी नई यात्रा तैयार हो रही है…',
    support: 'केवल सहभागिता सहायता—चिकित्सीय निदान नहीं।',
    complete: 'पूरा',
    home: 'मुख्य पृष्ठ',
    continueMahjong: 'सहेजा गया माहजोंग बोर्ड जारी रखें',
  },
  Assamese: {
    journey: 'আপোনাৰ স্মৃতি পথ আগবঢ়াওক',
    fresh: 'এটা নতুন চিনাকি খেল সাজু। সময় লৈ প্ৰতিটো পৰ্ব উপভোগ কৰক।',
    play: 'খেলক',
    todayGames: 'আজিৰ তিনিটা নতুন খেল',
    balanced: '৬–১০ মিনিটৰ সুষম স্মৃতি পথ',
    allGames: 'সকলো ৮টা খেল',
    garden: 'স্মৃতি বাগিচা',
    todayJourney: 'আজিৰ পথ',
    routine: 'নিয়ম আৰু ঔষধ',
    hydration: 'পানী',
    addWater: 'পানী যোগ কৰক',
    family: 'পৰিয়াল / SOS',
    loading: 'আপোনাৰ নতুন পথ সাজু হৈছে…',
    support: 'কেৱল অংশগ্ৰহণ সহায়—চিকিৎসা নিৰ্ণয় নহয়।',
    complete: 'সম্পূৰ্ণ',
    home: 'মূল পৃষ্ঠা',
    continueMahjong: 'সংৰক্ষিত মাহজং খেল আগবঢ়াওক',
  },
};

export const PatientHome: React.FC = () => {
  const {
    currentPatient,
    isOnline,
    isOfflineSession,
    selectedLanguage,
    gameProgress,
    refreshGameProgress,
    setLocalGameProgress,
    t,
  } = useApp();

  const [view, setView] = useState<View>('home');
  const [activeGameId, setActiveGameId] = useState<JourneyGameType | null>(null);
  const [completedToday, setCompletedToday] = useState<JourneyGameSession[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [hydration, setHydration] = useState<number>(0);
  const [photos, setPhotos] = useState<ReminiscencePhoto[]>([]);
  const [gardenFlowers, setGardenFlowers] = useState<number>(0);
  const [mahjongSave, setMahjongSave] = useState<MahjongSavedGame | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);

  const today = getLocalDateKey();
  const copy = patientCopy[selectedLanguage] || patientCopy.English;

  useEffect(() => {
    if (!currentPatient) return;
    let cancelled = false;

    const loadData = async () => {
      try {
        const [sessionsRes, remindersRes, hydrationRes, photosRes, progressRes, mahjongRes] =
          await Promise.all([
            api.listSessions(currentPatient.id).catch(() => ({ sessions: [] })),
            api.listCollection<ReminderItem>(currentPatient.id, 'reminders').catch(() => ({ items: [] })),
            api.listCollection<{ date: string; glassesDrunk: number }>(currentPatient.id, 'hydration').catch(() => ({ items: [] })),
            api.listCollection<ReminiscencePhoto>(currentPatient.id, 'photos').catch(() => ({ items: [] })),
            api.getGameProgress(currentPatient.id).catch(() => ({ progress: [] })),
            api.getMahjongSave(currentPatient.id).catch(() => ({ save: null })),
          ]);

        if (cancelled) return;

        const sessions = sessionsRes.sessions || [];
        const todaySessions = sessions.filter(
          (s) => s.completedAt && s.completedAt.slice(0, 10) === today
        );
        setCompletedToday(todaySessions);
        setGardenFlowers(sessions.filter((s) => s.completionStatus === 'completed').length);
        setReminders(remindersRes.items || []);

        const todayHydration = hydrationRes.items?.find((item) => item.date === today);
        setHydration(todayHydration?.glassesDrunk || 0);
        setPhotos(photosRes.items || []);
        setMahjongSave(mahjongRes.save || null);

        if (progressRes.progress?.length) {
          setLocalGameProgress(progressRes.progress);
        }
      } catch {
        // Fallback
      }
    };

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [currentPatient, today, setLocalGameProgress]);

  if (!currentPatient) return null;

  // 3 Daily Rotating Recommended Games
  const dayIndex = new Date(today).getDate() % journeyDefinitions.length;
  const dailyGames = [
    journeyDefinitions[dayIndex % journeyDefinitions.length],
    journeyDefinitions[(dayIndex + 2) % journeyDefinitions.length],
    journeyDefinitions[(dayIndex + 4) % journeyDefinitions.length],
  ];

  const recommended =
    dailyGames.find((g) => !completedToday.some((s) => s.gameType === g.id)) || dailyGames[0];
  const recommendedText = localizedGame(recommended.id, selectedLanguage);

  const launch = (gameId: JourneyGameType) => {
    setActiveGameId(gameId);
    setView('game');
  };

  const handleVoiceCommand = (actionId: VoiceActionId) => {
    switch (actionId) {
      case 'home':
        setView('home');
        break;
      case 'start_game':
        launch(recommended.id as JourneyGameType);
        break;
      case 'open_routine':
        setView('routine');
        break;
      case 'drink_water':
        void updateHydration(hydration + 1);
        break;
      case 'call_family':
        void handleCallFamily();
        break;
      case 'repeat':
        voiceService.speak(`${copy.journey}. ${recommendedText.title}. ${copy.fresh}`, selectedLanguage);
        break;
      case 'back':
        setView('home');
        break;
    }
  };

  const handleCallFamily = async () => {
    if (!currentPatient) return;
    try {
      await api.triggerSos(currentPatient.id, {
        title: 'Emergency SOS / Family Call Requested',
        notes: `Patient initiated call to ${currentPatient.emergencyContactName} (${currentPatient.emergencyContactPhone}).`,
      });
    } catch {
      // offline fallback
    }
    window.location.href = `tel:${currentPatient.emergencyContactPhone.replace(/\s/g, '')}`;
  };

  const updateHydration = async (value: number) => {
    const next = Math.max(0, Math.min(8, value));
    setHydration(next);
    await api
      .saveCollectionItem(currentPatient.id, 'hydration', {
        id: `${currentPatient.id}-${today}`,
        patientId: currentPatient.id,
        date: today,
        glassesDrunk: next,
        targetGlasses: 6,
      })
      .catch(() => undefined);
  };

  const mahjongTilesRemaining = mahjongSave?.tiles?.filter((t) => t.active).length || 0;
  const mahjongSavedLayout = mahjongSave ? getLayoutForStage(mahjongSave.stage) : null;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-7 relative pb-20">
      {/* ------------------------------------------------------------- */}
      {/* 1. APPLICATION-LEVEL ALERT COORDINATOR                         */}
      {/* ------------------------------------------------------------- */}
      <AlertCoordinator onOpenRoutine={() => setView('routine')} />

      {/* ------------------------------------------------------------- */}
      {/* 2. PUSH-TO-TALK VOICE ASSIST MODAL                            */}
      {/* ------------------------------------------------------------- */}
      <VoiceAssistModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onExecuteCommand={handleVoiceCommand}
      />

      {/* Offline Banner */}
      {(isOfflineSession || !isOnline) && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 font-bold text-amber-950">
          {t.offlineSaved}
        </div>
      )}

      {/* CONTINUATION HERO CARD FOR SAVED MAHJONG */}
      {mahjongSave && mahjongTilesRemaining > 0 && mahjongSavedLayout && (
        <section className="relative overflow-hidden rounded-[2rem] border-2 border-teal-300 bg-gradient-to-br from-teal-950 via-teal-900 to-emerald-800 p-5 text-white shadow-xl sm:p-7 animate-fadeIn">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-3xl font-black text-teal-950 shadow-md">
                🀄
              </span>
              <div>
                <span className="inline-block rounded-full bg-teal-800/80 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-teal-200">
                  Game in Progress · Stage {mahjongSave.stage}
                </span>
                <h2 className="mt-1 text-2xl font-black">
                  {mahjongSavedLayout.name[selectedLanguage] || mahjongSavedLayout.name.English}
                </h2>
                <p className="text-sm font-semibold text-teal-100">
                  {mahjongTilesRemaining} tiles remaining · {mahjongSave.pairsCleared} pairs cleared
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => launch('mahjong_memory')}
                className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-assamGold-300 px-6 text-lg font-black text-teal-950 shadow-lg hover:bg-amber-400 transition"
              >
                <Play className="h-5 w-5" />
                Continue Board
              </button>
            </div>
          </div>
        </section>
      )}

      {/* STANDARD HERO SECTION */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-tea-950 via-tea-800 to-emerald-700 p-5 text-white shadow-xl sm:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-assamGold-300/20 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-assamGold-300">
                {t.welcome}, {currentPatient.name}
              </p>
              <button
                onClick={() =>
                  voiceService.speak(
                    `${t.welcome} ${currentPatient.name}. ${copy.journey}. ${recommendedText.title}. ${copy.fresh}`,
                    selectedLanguage
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-assamGold-300 transition"
                aria-label={t.listen}
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>

            <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">{copy.journey}</h1>
            <p className="mt-3 text-lg font-semibold text-emerald-50">{copy.fresh}</p>
            <button
              onClick={() => launch(recommended.id as JourneyGameType)}
              className="mt-6 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-assamGold-300 px-6 text-xl font-black text-tea-950 shadow-lg hover:bg-amber-400 transition sm:w-auto"
            >
              <Sparkles className="h-7 w-7" />
              {copy.play} {recommendedText.title}
              <ChevronRight />
            </button>
          </div>

          <div className="relative grid min-w-64 grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-center">
              <Flower2 className="mx-auto h-8 w-8 text-assamGold-300" />
              <span className="mt-2 block text-3xl font-black">{gardenFlowers}</span>
              <span className="text-sm font-bold text-emerald-100">{copy.garden}</span>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-center">
              <Leaf className="mx-auto h-8 w-8 text-emerald-200" />
              <span className="mt-2 block text-3xl font-black">{completedToday.length}/3</span>
              <span className="text-sm font-bold text-emerald-100">{copy.todayJourney}</span>
            </div>
          </div>
        </div>
      </section>

      {/* TODAY'S GAMES */}
      <section className="rounded-[1.75rem] border-2 border-tea-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-tea-950">{copy.todayGames}</h2>
            <p className="text-base font-semibold text-stone-600">{copy.balanced}</p>
          </div>
          <button
            onClick={() => setView('games')}
            className="min-h-12 shrink-0 rounded-xl bg-tea-100 px-4 font-black text-tea-900 hover:bg-tea-200 transition"
          >
            {copy.allGames}
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {dailyGames.map((game, index) => {
            const done = completedToday.some((session) => session.gameType === game.id);
            const localized = localizedGame(game.id, selectedLanguage);
            const prog = gameProgress[game.id];
            const stage = prog?.recommendedStage || prog?.unlockedStage || 1;

            return (
              <button
                key={game.id}
                onClick={() => launch(game.id as JourneyGameType)}
                className={`flex min-h-28 items-center gap-3 rounded-2xl border-2 p-4 text-left transition hover:shadow-md ${
                  done
                    ? 'border-emerald-300 bg-emerald-50/70'
                    : 'border-stone-200 bg-stone-50/80 hover:bg-white'
                }`}
              >
                <span className="text-4xl">{game.emoji}</span>
                <span>
                  <span className="block text-sm font-black text-stone-500">
                    {done ? `✓ ${copy.complete}` : `${copy.todayJourney} ${index + 1}`}
                  </span>
                  <span className="block text-lg font-black text-stone-950">
                    {localized.title}
                  </span>
                  <span className="block text-sm font-bold text-tea-800">
                    Stage {stage} of 12
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ROUTINE, HYDRATION, AND EMERGENCY SOS */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Routine Card with Listen */}
        <div className="flex flex-col justify-between rounded-3xl border-2 border-rose-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setView('routine')}
              className="flex items-center gap-4 text-left flex-1"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-800">
                <Pill className="h-7 w-7" />
              </span>
              <div>
                <span className="text-xl font-black block">{copy.routine}</span>
                <span className="mt-0.5 block font-semibold text-stone-600">
                  {reminders.filter((item) => item.completedDates?.includes(today)).length}/
                  {reminders.length} {t.done}
                </span>
              </div>
            </button>
            <button
              onClick={() =>
                voiceService.speak(
                  `${copy.routine}. ${
                    reminders.filter((item) => item.completedDates?.includes(today)).length
                  } of ${reminders.length} items completed today.`,
                  selectedLanguage
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
              aria-label={t.listen}
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Hydration Card with Listen */}
        <div className="rounded-3xl border-2 border-sky-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <Droplets className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-black">{copy.hydration}</h2>
                <p className="font-bold text-stone-600">
                  {hydration}/6 {t.glasses}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                voiceService.speak(
                  `${copy.hydration}. ${hydration} of 6 glasses logged today.`,
                  selectedLanguage
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
              aria-label={t.listen}
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => void updateHydration(hydration - 1)}
              className="h-12 flex-1 rounded-xl border border-stone-300 text-xl font-black hover:bg-stone-50"
            >
              −
            </button>
            <button
              onClick={() => void updateHydration(hydration + 1)}
              className="h-12 flex-1 rounded-xl bg-sky-600 text-xl font-black text-white hover:bg-sky-700"
            >
              + {copy.addWater}
            </button>
          </div>
        </div>

        {/* Emergency SOS Card */}
        <button
          onClick={() => void handleCallFamily()}
          className="flex min-h-32 items-center gap-4 rounded-3xl bg-rose-700 p-5 text-white shadow-sm hover:bg-rose-800 transition text-left"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shrink-0">
            <PhoneCall className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-black uppercase text-rose-100">{copy.family}</span>
            <span className="block text-xl font-black truncate">{currentPatient.emergencyContactName}</span>
            <span className="font-semibold">{currentPatient.emergencyContactPhone}</span>
          </div>
        </button>
      </section>

      {/* Routine Sheet View */}
      {view === 'routine' && (
        <section className="fixed inset-0 z-50 overflow-y-auto bg-[#f8fbf9] p-4">
          <div className="mx-auto max-w-2xl">
            <button
              onClick={() => setView('home')}
              className="mb-4 min-h-12 rounded-xl border bg-white px-4 font-black"
            >
              ← {copy.home}
            </button>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-black">{t.todaysRoutine}</h1>
              <button
                onClick={() =>
                  voiceService.speak(
                    `${t.todaysRoutine}. ${reminders.map((r) => `${r.title} at ${r.time}`).join('. ')}`,
                    selectedLanguage
                  )
                }
                className="flex h-11 w-11 items-center justify-center rounded-xl border bg-white text-stone-700"
                aria-label={t.listen}
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {reminders.map((reminder) => {
                const done = reminder.completedDates?.includes(today);
                return (
                  <button
                    key={String(reminder.id)}
                    onClick={async () => {
                      const reminderId = reminder.id;
                      if (!reminderId) return;
                      if (!done) {
                        await api.completeReminder(currentPatient.id, reminderId, today);
                      }
                      const updated = {
                        ...reminder,
                        completedDates: done
                          ? reminder.completedDates?.filter((date) => date !== today)
                          : [...(reminder.completedDates || []), today],
                      };
                      setReminders((values) =>
                        values.map((entry) => (entry.id === reminder.id ? updated : entry))
                      );
                    }}
                    className={`flex min-h-20 w-full items-center gap-4 rounded-2xl border-2 p-4 text-left ${
                      done ? 'border-emerald-300 bg-emerald-50' : 'border-stone-200 bg-white'
                    }`}
                  >
                    <span className="text-2xl">
                      {reminder.category === 'medicine' ? '💊' : '🌤️'}
                    </span>
                    <span className="flex-1">
                      <span className="block text-lg font-black">{reminder.title}</span>
                      <span className="font-bold text-stone-600">{reminder.time}</span>
                    </span>
                    <span className="font-black">{done ? `${t.done} ✓` : t.markDone}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Floating Voice Assist Button */}
      <button
        onClick={() => setShowVoiceModal(true)}
        className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-teal-800 text-white shadow-2xl hover:bg-teal-900 transition hover:scale-105 border-2 border-white animate-bounce"
        aria-label={t.voiceAssist}
      >
        <Mic className="h-8 w-8" />
      </button>

      {/* Render Games Subviews */}
      {view === 'games' && (
        <GameSelection
          onSelectGame={(id) => launch(id)}
          sessions={completedToday}
        />
      )}

      {view === 'game' && activeGameId && (
        <JourneyGame
          gameType={activeGameId}
          patientId={currentPatient.id}
          stage={
            gameProgress[activeGameId]?.recommendedStage ||
            gameProgress[activeGameId]?.unlockedStage ||
            1
          }
          recentVariantIds={[]}
          photos={photos}
          onBack={() => {
            setView('home');
            setActiveGameId(null);
            void refreshGameProgress();
          }}
          onComplete={async (session) => {
            await api.addSession(currentPatient.id, session);
            void refreshGameProgress();
          }}
        />
      )}
    </div>
  );
};
