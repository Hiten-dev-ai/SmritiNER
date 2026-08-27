import React, { useState, useEffect, useRef } from 'react';
import { audioManager } from '../../services/audioManager';
import { aiEngine, type DifficultyDecision } from '../../services/aiEngine';
import { db } from '../../services/db';
import { GameResultModal } from './GameResultModal';
import { ArrowLeft, HelpCircle, Palette } from 'lucide-react';
import type { GameSession, DifficultyTier } from '../../types';
import { useApp } from '../../context/AppContext';

interface WeavePatternRound {
  id: number;
  level: DifficultyTier;
  theme: string;
  sequence: { emoji: string; label: string }[];
  missingIndex: number;
  correctAnswer: { emoji: string; label: string };
  options: { emoji: string; label: string }[];
  heritageLore: string;
}

const WEAVE_ROUNDS: WeavePatternRound[] = [
  {
    id: 1,
    level: 1,
    theme: 'Assamese Phulam Gamosa (ফুলাম গামোচা)',
    sequence: [
      { emoji: '🌺', label: 'Red Floral' },
      { emoji: '🔻', label: 'Chevron' },
      { emoji: '🌺', label: 'Red Floral' },
      { emoji: '🔻', label: 'Chevron' },
      { emoji: '❓', label: 'Missing' },
    ],
    missingIndex: 4,
    correctAnswer: { emoji: '🌺', label: 'Red Floral' },
    options: [
      { emoji: '🌺', label: 'Red Floral' },
      { emoji: '🟡', label: 'Golden Circle' },
      { emoji: '🎋', label: 'Bamboo' },
    ],
    heritageLore: 'The red floral Kingkhap border symbolizes sacred reverence in Assamese handlooms.',
  },
  {
    id: 2,
    level: 2,
    theme: 'Manipuri Phanek Diamond Weave (মণিপুৰী ফানেক)',
    sequence: [
      { emoji: '💎', label: 'Silver Diamond' },
      { emoji: '💠', label: 'Lotus Bloom' },
      { emoji: '💎', label: 'Silver Diamond' },
      { emoji: '❓', label: 'Missing' },
      { emoji: '💎', label: 'Silver Diamond' },
    ],
    missingIndex: 3,
    correctAnswer: { emoji: '💠', label: 'Lotus Bloom' },
    options: [
      { emoji: '💠', label: 'Lotus Bloom' },
      { emoji: '🪨', label: 'Stone' },
      { emoji: '🍂', label: 'Leaf' },
    ],
    heritageLore: 'Manipuri handlooms feature sacred lotus and river wave embroidery.',
  },
  {
    id: 3,
    level: 3,
    theme: 'Naga Warrior Shawl Rhythm (নাগা শাল)',
    sequence: [
      { emoji: '🔺', label: 'Crimson Peak' },
      { emoji: '⬛', label: 'Black Stripe' },
      { emoji: '🔺', label: 'Crimson Peak' },
      { emoji: '⬛', label: 'Black Stripe' },
      { emoji: '❓', label: 'Missing' },
    ],
    missingIndex: 4,
    correctAnswer: { emoji: '🔺', label: 'Crimson Peak' },
    options: [
      { emoji: '🔺', label: 'Crimson Peak' },
      { emoji: '🔵', label: 'Blue Circle' },
      { emoji: '🌿', label: 'Green Bush' },
      { emoji: '🟡', label: 'Yellow Dot' },
    ],
    heritageLore: 'Bold red and black lines represent bravery in traditional Naga textiles.',
  },
  {
    id: 4,
    level: 4,
    theme: 'Mizo Puan Complex Lattice (মিজো পুয়ান)',
    sequence: [
      { emoji: '🔷', label: 'Cyan Diamond' },
      { emoji: '🔶', label: 'Amber Diamond' },
      { emoji: '⬛', label: 'Black Line' },
      { emoji: '🔷', label: 'Cyan Diamond' },
      { emoji: '❓', label: 'Missing' },
      { emoji: '⬛', label: 'Black Line' },
    ],
    missingIndex: 4,
    correctAnswer: { emoji: '🔶', label: 'Amber Diamond' },
    options: [
      { emoji: '🔶', label: 'Amber Diamond' },
      { emoji: '🔷', label: 'Cyan Diamond' },
      { emoji: '🔴', label: 'Red Circle' },
      { emoji: '🎋', label: 'Bamboo' },
    ],
    heritageLore: 'Mizo Puan textiles feature geometric diamond lattices woven with silk threads.',
  },
  {
    id: 5,
    level: 5,
    theme: 'Bodo Dokhona Sacred Bloom (বড়ো দখনাহ)',
    sequence: [
      { emoji: '🌸', label: 'Agor Lotus' },
      { emoji: '🌿', label: 'Fern Leaf' },
      { emoji: '🦚', label: 'Peacock Eye' },
      { emoji: '🌸', label: 'Agor Lotus' },
      { emoji: '🌿', label: 'Fern Leaf' },
      { emoji: '❓', label: 'Missing' },
    ],
    missingIndex: 5,
    correctAnswer: { emoji: '🦚', label: 'Peacock Eye' },
    options: [
      { emoji: '🦚', label: 'Peacock Eye' },
      { emoji: '🌸', label: 'Agor Lotus' },
      { emoji: '💎', label: 'Diamond' },
      { emoji: '🍁', label: 'Autumn Leaf' },
    ],
    heritageLore: 'Master weavers embed intricate Hajw Agor (mountain motifs) and peacock symbols.',
  },
];

