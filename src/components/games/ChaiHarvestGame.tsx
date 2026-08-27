import React, { useState, useEffect, useRef } from 'react';
import { audioManager } from '../../services/audioManager';
import { aiEngine, type DifficultyDecision } from '../../services/aiEngine';
import { db } from '../../services/db';
import { GameResultModal } from './GameResultModal';
import { Trophy, Leaf, Flame } from 'lucide-react';
import type { GameSession, DifficultyTier } from '../../types';
import { useApp } from '../../context/AppContext';
import { GameShell } from './GameShell';

interface HarvestItem {
  id: number;
  type: 'green_leaf' | 'golden_bud' | 'twig' | 'caterpillar';
  emoji: string;
  label: string;
  points: number;
  x: number;
  y: number;
  createdAt: number;
}

interface ChaiHarvestGameProps {
  onBack: () => void;
}

const getCurrentTime = () => Date.now();
const getRandomNumber = () => Math.random();

export const ChaiHarvestGame: React.FC<ChaiHarvestGameProps> = ({ onBack }) => {
  const { t } = useApp();
  const [activeItems, setActiveItems] = useState<HarvestItem[]>([]);
  const [harvestedCount, setHarvestedCount] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyTier>(2);
  const [combo, setCombo] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [finalAccuracy, setFinalAccuracy] = useState<number>(0);
  const [difficultyDecision, setDifficultyDecision] = useState<DifficultyDecision>();
  const [isRunning, setIsRunning] = useState(false);

  const gameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const itemCounterRef = useRef<number>(0);
  const hasEndedRef = useRef<boolean>(false);
  const gameStatsRef = useRef({
    harvestedCount: 0,
    missedCount: 0,
    totalScore: 0,
    reactionTimes: [] as number[],
    difficultyLevel: 2 as DifficultyTier,
  });

  async function prepareHarvestGame(targetLevel?: DifficultyTier) {
    let chosenLevel: DifficultyTier = targetLevel || difficultyLevel;

    if (!targetLevel) {
      const history = await db.gameSessions.toArray();
      chosenLevel = aiEngine.calculateDynamicDifficulty('chai_harvest', history).level;
    }

    setDifficultyLevel(chosenLevel);
    const config = aiEngine.getConfigForLevel('chai_harvest', chosenLevel);

    setHarvestedCount(0);
    setTotalScore(0);
    setCombo(0);
    setTimeLeft(config.timeLimitSeconds || 40);
    setActiveItems([]);
    setIsGameOver(false);
    setIsRunning(false);
    setDifficultyDecision(undefined);
    hasEndedRef.current = false;
    gameStatsRef.current = {
      harvestedCount: 0,
      missedCount: 0,
      totalScore: 0,
      reactionTimes: [],
      difficultyLevel: chosenLevel,
    };
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
  }

  const beginHarvestGame = () => {
    const config = aiEngine.getConfigForLevel('chai_harvest', difficultyLevel);
    setIsRunning(true);
    startTimeRef.current = getCurrentTime();
    spawnNewItem(config.distractionDensity || 0.15, difficultyLevel);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    gameTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (gameTimerRef.current) clearInterval(gameTimerRef.current);
          if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
          handleGameEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const spawnIntervalMs = Math.max(750, 2100 - difficultyLevel * 280);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    spawnTimerRef.current = setInterval(() => {
      spawnNewItem(config.distractionDensity || 0.15, difficultyLevel);
    }, spawnIntervalMs);
  };

  const initialGameRef = useRef(prepareHarvestGame);
  useEffect(() => {
    void initialGameRef.current();
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden || !isRunning) return;
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      setIsRunning(false);
      setActiveItems([]);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRunning]);

  const spawnNewItem = (distractionRate: number, currentTier: number) => {
    itemCounterRef.current += 1;
    const isDistractor = getRandomNumber() < distractionRate;
    const isCaterpillar = isDistractor && currentTier >= 3 && getRandomNumber() < 0.4;
    const isTwig = isDistractor && !isCaterpillar;
    const isGolden = !isDistractor && getRandomNumber() < (0.25 + currentTier * 0.05);

    const newItem: HarvestItem = {
      id: itemCounterRef.current,
      type: isCaterpillar ? 'caterpillar' : isTwig ? 'twig' : isGolden ? 'golden_bud' : 'green_leaf',
      emoji: isCaterpillar ? '🐛' : isTwig ? '🪵' : isGolden ? '✨🍃' : '🍃',
      label: isCaterpillar ? 'Garden Bug' : isTwig ? 'Twig' : isGolden ? 'Golden Bud' : 'Tea Leaf',
      points: isCaterpillar ? -15 : isTwig ? -10 : isGolden ? 30 : 15,
      x: 12 + Math.floor(getRandomNumber() * 75),
      y: 18 + Math.floor(getRandomNumber() * 60),
      createdAt: getCurrentTime(),
    };

    const maxItems = currentTier >= 4 ? 7 : 5;
    setActiveItems((prev) => [...prev.slice(-maxItems + 1), newItem]);
  };

  const handleItemTap = (item: HarvestItem) => {
    audioManager.playTap();
    const reactionTime = getCurrentTime() - item.createdAt;
    gameStatsRef.current.reactionTimes.push(reactionTime);

    if (item.type === 'twig' || item.type === 'caterpillar') {
      audioManager.playTryAgain();
      setCombo(0);
      gameStatsRef.current.missedCount += 1;
      gameStatsRef.current.totalScore = Math.max(
        0,
        gameStatsRef.current.totalScore + item.points
      );
      setTotalScore(gameStatsRef.current.totalScore);
    } else {
      audioManager.playSuccess();
      const newCombo = combo + 1;
      setCombo(newCombo);
      const bonus = Math.floor(newCombo / 3) * 5;
      gameStatsRef.current.harvestedCount += 1;
      gameStatsRef.current.totalScore += item.points + bonus;
      setHarvestedCount(gameStatsRef.current.harvestedCount);
      setTotalScore(gameStatsRef.current.totalScore);
    }

    setActiveItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleGameEnd = async () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    const stats = gameStatsRef.current;
    setIsGameOver(true);
    setIsRunning(false);
    const totalTaps = stats.harvestedCount + stats.missedCount;
    const accuracy = totalTaps > 0 ? Math.round((stats.harvestedCount / totalTaps) * 100) : 80;
    const avgReaction =
      stats.reactionTimes.length > 0
        ? Math.round(stats.reactionTimes.reduce((a, b) => a + b, 0) / stats.reactionTimes.length)
        : 1100;

    const durationSec = Math.round((getCurrentTime() - startTimeRef.current) / 1000);
    const score = Math.min(100, Math.max(40, stats.totalScore));
    setFinalAccuracy(accuracy);

    const session: GameSession = {
      patientId: 'pat-ner-001',
      gameType: 'chai_harvest',
      gameTitle: 'Chai Garden Harvest',
      score,
      maxPossibleScore: 100,
      accuracy,
      durationSeconds: durationSec,
      difficultyLevel: stats.difficultyLevel,
      hesitationsCount: 0,
      hintsUsedCount: 0,
      avgReactionTimeMs: avgReaction,
      completedAt: new Date().toISOString(),
      synced: false,
    };

    await db.gameSessions.add(session);
    const history = await db.gameSessions.toArray();
    setDifficultyDecision(aiEngine.calculateDynamicDifficulty('chai_harvest', history));
  };

  return (
    <GameShell title={t.harvestTitle} instruction={t.harvestInstruction} onExit={onBack} status={`⏳ ${timeLeft}s`} level={difficultyLevel} onLevelChange={(level) => { void prepareHarvestGame(level); }}>
      <div className="animate-fade-in">
        <div className="mb-3 grid grid-cols-3 gap-2" aria-live="polite">
          <div className="flex min-h-[48px] items-center justify-center gap-1 rounded-xl border border-stone-200 bg-white px-2 text-base font-black text-emerald-800"><Leaf className="h-5 w-5" />{harvestedCount}</div>
          <div className="flex min-h-[48px] items-center justify-center gap-1 rounded-xl border border-stone-200 bg-white px-2 text-base font-black text-tea-900"><Trophy className="h-5 w-5 text-assamGold-500" />{totalScore}</div>
          <div className="flex min-h-[48px] items-center justify-center gap-1 rounded-xl border border-stone-200 bg-white px-2 text-base font-black text-amber-800"><Flame className="h-5 w-5" />{combo}x</div>
        </div>

      {/* Interactive Tea Bush Arena */}
      <div className="relative h-[clamp(280px,calc(100dvh-245px),440px)] w-full select-none overflow-hidden rounded-3xl border-4 border-tea-700 bg-gradient-to-b from-sky-100 via-emerald-50 to-tea-900 shadow-xl">
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-tea-950 via-tea-800 to-transparent opacity-90" />

        <div className="absolute bottom-4 left-4 rounded-xl bg-black/55 px-3 py-2 text-base font-bold text-white backdrop-blur-sm">
          🧺 {t.basketReady}
        </div>

        {activeItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemTap(item)}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
            }}
            className={`tactile-btn absolute transform -translate-x-1/2 -translate-y-1/2 p-3.5 sm:p-4 rounded-3xl shadow-xl flex flex-col items-center justify-center transition-all ${
              item.type === 'golden_bud'
                ? 'bg-gradient-to-tr from-amber-400 to-yellow-200 border-3 border-amber-500 scale-110'
                : item.type === 'green_leaf'
                ? 'bg-gradient-to-tr from-emerald-400 to-green-200 border-3 border-emerald-600'
                : 'bg-stone-200 border-3 border-stone-400'
            }`}
          >
            <span className="text-3xl sm:text-4xl drop-shadow">{item.emoji}</span>
            <span className="mt-1 rounded-full bg-white/90 px-2 py-0.5 text-sm font-black text-stone-900 shadow-sm">
              {item.label}
            </span>
          </button>
        ))}

        {!isRunning && !isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center text-center p-4">
            <div className="max-w-sm rounded-3xl border-2 border-tea-400 bg-white/95 p-6 shadow-xl backdrop-blur-sm">
              <p className="text-xl font-black text-tea-950">{t.readyToBegin}</p>
              <button onClick={beginHarvestGame} className="tactile-btn mt-4 min-h-[56px] w-full rounded-2xl bg-tea-700 px-6 text-lg font-black text-white">{t.startGame}</button>
            </div>
          </div>
        )}
      </div>

      <GameResultModal
        isOpen={isGameOver}
        accuracy={finalAccuracy}
        difficultyDecision={difficultyDecision}
        gameTitle={t.harvestTitle}
        onPlayAgain={() => { void prepareHarvestGame(); }}
        onBackToMenu={onBack}
      />
      </div>
    </GameShell>
  );
};
