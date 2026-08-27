import React, { useState, useEffect, useRef } from 'react';
import { audioManager } from '../../services/audioManager';
import { aiEngine, type DifficultyDecision } from '../../services/aiEngine';
import { db } from '../../services/db';
import { GameResultModal } from './GameResultModal';
import { HelpCircle, ArrowLeft, Brain, Flame } from 'lucide-react';
import type { GameSession, DifficultyTier } from '../../types';
import { useApp } from '../../context/AppContext';

interface CardItem {
  id: string;
  uniqueKey: number;
  labelAssamese: string;
  labelEnglish: string;
  emoji: string;
  color: string;
  description: string;
}

const CULTURAL_ICONS: CardItem[] = [
  {
    id: 'rhino',
    uniqueKey: 0,
    labelAssamese: 'এশিঙীয়া গঁড়',
    labelEnglish: 'One-Horned Rhino',
    emoji: '🦏',
    color: 'bg-emerald-50 text-emerald-900 border-emerald-400',
    description: 'Pride of Kaziranga National Park',
  },
  {
    id: 'dhol',
    uniqueKey: 0,
    labelAssamese: 'বিহু ঢোল',
    labelEnglish: 'Bihu Dhol Drum',
    emoji: '🥁',
    color: 'bg-amber-50 text-amber-900 border-amber-400',
    description: 'Traditional rhythm of Rongali Bihu festival',
  },
  {
    id: 'hornbill',
    uniqueKey: 0,
    labelAssamese: 'ধনেশ পক্ষী',
    labelEnglish: 'Great Hornbill',
    emoji: '🦅',
    color: 'bg-orange-50 text-orange-900 border-orange-400',
    description: 'Sacred bird of North East forests',
  },
  {
    id: 'tealeaf',
    uniqueKey: 0,
    labelAssamese: 'দুটি পাত এটা কুঁহি',
    labelEnglish: 'Assam Tea Leaves',
    emoji: '🍃',
    color: 'bg-green-50 text-green-900 border-green-400',
    description: 'World famous fragrant Assam tea',
  },
  {
    id: 'mask',
    uniqueKey: 0,
    labelAssamese: 'মাজুলীৰ মুখা',
    labelEnglish: 'Majuli Island Mask',
    emoji: '🎭',
    color: 'bg-purple-50 text-purple-900 border-purple-400',
    description: 'Heritage bamboo and clay mask craft',
  },
  {
    id: 'gamosa',
    uniqueKey: 0,
    labelAssamese: 'ফুলাম গামোচা',
    labelEnglish: 'Assam Phulam Gamosa',
    emoji: '🧣',
    color: 'bg-red-50 text-red-900 border-red-400',
    description: 'Symbol of respect and Assamese culture',
  },
  {
    id: 'silk',
    uniqueKey: 0,
    labelAssamese: 'মুগা ৰেচম',
    labelEnglish: 'Muga Golden Silk',
    emoji: '🦋',
    color: 'bg-yellow-50 text-yellow-900 border-yellow-400',
    description: 'Golden silk endemic to Brahmaputra valley',
  },
  {
    id: 'bamboo',
    uniqueKey: 0,
    labelAssamese: 'বাঁহৰ কাৰুকাৰ্য্য',
    labelEnglish: 'Bamboo Crafts',
    emoji: '🎋',
    color: 'bg-lime-50 text-lime-900 border-lime-400',
    description: 'Eco-friendly sustainable craft of NER',
  },
];

interface MajuliMemoryGameProps {
  onBack: () => void;
}

const getCurrentTime = () => Date.now();

