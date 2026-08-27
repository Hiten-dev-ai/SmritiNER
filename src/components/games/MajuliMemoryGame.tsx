import React, { useState, useEffect, useRef } from 'react';
import { audioManager } from '../../services/audioManager';
import { aiEngine, type DifficultyDecision } from '../../services/aiEngine';
import { db } from '../../services/db';
import { GameResultModal } from './GameResultModal';
import type { GameSession, DifficultyTier } from '../../types';
import { useApp } from '../../context/AppContext';
import { GameShell } from './GameShell';

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
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
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

    const accuracy = Math.min(100, Math.max(30, Math.round((pairsCount / attempts) * 100)));
    const score = Math.min(100, Math.max(40, Math.round(accuracy * 0.75 + difficultyLevel * 5)));

    setFinalAccuracy(accuracy);
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
    <GameShell title={t.majuliTitle} instruction={t.majuliInstruction} onExit={onBack} onHint={triggerManualHint} status={`${matchedIds.length} / ${cards.length / 2} ${t.memory}`} level={difficultyLevel} onLevelChange={(level) => { void startNewGame(level); }}>
      <div className="animate-fade-in">
        {streak > 1 && <p className="mb-3 text-center text-base font-black text-amber-800" aria-live="polite">🔥 {streak}</p>}

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
                  <span className="text-base font-black text-stone-900 leading-tight">
                    {card.labelEnglish}
                  </span>
                  <span className="text-sm font-semibold text-stone-500 leading-tight">
                    {card.labelAssamese}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-tea-100/80 border border-tea-200 flex items-center justify-center text-tea-700 font-black">
                    স্মৃ
                  </div>
                  <span className="text-sm font-bold text-stone-500">{t.tapCard}</span>
                </div>
              )}

              {isMatched && (
                <div className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white shadow" aria-label={t.pairsCleared}>
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>

      <GameResultModal
        isOpen={isGameOver}
        accuracy={finalAccuracy}
        difficultyDecision={difficultyDecision}
        gameTitle={t.majuliTitle}
        onPlayAgain={() => startNewGame()}
        onBackToMenu={onBack}
      />
      </div>
    </GameShell>
  );
};
