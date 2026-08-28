/* oxlint-disable react/purity -- seeded procedural rounds intentionally sample time and shuffled content at session boundaries */
import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Eye,
  Flower2,
  HeartHandshake,
  HelpCircle,
  Leaf,
  Play,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { GameRoundResult, JourneyGameSession, ReminiscencePhoto } from '../../types';
import {
  chooseFreshItems,
  domainForGame,
  journeyItems,
  localizedGame,
  profileForStage,
  routines,
  shuffle,
  summarizeRounds,
  type JourneyGameType,
  type JourneyItem,
} from '../../services/journeyEngine';
import { audioManager } from '../../services/audioManager';
import { MahjongSolitaireGame } from './MahjongSolitaireGame';
import { StagePickerModal } from './StagePickerModal';

interface JourneyGameProps {
  gameType: JourneyGameType;
  stage: number;
  recentVariantIds: string[];
  patientId: string;
  photos?: ReminiscencePhoto[];
  onBack: () => void;
  onComplete: (session: JourneyGameSession) => Promise<void>;
}

type Phase = 'ready' | 'preview' | 'answer' | 'feedback' | 'result';

interface RoundData {
  id: string;
  items: JourneyItem[];
  answerPool: JourneyItem[];
  correctId?: string;
  sequence?: JourneyItem[];
  routineTitle?: string;
  pattern?: JourneyItem[];
  missingIndex?: number;
  imageUrl?: string;
  memoryPrompt?: string;
}

const languageKey = { English: 'English', Hindi: 'Hindi', Assamese: 'Assamese' } as const;

const gameInstructions: Record<JourneyGameType, Record<'English' | 'Hindi' | 'Assamese', string>> = {
  majuli_memory: {
    English: 'Flip two cards and find every matching pair.',
    Hindi: 'दो कार्ड पलटें और सभी मिलते जोड़े खोजें।',
    Assamese: 'দুখন কাৰ্ড ওলোটাই সকলো মিল থকা জোৰা বিচাৰক।',
  },
  tea_tray_recall: {
    English: 'Watch the tea tray, then tap the items in the same order.',
    Hindi: 'चाय की ट्रे देखें, फिर उसी क्रम में चीज़ें दबाएँ।',
    Assamese: 'চাহৰ ট্ৰেখন চাওক, তাৰ পাছত একে ক্ৰমত বস্তুবোৰ টিপক।',
  },
  market_list_recall: {
    English: 'Remember the market list, then choose every item you saw.',
    Hindi: 'बाज़ार की सूची याद रखें, फिर देखी हुई चीज़ें चुनें।',
    Assamese: 'বজাৰৰ তালিকাখন মনত ৰাখক, তাৰ পাছত দেখা বস্তুবোৰ বাছক।',
  },
  missing_object: {
    English: 'Look carefully and choose the object that disappears.',
    Hindi: 'ध्यान से देखें और गायब हुई चीज़ चुनें।',
    Assamese: 'ভালদৰে চাই নোহোৱা বস্তুটো বাছক।',
  },
  daily_steps: {
    English: 'Tap the familiar routine steps in the order they happen.',
    Hindi: 'परिचित दिनचर्या के चरण सही क्रम में दबाएँ।',
    Assamese: 'চিনাকি দৈনিক কামৰ খোজবোৰ সঠিক ক্ৰমত টিপক।',
  },
  weave_pattern: {
    English: 'Choose the motif that completes the textile rhythm.',
    Hindi: 'कपड़े के क्रम को पूरा करने वाला चिन्ह चुनें।',
    Assamese: 'বস্ত্ৰৰ ক্ৰম সম্পূৰ্ণ কৰা নক্সাটো বাছক।',
  },
  memory_lane: {
    English: 'Enjoy a familiar memory and answer one gentle question.',
    Hindi: 'परिचित याद देखें और एक सरल प्रश्न का उत्तर दें।',
    Assamese: 'চিনাকি স্মৃতি এটা চাই এটা সহজ প্ৰশ্নৰ উত্তৰ দিয়ক।',
  },
  mahjong_memory: {
    English: 'Match illustrated regional tiles inspired by Mahjong.',
    Hindi: 'सचित्र असमिया टाइलें मिलाएँ।',
    Assamese: 'চিত্ৰযুক্ত আঞ্চলিক টাইলস মিলাওক।',
  },
};