interface WeavePatternGameProps {
  onBack: () => void;
}

const getCurrentTime = () => Date.now();

export const WeavePatternGame: React.FC<WeavePatternGameProps> = ({ onBack }) => {
  const { t } = useApp();
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hintActive, setHintActive] = useState<boolean>(false);
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyTier>(2);
  const [hesitationsCount, setHesitationsCount] = useState<number>(0);
  const [hintsUsedCount, setHintsUsedCount] = useState<number>(0);
  const [correctRounds, setCorrectRounds] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [difficultyDecision, setDifficultyDecision] = useState<DifficultyDecision>();

  const lastActionTimeRef = useRef<number>(0);
  const hesitationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    hesitationTimerRef.current = setInterval(() => {
      const elapsed = getCurrentTime() - lastActionTimeRef.current;
      if (elapsed >= 4500 && !hintActive) {
        setHintActive(true);
        setHesitationsCount((prev) => prev + 1);
        setHintsUsedCount((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      if (hesitationTimerRef.current) clearInterval(hesitationTimerRef.current);
    };
  }, [currentRoundIndex, hintActive]);

  async function startNewGame(targetLevel?: DifficultyTier) {
    let chosenLevel: DifficultyTier = targetLevel || difficultyLevel;

    if (!targetLevel) {
      const history = await db.gameSessions.toArray();
      chosenLevel = aiEngine.calculateDynamicDifficulty('weave_pattern', history).level;
    }

    setDifficultyLevel(chosenLevel);
    setCurrentRoundIndex(chosenLevel - 1);
    setSelectedOption(null);
    setHintActive(false);
    setHesitationsCount(0);
    setHintsUsedCount(0);
    setCorrectRounds(0);
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

  const handleOptionSelect = (option: { emoji: string; label: string }) => {
    audioManager.playTap();
    lastActionTimeRef.current = getCurrentTime();
    setSelectedOption(option.emoji);

    const round = WEAVE_ROUNDS[currentRoundIndex];
    const isCorrect = option.emoji === round.correctAnswer.emoji;

    if (isCorrect) {
      audioManager.playSuccess();
      const updatedCorrect = correctRounds + 1;
      setCorrectRounds(updatedCorrect);

      setTimeout(() => {
        if (currentRoundIndex + 1 < WEAVE_ROUNDS.length) {
          setCurrentRoundIndex((prev) => prev + 1);
          setSelectedOption(null);
          setHintActive(false);
          lastActionTimeRef.current = getCurrentTime();
        } else {
          finishGame(updatedCorrect);
        }
      }, 900);
    } else {
      audioManager.playTryAgain();
      setTimeout(() => {
        setSelectedOption(null);
      }, 700);
    }
  };

  const finishGame = async (finalCorrect: number) => {
    const totalRounds = WEAVE_ROUNDS.length;
    const accuracy = Math.round((finalCorrect / totalRounds) * 100);
    const elapsedSec = Math.max(1, Math.round((getCurrentTime() - startTime) / 1000));
    const score = Math.min(100, Math.max(50, accuracy + difficultyLevel * 4));

    setDurationSeconds(elapsedSec);
    setIsGameOver(true);

    const session: GameSession = {
      patientId: 'pat-ner-001',
      gameType: 'weave_pattern',
      gameTitle: 'Weave the Pattern',
      score,
      maxPossibleScore: 100,
      accuracy,
      durationSeconds: elapsedSec,
      difficultyLevel,
      hesitationsCount,
      hintsUsedCount,
      avgReactionTimeMs: Math.round((elapsedSec / totalRounds) * 1000),
      completedAt: new Date().toISOString(),
      synced: false,
    };

    await db.gameSessions.add(session);
    const history = await db.gameSessions.toArray();
    setDifficultyDecision(aiEngine.calculateDynamicDifficulty('weave_pattern', history));
  };

  const triggerManualHint = () => {
    audioManager.playTap();
    setHintActive(true);
    setHintsUsedCount((prev) => prev + 1);
  };

  const currentRound = WEAVE_ROUNDS[currentRoundIndex] || WEAVE_ROUNDS[0];

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
            {t.weaveTitle}
          </h2>
          <p className="text-xs text-stone-500 font-semibold">
            Recognize and complete traditional geometric handloom motifs
          </p>
        </div>

        {/* Level Selector */}
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
                    ? 'bg-gamusaRed-600 text-white shadow-sm'
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

      {/* Round & Theme Card */}
      <div className="bg-white rounded-3xl p-6 border-2 border-gamusaRed-500/20 shadow-md mb-8">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-6">
          <div className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-gamusaRed-600" />
            <h3 className="text-base sm:text-lg font-black text-stone-900">{currentRound.theme}</h3>
          </div>
          <span className="text-xs font-bold bg-gamusaRed-100 text-gamusaRed-700 px-3 py-1 rounded-full">
            Tier {difficultyLevel} • Pattern {currentRoundIndex + 1}
          </span>
        </div>

        {/* Handloom Motif Sequence Display */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 my-6 p-4 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
          {currentRound.sequence.map((motif, idx) => {
            const isMissingSlot = idx === currentRound.missingIndex;

            return (
              <div
                key={idx}
                className={`w-14 h-14 sm:w-18 sm:h-18 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${
                  isMissingSlot
                    ? 'bg-amber-100 border-amber-500 text-amber-900 animate-pulse scale-105 shadow-md'
                    : 'bg-white border-stone-200 shadow-sm'
                }`}
              >
                <span className="text-2xl sm:text-3xl">
                  {isMissingSlot && selectedOption ? selectedOption : motif.emoji}
                </span>
                <span className="text-[9px] font-bold text-stone-500 mt-0.5 truncate max-w-[55px]">
                  {motif.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-center text-stone-600 italic bg-amber-50/70 p-2 rounded-xl border border-amber-200/60">
          {currentRound.heritageLore}
        </p>
      </div>

      {/* Options Selection */}
      <div>
        <h4 className="text-xs font-black text-stone-500 uppercase tracking-wider mb-3 text-center">
          Which motif correctly completes the weave?
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
          {currentRound.options.map((opt, idx) => {
            const isCorrect = opt.emoji === currentRound.correctAnswer.emoji;
            const isHinted = hintActive && isCorrect;

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(opt)}
                className={`tactile-btn p-4 rounded-2xl bg-white hover:bg-tea-50 border-2 flex flex-col items-center justify-center transition-all shadow-sm ${
                  isHinted ? 'ai-hint-active' : 'border-stone-200 hover:border-tea-500'
                }`}
              >
                <span className="text-3xl sm:text-4xl mb-1">{opt.emoji}</span>
                <span className="text-xs font-bold text-stone-800">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <GameResultModal
        isOpen={isGameOver}
        score={Math.round((correctRounds / WEAVE_ROUNDS.length) * 100)}
        accuracy={Math.round((correctRounds / WEAVE_ROUNDS.length) * 100)}
        durationSeconds={durationSeconds}
        difficultyLevel={difficultyLevel}
        difficultyDecision={difficultyDecision}
        gameTitle={t.weaveTitle}
        onPlayAgain={() => startNewGame()}
        onBackToMenu={onBack}
      />
    </div>
  );
};