export const MajuliMemoryGame: React.FC<MajuliMemoryGameProps> = ({ onBack }) => {
  const { t } = useApp();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyTier>(2);
  const [streak, setStreak] = useState<number>(0);
  const [hesitationsCount, setHesitationsCount] = useState<number>(0);
  const [hintsUsedCount, setHintsUsedCount] = useState<number>(0);
  const [hintIndices, setHintIndices] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [finalAccuracy, setFinalAccuracy] = useState<number>(0);
  const [difficultyDecision, setDifficultyDecision] = useState<DifficultyDecision>();

  const lastActionTimeRef = useRef<number>(0);
  const hesitationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    hesitationTimerRef.current = setInterval(() => {
      const elapsed = getCurrentTime() - lastActionTimeRef.current;
      if (elapsed >= 4500 && flippedIndices.length === 1 && hintIndices.length === 0) {
        const firstCard = cards[flippedIndices[0]];
        const secondCardIdx = cards.findIndex(
          (c, idx) => c.id === firstCard.id && idx !== flippedIndices[0]
        );
        if (secondCardIdx !== -1) {
          setHintIndices([flippedIndices[0], secondCardIdx]);
          setHesitationsCount((prev) => prev + 1);
          setHintsUsedCount((prev) => prev + 1);
        }
      }
    }, 1000);

    return () => {
      if (hesitationTimerRef.current) clearInterval(hesitationTimerRef.current);
    };
  }, [cards, flippedIndices, hintIndices]);

  async function startNewGame(targetLevel?: DifficultyTier) {
    let chosenLevel: DifficultyTier = targetLevel || difficultyLevel;

    if (!targetLevel) {
      const history = await db.gameSessions.toArray();
      chosenLevel = aiEngine.calculateDynamicDifficulty('majuli_memory', history).level;
    }

    setDifficultyLevel(chosenLevel);

    const pairCount = chosenLevel === 1 ? 2 : chosenLevel === 2 ? 3 : chosenLevel === 3 ? 4 : chosenLevel === 4 ? 6 : 8;
    const selectedIcons = CULTURAL_ICONS.slice(0, pairCount);

    const deck: CardItem[] = [];
    selectedIcons.forEach((item, idx) => {
      deck.push({ ...item, uniqueKey: idx * 2 });
      deck.push({ ...item, uniqueKey: idx * 2 + 1 });
    });

    const shuffled = deck.sort(() => Math.random() - 0.5);

    setCards(shuffled);
    setFlippedIndices([]);
    setMatchedIds([]);
    setHintIndices([]);
    setStreak(0);
    setHesitationsCount(0);
    setHintsUsedCount(0);
    setTotalAttempts(0);
    setStartTime(getCurrentTime());
    setIsGameOver(false);
    setDifficultyDecision(undefined);
    lastActionTimeRef.current = getCurrentTime();
  }

  const initialGameRef = useRef(startNewGame);
  useEffect(() => {
    void initialGameRef.current();
    return () => {
      if (hesitationTimerRef.current) clearInterval(hesitationTimerRef.current);
    };
  }, []);

  const handleCardClick = (index: number) => {
    audioManager.playTap();
    lastActionTimeRef.current = getCurrentTime();
    setHintIndices([]);

    if (flippedIndices.length === 2 || flippedIndices.includes(index) || matchedIds.includes(cards[index].id)) {
      return;
    }

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setTotalAttempts((prev) => prev + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard.id === secondCard.id) {
        audioManager.playSuccess();
        setStreak((prev) => prev + 1);
        const newMatched = [...matchedIds, firstCard.id];
        setMatchedIds(newMatched);
        setFlippedIndices([]);

        const totalPairs = cards.length / 2;
        if (newMatched.length === totalPairs) {
          handleGameComplete(totalAttempts + 1, newMatched.length);
        }
      } else {
        audioManager.playTryAgain();
        setStreak(0);
        setTimeout(() => {
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const handleGameComplete = async (attempts: number, pairsCount: number) => {
    const elapsedSec = Math.max(1, Math.round((getCurrentTime() - startTime) / 1000));
    setDurationSeconds(elapsedSec);

    const accuracy = Math.min(100, Math.max(30, Math.round((pairsCount / attempts) * 100)));
    const score = Math.min(100, Math.max(40, Math.round(accuracy * 0.75 + difficultyLevel * 5)));

    setFinalAccuracy(accuracy);
    setFinalScore(score);
    setIsGameOver(true);

    const sessionRecord: GameSession = {
      patientId: 'pat-ner-001',
      gameType: 'majuli_memory',
      gameTitle: 'Majuli Memory Cards',
      score,
      maxPossibleScore: 100,
      accuracy,
      durationSeconds: elapsedSec,
      difficultyLevel,
      hesitationsCount,
      hintsUsedCount,
      avgReactionTimeMs: Math.round((elapsedSec / Math.max(1, attempts)) * 1000),
      completedAt: new Date().toISOString(),
      synced: false,
    };

    await db.gameSessions.add(sessionRecord);
    const history = await db.gameSessions.toArray();
    setDifficultyDecision(aiEngine.calculateDynamicDifficulty('majuli_memory', history));
  };

  const triggerManualHint = () => {
    audioManager.playTap();
    const unmatched = cards.filter((c) => !matchedIds.includes(c.id));
    if (unmatched.length >= 2) {
      const targetId = unmatched[0].id;
      const indices = cards
        .map((c, i) => (c.id === targetId ? i : -1))
        .filter((i) => i !== -1);
      setHintIndices(indices);
      setHintsUsedCount((prev) => prev + 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-fade-in">
      {/* Top Game Bar */}
      <div className="flex flex-wrap items-center justify-between bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-stone-200 mb-6 gap-3">
        <button
          onClick={() => {
            audioManager.playTap();
            onBack();
          }}
          className="tactile-btn flex items-center space-x-2 text-stone-700 hover:text-tea-800 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.exit}</span>
        </button>

        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-black text-tea-900 leading-tight">
            {t.majuliTitle}
          </h2>
          <p className="text-xs text-stone-500 font-semibold">
            {t.majuliSubtitle}
          </p>
        </div>

        {/* Difficulty Level Selector */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-black">
            <span className="hidden sm:inline px-2 text-[10px] uppercase tracking-wide text-stone-500">
              Demo level
            </span>
            {([1, 2, 3, 4, 5] as DifficultyTier[]).map((lv) => (
              <button
                key={lv}
                onClick={() => startNewGame(lv)}
                aria-label={`Demo override: start level ${lv}`}
                aria-pressed={difficultyLevel === lv}
                title="Manual demo override"
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  difficultyLevel === lv
                    ? 'bg-tea-700 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                L{lv}
              </button>
            ))}
          </div>

          <button
            onClick={triggerManualHint}
            className="tactile-btn flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-300"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t.hint}</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-sm text-center">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Pairs Cleared</span>
          <p className="text-lg sm:text-xl font-black text-tea-800">
            {matchedIds.length} / {cards.length / 2}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-sm text-center">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Difficulty Tier</span>
          <p className="text-lg sm:text-xl font-black text-blue-700 flex items-center justify-center gap-1">
            <Brain className="w-4 h-4" /> {t.level} {difficultyLevel}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-sm text-center">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Streak</span>
          <p className="text-lg sm:text-xl font-black text-amber-600 flex items-center justify-center gap-1">
            <Flame className="w-4 h-4" /> {streak}
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div
        className={`grid gap-3 sm:gap-4 justify-center ${
          cards.length <= 4
            ? 'grid-cols-2 max-w-sm mx-auto'
            : cards.length <= 6
            ? 'grid-cols-3 max-w-md mx-auto'
            : cards.length <= 8
            ? 'grid-cols-2 sm:grid-cols-4 max-w-xl mx-auto'
            : cards.length <= 12
            ? 'grid-cols-3 sm:grid-cols-4 max-w-2xl mx-auto'
            : 'grid-cols-4 sm:grid-cols-4 max-w-3xl mx-auto'
        }`}
      >
        {cards.map((card, index) => {
          const isFlipped = flippedIndices.includes(index) || matchedIds.includes(card.id);
          const isMatched = matchedIds.includes(card.id);
          const isHinted = hintIndices.includes(index);

          return (
            <div
              key={card.uniqueKey}
              onClick={() => handleCardClick(index)}
              className={`tactile-btn relative ${
                cards.length >= 12 ? 'h-28 sm:h-36' : 'h-36 sm:h-44'
              } rounded-3xl p-2.5 flex flex-col items-center justify-center text-center transition-all duration-200 border-3 cursor-pointer select-none ${
                isHinted ? 'ai-hint-active' : ''
              } ${
                isMatched
                  ? 'bg-emerald-50 border-emerald-500 opacity-90 scale-95 shadow-inner'
                  : isFlipped
                  ? `${card.color} shadow-lg scale-100`
                  : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-400 shadow-sm'
              }`}
            >
              {isFlipped ? (
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className={`${cards.length >= 12 ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl'}`}>
                    {card.emoji}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-stone-900 leading-tight">
                    {card.labelEnglish}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-stone-500 leading-tight">
                    {card.labelAssamese}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-tea-100/80 border border-tea-200 flex items-center justify-center text-tea-700 font-black">
                    স্মৃ
                  </div>
                  <span className="text-[10px] font-bold text-stone-400">Tap</span>
                </div>
              )}

              {isMatched && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shadow">
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>

      <GameResultModal
        isOpen={isGameOver}
        score={finalScore}
        accuracy={finalAccuracy}
        durationSeconds={durationSeconds}
        difficultyLevel={difficultyLevel}
        difficultyDecision={difficultyDecision}
        gameTitle="Majuli Memory Cards"
        onPlayAgain={() => startNewGame()}
        onBackToMenu={onBack}
      />
    </div>
  );
};
