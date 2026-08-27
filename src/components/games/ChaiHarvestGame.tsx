import React, { useState, useEffect, useRef } from 'react';
import { audioManager } from '../../services/audioManager';
import { aiEngine, type DifficultyDecision } from '../../services/aiEngine';
import { db } from '../../services/db';
import { GameResultModal } from './GameResultModal';
import { ArrowLeft, Trophy, Leaf, Flame } from 'lucide-react';
import type { GameSession, DifficultyTier } from '../../types';
import { useApp } from '../../context/AppContext';

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
  const [finalScore, setFinalScore] = useState<number>(0);
  const [finalAccuracy, setFinalAccuracy] = useState<number>(0);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [difficultyDecision, setDifficultyDecision] = useState<DifficultyDecision>();

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

  async function startHarvestGame(targetLevel?: DifficultyTier) {
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
    setDifficultyDecision(undefined);
    hasEndedRef.current = false;
    gameStatsRef.current = {
      harvestedCount: 0,
      missedCount: 0,
      totalScore: 0,
      reactionTimes: [],
      difficultyLevel: chosenLevel,
    };
    startTimeRef.current = getCurrentTime();

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

    const spawnIntervalMs = Math.max(750, 2100 - chosenLevel * 280);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    spawnTimerRef.current = setInterval(() => {
      spawnNewItem(config.distractionDensity || 0.15, chosenLevel);
    }, spawnIntervalMs);
  }

  const initialGameRef = useRef(startHarvestGame);
  useEffect(() => {
    void initialGameRef.current();
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, []);

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
    const totalTaps = stats.harvestedCount + stats.missedCount;
    const accuracy = totalTaps > 0 ? Math.round((stats.harvestedCount / totalTaps) * 100) : 80;
    const avgReaction =
      stats.reactionTimes.length > 0
        ? Math.round(stats.reactionTimes.reduce((a, b) => a + b, 0) / stats.reactionTimes.length)
        : 1100;

    const durationSec = Math.round((getCurrentTime() - startTimeRef.current) / 1000);
    const score = Math.min(100, Math.max(40, stats.totalScore));
    setFinalScore(score);
    setFinalAccuracy(accuracy);
    setDurationSeconds(durationSec);

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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-fade-in">
      {/* Top Header */}
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
            {t.harvestTitle}
          </h2>
          <p className="text-xs text-stone-500 font-semibold">
            Tap fresh tea leaves & golden buds quickly into the basket
          </p>
        </div>

        {/* Level Selector & Timer */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-black">
            <span className="hidden sm:inline px-2 text-[10px] uppercase tracking-wide text-stone-500">
              Demo level
            </span>
            {([1, 2, 3, 4, 5] as DifficultyTier[]).map((lv) => (
              <button
                key={lv}
                onClick={() => startHarvestGame(lv)}
                aria-label={`Demo override: start level ${lv}`}
                aria-pressed={difficultyLevel === lv}
                title="Manual demo override"
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  difficultyLevel === lv
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                L{lv}
              </button>
            ))}
          </div>

          <div className="bg-amber-100 text-amber-950 font-black px-3 py-1.5 rounded-xl text-xs sm:text-sm border border-amber-300">
            ⏳ {timeLeft}s
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-sm text-center">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Leaves Plucked</span>
          <p className="text-lg sm:text-xl font-black text-emerald-700 flex items-center justify-center gap-1">
            <Leaf className="w-4 h-4 text-emerald-600" /> {harvestedCount}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-sm text-center">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Score</span>
          <p className="text-lg sm:text-xl font-black text-tea-800 flex items-center justify-center gap-1">
            <Trophy className="w-4 h-4 text-assamGold-500" /> {totalScore}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-sm text-center">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Combo</span>
          <p className="text-lg sm:text-xl font-black text-amber-600 flex items-center justify-center gap-1">
            <Flame className="w-4 h-4" /> {combo}x
          </p>
        </div>
      </div>

      {/* Interactive Tea Bush Arena */}
      <div className="relative w-full h-[400px] sm:h-[440px] rounded-3xl overflow-hidden shadow-xl border-4 border-tea-700 bg-gradient-to-b from-sky-100 via-emerald-50 to-tea-900 select-none">
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-tea-950 via-tea-800 to-transparent opacity-90" />

        <div className="absolute bottom-4 left-4 text-white font-bold text-xs bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl">
          🧺 Cane Basket Ready
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
            <span className="text-[10px] font-black text-stone-900 mt-1 bg-white/90 px-2 py-0.5 rounded-full shadow-sm">
              {item.label}
            </span>
          </button>
        ))}

        {activeItems.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-center p-4">
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-tea-300 shadow-md">
              <p className="text-sm font-black text-tea-900">Watching the morning tea bushes...</p>
            </div>
          </div>
        )}
      </div>

      <GameResultModal
        isOpen={isGameOver}
        score={finalScore}
        accuracy={finalAccuracy}
        durationSeconds={durationSeconds}
        difficultyLevel={difficultyLevel}
        difficultyDecision={difficultyDecision}
        gameTitle="Chai Garden Harvest"
        onPlayAgain={() => startHarvestGame()}
        onBackToMenu={onBack}
      />
    </div>
  );
};