const patternForRound = (load: number, round: number) => {
  const motifs = shuffle(journeyItems.slice(0, 18)).slice(0, 3);
  const family = round % 5;
  const length = Math.min(8, load + 2);
  const sequence = Array.from({ length }, (_, index) =>
    family === 0
      ? motifs[index % 2]
      : family === 1
      ? motifs[Math.floor(index / 2) % 2]
      : family === 2
      ? motifs[index % 3]
      : family === 3
      ? motifs[index < Math.ceil(length / 2) ? index % 2 : (length - index - 1) % 2]
      : motifs[(index + Math.floor(index / 3)) % 3]
  );
  const missingIndex = length - 1;
  const correct = sequence[missingIndex];
  return {
    sequence,
    missingIndex,
    correct,
    options: shuffle([
      correct,
      ...motifs.filter((motif) => motif.id !== correct.id),
      ...journeyItems.filter((item) => !motifs.includes(item)).slice(0, 1),
    ]).slice(0, 4),
  };
};

export const JourneyGame: React.FC<JourneyGameProps> = ({
  gameType,
  stage: initialStage,
  recentVariantIds,
  patientId,
  photos = [],
  onBack,
  onComplete,
}) => {
  const { selectedLanguage, readAloud, speechSupported, setGameActive, gameProgress, t } = useApp();
  const language = languageKey[selectedLanguage];
  const definition = localizedGame(gameType, language);

  const [activeStage, setActiveStage] = useState(initialStage || 1);
  const [stageSource, setStageSource] = useState<'recommended' | 'manual'>('recommended');
  const [stagePickerOpen, setStagePickerOpen] = useState(false);

  const currentProgress = gameProgress[gameType];
  const unlockedStage = currentProgress?.unlockedStage || 1;
  const recommendedStage = currentProgress?.recommendedStage || 1;

  if (gameType === 'mahjong_memory') {
    return (
      <MahjongSolitaireGame
        initialStage={activeStage}
        onBack={onBack}
        onComplete={onComplete}
      />
    );
  }

  const profile = profileForStage(gameType, activeStage);
  const [phase, setPhase] = useState<Phase>('ready');
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [roundResults, setRoundResults] = useState<GameRoundResult[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);
  const [hintText, setHintText] = useState('');
  const [feedbackCorrect, setFeedbackCorrect] = useState(true);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [matchStreak, setMatchStreak] = useState(0);
  const [sequenceAnswer, setSequenceAnswer] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [finalSession, setFinalSession] = useState<JourneyGameSession | null>(null);
  const startedAtRef = useRef(new Date().toISOString());
  const roundStartedRef = useRef(Date.now());
  const previewTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setGameActive(true);
    return () => setGameActive(false);
  }, [setGameActive]);

  useEffect(() => {
    return () => {
      if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && previewTimerRef.current) {
        window.clearTimeout(previewTimerRef.current);
        previewTimerRef.current = null;
      } else if (!document.hidden && phase === 'preview' && !previewTimerRef.current) {
        previewTimerRef.current = window.setTimeout(
          () => setPhase('answer'),
          profile.previewDurationMs
        );
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [phase, profile.previewDurationMs]);

  const makeRound = (index: number): RoundData => {
    const variantBase = `${gameType}:${activeStage}:${index}`;
    if (gameType === 'majuli_memory') {
      const items = chooseFreshItems(profile.memoryLoad, recentVariantIds);
      return {
        id: `${variantBase}|${items.map((entry) => entry.id).sort().join(',')}`,
        items,
        answerPool: shuffle(items.flatMap((entry) => [entry, entry])),
      };
    }
    if (gameType === 'tea_tray_recall') {
      const teaPool = journeyItems.filter((entry) =>
        ['tea', 'cup', 'kettle', 'biscuit', 'flower', 'spoon', 'milk', 'gamosa', 'lamp'].includes(
          entry.id
        )
      );
      const sequence = chooseFreshItems(profile.memoryLoad, recentVariantIds, teaPool);
      return {
        id: `${variantBase}|${sequence.map((entry) => entry.id).sort().join(',')}`,
        items: sequence,
        sequence,
        answerPool: shuffle([
          ...sequence,
          ...chooseFreshItems(3, sequence.map((entry) => entry.id), teaPool),
        ]).slice(0, Math.max(6, sequence.length + 2)),
      };
    }
    if (gameType === 'market_list_recall') {
      const marketPool = journeyItems.filter((entry) =>
        ['rice', 'banana', 'fish', 'tomato', 'soap', 'tea', 'milk', 'medicine', 'biscuit', 'towel', 'shirt', 'umbrella'].includes(
          entry.id
        )
      );
      const items = chooseFreshItems(profile.memoryLoad, recentVariantIds, marketPool);
      return {
        id: `${variantBase}|${items.map((entry) => entry.id).sort().join(',')}`,
        items,
        answerPool: shuffle([
          ...items,
          ...chooseFreshItems(profile.optionCount, items.map((entry) => entry.id), marketPool),
        ]),
      };
    }
    if (gameType === 'missing_object') {
      const items = chooseFreshItems(profile.memoryLoad + 1, recentVariantIds);
      const missing = items[index % items.length];
      return {
        id: `${variantBase}|${items.map((entry) => entry.id).sort().join(',')}`,
        items,
        correctId: missing.id,
        answerPool: shuffle([
          missing,
          ...chooseFreshItems(profile.optionCount - 1, items.map((entry) => entry.id)),
        ]),
      };
    }
    if (gameType === 'daily_steps') {
      const routine = routines[(index + activeStage - 1) % routines.length];
      const steps = routine.steps.slice(0, profile.memoryLoad);
      return {
        id: `${variantBase}|routine-${routine.id}`,
        items: steps,
        sequence: steps,
        answerPool: shuffle(steps),
        routineTitle: routine.title[language],
      };
    }
    if (gameType === 'weave_pattern') {
      const pattern = patternForRound(profile.memoryLoad, index + activeStage);
      return {
        id: `${variantBase}|${pattern.sequence.map((entry) => entry.id).join(',')}`,
        items: pattern.sequence,
        pattern: pattern.sequence,
        missingIndex: pattern.missingIndex,
        correctId: pattern.correct.id,
        answerPool: pattern.options,
      };
    }
    if (photos.length) {
      const freshPhotos = photos.filter(
        (photo) => !recentVariantIds.some((id) => id.includes(String(photo.id)))
      );
      const photoPool = freshPhotos.length ? freshPhotos : photos;
      const memoryPhoto = photoPool[index % photoPool.length];
      const photoItem = (photo: ReminiscencePhoto): JourneyItem => ({
        id: `photo-${photo.id}`,
        emoji: '📷',
        label: {
          English: photo.correctAnswer,
          Hindi: photo.correctAnswer,
          Assamese: photo.correctAnswer,
        },
      });
      const correct = photoItem(memoryPhoto);
      const distractors = shuffle(photos.filter((photo) => photo.id !== memoryPhoto.id))
        .slice(0, profile.optionCount - 1)
        .map(photoItem);
      const fallback = chooseFreshItems(
        profile.optionCount - 1 - distractors.length,
        [],
        journeyItems.slice(0, 18)
      );
      return {
        id: `${variantBase}|photo-${memoryPhoto.id}`,
        items: [correct],
        correctId: correct.id,
        answerPool: shuffle([correct, ...distractors, ...fallback]),
        imageUrl: memoryPhoto.imageUrl,
        memoryPrompt: memoryPhoto.memoryPromptQuestion,
      };
    }
    const memoryItems = chooseFreshItems(1, recentVariantIds, journeyItems.slice(0, 18));
    const memoryItem = memoryItems[0];
    return {
      id: `${variantBase}|${memoryItem.id}`,
      items: [memoryItem],
      correctId: memoryItem.id,
      answerPool: shuffle([
        memoryItem,
        ...chooseFreshItems(profile.optionCount - 1, [memoryItem.id]),
      ]),
    };
  };

  const prepareRound = (index: number) => {
    if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    const data = makeRound(index);
    setRoundData(data);
    setMistakes(0);
    setHints(0);
    setHintText('');
    setFlipped([]);
    setMatched([]);
    setMatchStreak(0);
    setSequenceAnswer([]);
    setSelected([]);
    roundStartedRef.current = Date.now();
    if (['tea_tray_recall', 'market_list_recall', 'missing_object'].includes(gameType)) {
      setPhase('preview');
      previewTimerRef.current = window.setTimeout(
        () => setPhase('answer'),
        profile.previewDurationMs
      );
    } else {
      setPhase('answer');
    }
  };

  const startGame = () => {
    startedAtRef.current = new Date().toISOString();
    setRoundIndex(0);
    setRoundResults([]);
    setFinalSession(null);
    prepareRound(0);
    audioManager.play('tap');
  };

  const completeRound = (correct: boolean, roundMistakes = mistakes, roundHints = hints) => {
    const result: GameRoundResult = {
      round: roundIndex + 1,
      correct,
      responseMs: Math.max(300, Date.now() - roundStartedRef.current),
      mistakes: roundMistakes,
      hintsUsed: roundHints,
      contentVariantId: roundData?.id || `${gameType}-${roundIndex}`,
    };
    handleRoundResult(result);
  };

  const handleRoundResult = (result: GameRoundResult) => {
    const nextResults = [...roundResults, result];
    setRoundResults(nextResults);
    setFeedbackCorrect(result.correct);

    if (result.correct) {
      audioManager.play('pair-match');
    } else {
      audioManager.play('gentle-nudge');
    }

    if (roundIndex + 1 >= profile.roundCount) {
      const summary = summarizeRounds(nextResults);
      const completedAt = new Date().toISOString();
      const session: JourneyGameSession = {
        patientId,
        gameType,
        domain: domainForGame(gameType),
        stage: activeStage,
        stageSource,
        ...summary,
        memoryLoad: profile.memoryLoad,
        durationSeconds: Math.max(
          1,
          Math.round((Date.now() - new Date(startedAtRef.current).getTime()) / 1000)
        ),
        completionStatus: 'completed',
        contentVariantIds: nextResults.map((entry) => entry.contentVariantId),
        roundResults: nextResults,
        startedAt: startedAtRef.current,
        completedAt,
        clientEventId: crypto.randomUUID(),
      };
      setFinalSession(session);
      setPhase('result');
      audioManager.play('journey-complete');
      void onComplete(session);
    } else {
      setPhase('feedback');
    }
  };

  const nextRound = () => {
    const next = roundIndex + 1;
    setRoundIndex(next);
    prepareRound(next);
  };

  const useHint = () => {
    if (!roundData) return;
    setHints((value) => value + 1);
    audioManager.play('hint');
    const expected =
      gameType === 'daily_steps'
        ? roundData.sequence?.[sequenceAnswer.length]
        : gameType === 'tea_tray_recall'
        ? roundData.sequence?.[sequenceAnswer.length]
        : roundData.answerPool.find((item) => item.id === roundData.correctId) ||
          roundData.items[0];
    setHintText(
      expected ? `${expected.emoji} ${expected.label[language]}` : 'Look for a familiar pair.'
    );
    if (gameType === 'tea_tray_recall') {
      setPhase('preview');
      if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = window.setTimeout(
        () => setPhase('answer'),
        profile.previewDurationMs
      );
    }
  };

  const handleMatch = (cardIndex: number) => {
    if (
      !roundData ||
      flipped.includes(cardIndex) ||
      flipped.length === 2 ||
      matched.includes(roundData.answerPool[cardIndex].id)
    )
      return;
    const next = [...flipped, cardIndex];
    setFlipped(next);
    audioManager.play('tile-reveal');
    if (next.length === 2) {
      const first = roundData.answerPool[next[0]];
      const second = roundData.answerPool[next[1]];
      if (first.id === second.id) {
        const nextMatched = [...matched, first.id];
        setMatched(nextMatched);
        setMatchStreak((value) => value + 1);
        setFlipped([]);
        audioManager.play('pair-match');
        if (nextMatched.length === roundData.items.length) {
          window.setTimeout(() => completeRound(true, mistakes, hints), 350);
        }
      } else {
        const nextMistakes = mistakes + 1;
        setMistakes(nextMistakes);
        setMatchStreak(0);
        audioManager.play('gentle-nudge');
        window.setTimeout(() => setFlipped([]), 650);
      }
    }
  };

  const handleOrderedItem = (entry: JourneyItem) => {
    const expected = roundData?.sequence?.[sequenceAnswer.length];
    if (!expected) return;
    if (entry.id !== expected.id) {
      setMistakes((value) => value + 1);
      audioManager.play('gentle-nudge');
      return;
    }
    const next = [...sequenceAnswer, entry.id];
    setSequenceAnswer(next);
    audioManager.play('pair-match');
    if (next.length === roundData?.sequence?.length) completeRound(true, mistakes, hints);
  };

  const submitMarket = () => {
    if (!roundData) return;
    const target = new Set(roundData.items.map((entry) => entry.id));
    const chosen = new Set(selected);
    const errors =
      [...target].filter((id) => !chosen.has(id)).length +
      [...chosen].filter((id) => !target.has(id)).length;
    completeRound(errors === 0, errors, hints);
  };

  const exitGame = () => {
    if (!['ready', 'result'].includes(phase)) {
      const summary = summarizeRounds(roundResults);
      const completedAt = new Date().toISOString();
      void onComplete({
        patientId,
        gameType,
        domain: domainForGame(gameType),
        stage: activeStage,
        stageSource,
        ...summary,
        memoryLoad: profile.memoryLoad,
        durationSeconds: Math.max(
          1,
          Math.round((Date.now() - new Date(startedAtRef.current).getTime()) / 1000)
        ),
        completionStatus: 'abandoned',
        contentVariantIds: roundResults.map((entry) => entry.contentVariantId),
        roundResults,
        startedAt: startedAtRef.current,
        completedAt,
        clientEventId: crypto.randomUUID(),
      });
    }
    onBack();
  };

  const instruction = gameInstructions[gameType][language];
  const roundLabel = `${Math.min(roundIndex + 1, profile.roundCount)} / ${profile.roundCount}`;
  const displayedPreview =
    gameType === 'missing_object' && phase === 'answer'
      ? roundData?.items.filter((entry) => entry.id !== roundData.correctId)
      : roundData?.items;

  // --- RESULT SCREEN ---
  if (phase === 'result' && finalSession) {
    const isComfortReplay = stageSource === 'manual' && activeStage < unlockedStage;
    return (
      <div className="fixed inset-0 z-50 flex h-[100dvh] flex-col bg-gradient-to-b from-emerald-50 to-white text-center">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-assamGold-300 to-amber-500 shadow-xl">
            <Flower2 className="h-12 w-12 text-tea-950" />
          </div>
          <h1 className="mt-5 text-4xl font-black text-tea-950">{t.wonderfulWork}</h1>
          <p className="mx-auto mt-3 max-w-lg text-xl font-semibold text-stone-700">
            {t.encouragementSteady}
          </p>

          <div className="mx-auto mt-7 max-w-md rounded-3xl border-2 border-emerald-300 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-emerald-800">
              <Leaf className="h-7 w-7" />
              <span className="text-2xl font-black">
                {t.level} {activeStage} of 12
              </span>
            </div>
            {isComfortReplay ? (
              <p className="mt-2 text-sm font-bold text-tea-700 flex items-center justify-center gap-1.5">
                <HeartHandshake className="h-4 w-4" /> Comfort replay completed. Your frontier stage{' '}
                {unlockedStage} remains unlocked.
              </p>
            ) : (
              <p className="mt-2 text-sm font-semibold text-stone-700">
                {finalSession.accuracy >= 80
                  ? 'Strong focus! Keep up the daily practice.'
                  : 'Great practice session completed.'}
              </p>
            )}
          </div>
        </div>

        <div className="grid shrink-0 gap-3 border-t bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:grid-cols-2">
          <button
            onClick={startGame}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-tea-800 text-lg font-black text-white shadow-md hover:bg-tea-900 transition"
          >
            <RefreshCw className="h-5 w-5" />
            {t.playAgain}
          </button>
          <button
            onClick={onBack}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-stone-300 bg-stone-100 text-lg font-black text-stone-800 hover:bg-stone-200 transition"
          >
            <ArrowLeft className="h-5 w-5" />
            {t.backToMenu}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f8fbf9]">
      {/* Header */}
      <header className="shrink-0 border-b border-stone-200 bg-white px-3 py-2 shadow-sm">
        <div className="mx-auto grid max-w-5xl grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3">
          <button
            onClick={exitGame}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200 transition"
            aria-label={t.exit}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 text-center">
            <h1 className="truncate text-xl font-black text-tea-950">
              {definition.emoji} {definition.title}
            </h1>
            <p className="text-sm font-bold text-stone-600">
              Stage {activeStage} of 12 · Round {roundLabel}
            </p>
          </div>
          <button
            onClick={() => readAloud(instruction)}
            disabled={!speechSupported}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-tea-300 bg-tea-50 text-tea-800 hover:bg-tea-100 transition disabled:opacity-40"
            aria-label={t.listen}
          >
            <Volume2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {phase === 'ready' ? (
        <main className="flex flex-1 items-center justify-center p-4">
          <section className="w-full max-w-xl rounded-[2rem] border-2 border-tea-200 bg-white p-6 text-center shadow-xl">
            <div
              className={`mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br ${definition.colors} text-6xl shadow-lg`}
            >
              {definition.emoji}
            </div>
            <h2 className="mt-6 text-3xl font-black text-tea-950">{t.readyToBegin}</h2>
            <p className="mt-3 text-lg font-semibold leading-relaxed text-stone-700">
              {instruction}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm font-bold text-stone-600">
              <span className="rounded-full bg-stone-100 px-3 py-1.5">
                Stage {activeStage} of 12
              </span>
              <span className="rounded-full bg-stone-100 px-3 py-1.5">
                {profile.roundCount} rounds
              </span>
              <span className="rounded-full bg-stone-100 px-3 py-1.5">
                {definition.estimatedMinutes} min
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={startGame}
                className="flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-tea-800 text-xl font-black text-white shadow-lg hover:bg-tea-900 transition"
              >
                <Play className="h-7 w-7" />
                {t.startGame}
              </button>

              <button
                type="button"
                onClick={() => setStagePickerOpen(true)}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-stone-200 bg-stone-50 text-sm font-black text-stone-700 hover:bg-stone-100 transition"
              >
                <SlidersHorizontal className="h-4 w-4" /> Change Stage / Replay
              </button>
            </div>
          </section>
        </main>
      ) : (
        <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
          <div className="mx-auto max-w-4xl">
            {/* Progress bar */}
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-tea-500 to-assamGold-400 transition-all duration-300"
                style={{
                  width: `${
                    ((roundIndex + (phase === 'feedback' ? 1 : 0)) / profile.roundCount) * 100
                  }%`,
                }}
              />
            </div>

            {/* PREVIEW PHASE */}
            {phase === 'preview' && (
              <section className="rounded-[2rem] border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-5 text-center shadow-lg animate-fadeIn">
                <Eye className="mx-auto h-9 w-9 text-amber-700" />
                <h2 className="mt-2 text-2xl font-black text-stone-950">
                  Look carefully and remember
                </h2>
                <div className="mt-5 flex min-h-48 flex-wrap items-center justify-center gap-3">
                  {displayedPreview?.map((entry, index) => (
                    <div
                      key={`${entry.id}-${index}`}
                      className="flex min-h-28 min-w-24 flex-col items-center justify-center rounded-2xl border-2 border-amber-200 bg-white p-3 shadow-sm"
                    >
                      <span className="text-5xl">{entry.emoji}</span>
                      <span className="mt-2 text-base font-black">{entry.label[language]}</span>
                      {gameType === 'tea_tray_recall' && (
                        <span className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 font-black text-white">
                          {index + 1}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-4 font-bold text-amber-900">The tray will hide in a moment…</p>
              </section>
            )}

            {/* ANSWER PHASE */}
            {phase === 'answer' && (
              <section className="rounded-[2rem] border-2 border-tea-200 bg-white p-4 shadow-lg sm:p-6 animate-fadeIn">
                {roundData && (
                  <>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <h2 className="text-2xl font-black text-tea-950">
                            {gameType === 'daily_steps'
                              ? roundData.routineTitle
                              : gameType === 'market_list_recall'
                              ? 'Which items were on the list?'
                              : gameType === 'missing_object'
                              ? 'What went missing?'
                              : gameType === 'weave_pattern'
                              ? 'Complete the weave'
                              : gameType === 'memory_lane'
                              ? 'Which familiar item did you see?'
                              : gameType === 'tea_tray_recall'
                              ? 'Rebuild the tea tray order'
                              : 'Find every matching pair'}
                          </h2>
                          {gameType === 'majuli_memory' && (
                            <p className="mt-1 font-bold text-tea-700">
                              {matched.length}/{roundData.items.length} pairs · {matchStreak} match
                              streak
                            </p>
                          )}
                          {hintText && (
                            <p className="mt-2 rounded-xl bg-amber-50 p-2 font-bold text-amber-900">
                              Gentle clue: {hintText}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={useHint}
                          className="flex min-h-12 shrink-0 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 font-black text-amber-900 hover:bg-amber-100 transition"
                        >
                          <HelpCircle className="h-5 w-5" />
                          <span className="hidden sm:inline">{t.hint}</span>
                        </button>
                      </div>

                      {/* Majuli Memory Grid */}
                      {gameType === 'majuli_memory' && (
                        <div
                          className={`grid gap-2 sm:gap-3 ${
                            roundData.answerPool.length === 6 ? 'grid-cols-3' : 'grid-cols-4'
                          }`}
                        >
                          {roundData.answerPool.map((entry, index) => {
                            const visible =
                              flipped.includes(index) || matched.includes(entry.id);
                            return (
                              <button
                                key={`${entry.id}-${index}`}
                                data-card-index={index}
                                onClick={() => handleMatch(index)}
                                className={`aspect-[.82] min-h-[72px] rounded-xl border-2 p-1 transition-transform sm:min-h-24 sm:rounded-2xl sm:p-2 ${
                                  visible
                                    ? 'border-tea-500 bg-tea-50 rotate-0'
                                    : 'border-tea-800 bg-gradient-to-br from-tea-700 to-tea-950 text-white'
                                }`}
                                aria-label={
                                  visible ? entry.label[language] : 'Hidden memory card'
                                }
                              >
                                {visible ? (
                                  <>
                                    <span className="block text-3xl sm:text-4xl">
                                      {entry.emoji}
                                    </span>
                                    <span className="mt-1 block text-xs font-black leading-tight sm:text-sm">
                                      {entry.label[language]}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xl font-black sm:text-2xl">স্মৃ</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Tea Tray Sequence */}
                      {gameType === 'tea_tray_recall' && (
                        <>
                          <div className="mb-4 flex min-h-16 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-3">
                            {sequenceAnswer.map((id, index) => {
                              const entry = journeyItems.find((item) => item.id === id)!;
                              return (
                                <span
                                  key={`${id}-${index}`}
                                  className="rounded-xl bg-white px-3 py-2 text-2xl shadow-sm"
                                >
                                  {index + 1}. {entry.emoji}
                                </span>
                              );
                            })}
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {roundData.answerPool.map((entry) => (
                              <button
                                key={entry.id}
                                onClick={() => handleOrderedItem(entry)}
                                className="min-h-24 rounded-2xl border-2 border-amber-300 bg-white p-3 text-center shadow-sm hover:bg-amber-50 transition"
                              >
                                <span className="block text-4xl">{entry.emoji}</span>
                                <span className="mt-1 block font-black">
                                  {entry.label[language]}
                                </span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Market List Recall */}
                      {gameType === 'market_list_recall' && (
                        <>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {roundData.answerPool.map((entry) => (
                              <button
                                key={entry.id}
                                onClick={() =>
                                  setSelected((values) =>
                                    values.includes(entry.id)
                                      ? values.filter((id) => id !== entry.id)
                                      : [...values, entry.id]
                                  )
                                }
                                aria-pressed={selected.includes(entry.id)}
                                className={`min-h-24 rounded-2xl border-2 p-3 transition ${
                                  selected.includes(entry.id)
                                    ? 'border-tea-700 bg-tea-100 shadow-sm'
                                    : 'border-stone-200 bg-white hover:bg-stone-50'
                                }`}
                              >
                                <span className="block text-4xl">{entry.emoji}</span>
                                <span className="font-black">{entry.label[language]}</span>
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={submitMarket}
                            disabled={!selected.length}
                            className="mt-5 min-h-14 w-full rounded-2xl bg-tea-800 text-lg font-black text-white shadow-md hover:bg-tea-900 transition disabled:opacity-40"
                          >
                            That is my list
                          </button>
                        </>
                      )}

                      {/* Missing Object */}
                      {gameType === 'missing_object' && (
                        <>
                          <div className="mb-5 flex flex-wrap justify-center gap-3 rounded-2xl bg-sky-50 p-4">
                            {displayedPreview?.map((entry) => (
                              <span key={entry.id} className="text-5xl">
                                {entry.emoji}
                              </span>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {roundData.answerPool.map((entry) => (
                              <button
                                key={entry.id}
                                onClick={() =>
                                  completeRound(
                                    entry.id === roundData.correctId,
                                    entry.id === roundData.correctId ? mistakes : mistakes + 1,
                                    hints
                                  )
                                }
                                className="min-h-24 rounded-2xl border-2 border-sky-300 bg-white p-3 shadow-sm hover:bg-sky-50 transition"
                              >
                                <span className="block text-4xl">{entry.emoji}</span>
                                <span className="font-black">{entry.label[language]}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Daily Steps */}
                      {gameType === 'daily_steps' && (
                        <>
                          <div className="mb-4 flex min-h-16 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 p-3">
                            {sequenceAnswer.map((id, index) => {
                              const entry = journeyItems.find((item) => item.id === id)!;
                              return (
                                <span
                                  key={`${id}-${index}`}
                                  className="rounded-xl bg-white px-3 py-2 font-black shadow-sm"
                                >
                                  {index + 1}. {entry.emoji} {entry.label[language]}
                                </span>
                              );
                            })}
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {roundData.answerPool
                              .filter((entry) => !sequenceAnswer.includes(entry.id))
                              .map((entry) => (
                                <button
                                  key={entry.id}
                                  onClick={() => handleOrderedItem(entry)}
                                  className="min-h-24 rounded-2xl border-2 border-orange-300 bg-white p-3 text-left shadow-sm hover:bg-orange-50 transition"
                                >
                                  <span className="mr-3 text-4xl">{entry.emoji}</span>
                                  <span className="text-lg font-black">
                                    {entry.label[language]}
                                  </span>
                                </button>
                              ))}
                          </div>
                        </>
                      )}

                      {/* Weave Pattern */}
                      {gameType === 'weave_pattern' && (
                        <>
                          <div className="mb-5 flex flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 bg-rose-50 p-5">
                            {roundData.pattern?.map((entry, index) => (
                              <span
                                key={index}
                                className={`flex h-16 w-16 items-center justify-center rounded-xl border-2 text-3xl ${
                                  index === roundData.missingIndex
                                    ? 'border-dashed border-rose-500 bg-white'
                                    : 'border-white bg-white shadow-sm'
                                }`}
                              >
                                {index === roundData.missingIndex ? '❓' : entry.emoji}
                              </span>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {roundData.answerPool.map((entry) => (
                              <button
                                key={entry.id}
                                onClick={() =>
                                  completeRound(
                                    entry.id === roundData.correctId,
                                    entry.id === roundData.correctId ? mistakes : mistakes + 1,
                                    hints
                                  )
                                }
                                className="min-h-24 rounded-2xl border-2 border-rose-300 bg-white p-3 shadow-sm hover:bg-rose-50 transition"
                              >
                                <span className="block text-4xl">{entry.emoji}</span>
                                <span className="font-black">{entry.label[language]}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Memory Lane */}
                      {gameType === 'memory_lane' && (
                        <>
                          <div className="mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-violet-100 to-amber-50 text-center shadow-sm">
                            {roundData.imageUrl ? (
                              <img
                                src={roundData.imageUrl}
                                alt="A personal memory shared by the caretaker"
                                className="max-h-[42dvh] w-full object-contain bg-stone-950"
                              />
                            ) : (
                              <div className="p-8">
                                <span className="text-8xl">{roundData.items[0].emoji}</span>
                              </div>
                            )}
                            <p className="p-4 text-xl font-black text-violet-950">
                              {roundData.memoryPrompt || 'Which familiar item did you see?'}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {roundData.answerPool.map((entry) => (
                              <button
                                key={entry.id}
                                onClick={() =>
                                  completeRound(
                                    entry.id === roundData.correctId,
                                    entry.id === roundData.correctId ? mistakes : mistakes + 1,
                                    hints
                                  )
                                }
                                className="min-h-20 rounded-2xl border-2 border-violet-300 bg-white p-3 text-lg font-black shadow-sm hover:bg-violet-50 transition"
                              >
                                {entry.emoji} {entry.label[language]}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )
                }
              </section>
            )}

            {/* FEEDBACK PHASE */}
            {phase === 'feedback' && (
              <section
                className={`rounded-[2rem] border-2 p-7 text-center shadow-lg animate-fadeIn ${
                  feedbackCorrect
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-amber-300 bg-amber-50'
                }`}
              >
                <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-emerald-700 shadow">
                  <Check className="h-10 w-10" />
                </span>
                <h2 className="mt-4 text-3xl font-black text-stone-950">
                  {feedbackCorrect ? t.wonderfulWork : t.goodEffort}
                </h2>
                <p className="mt-2 text-lg font-semibold text-stone-700">
                  {t.encouragementPractice}
                </p>
                <button
                  onClick={nextRound}
                  className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-tea-800 text-lg font-black text-white shadow-md hover:bg-tea-900 transition"
                >
                  <Sparkles className="h-5 w-5" />
                  {t.nextMemory}
                </button>
              </section>
            )}
          </div>
        </main>
      )}

      {/* Stage Picker Modal */}
      <StagePickerModal
        open={stagePickerOpen}
        onClose={() => setStagePickerOpen(false)}
        gameType={gameType}
        unlockedStage={unlockedStage}
        recommendedStage={recommendedStage}
        onSelectStage={(newStage, source) => {
          setActiveStage(newStage);
          setStageSource(source);
        }}
      />
    </div>
  );
};
