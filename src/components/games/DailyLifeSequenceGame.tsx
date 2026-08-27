import React, { useState, useEffect, useRef } from 'react';
import { audioManager } from '../../services/audioManager';
import { aiEngine, type DifficultyDecision } from '../../services/aiEngine';
import { db } from '../../services/db';
import { GameResultModal } from './GameResultModal';
import { ArrowLeft, HelpCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import type { GameSession, DifficultyTier } from '../../types';
import { useApp } from '../../context/AppContext';

interface RoutineStep {
  id: number;
  order: number;
  labelAssamese: string;
  labelEnglish: string;
  emoji: string;
  description: string;
  timeCue: string;
}

const ALL_ROUTINE_STEPS: RoutineStep[] = [
  {
    id: 1,
    order: 1,
    labelAssamese: '১. ৰাতিপুৱাৰ খোজ কঢ়া',
    labelEnglish: '1. Morning Stroll',
    emoji: '🌅',
    description: 'Wake up with sunrise and fresh garden breeze',
    timeCue: '06:30 AM',
  },
  {
    id: 2,
    order: 2,
    labelAssamese: '২. গৰম লাল চাহ পান',
    labelEnglish: '2. Fresh Assam Morning Tea',
    emoji: '☕',
    description: 'Sip warm organic Assam tea',
    timeCue: '07:30 AM',
  },
  {
    id: 3,
    order: 3,
    labelAssamese: '৩. স্মৃতিৰ ঔষধ সেৱন',
    labelEnglish: '3. Morning Memory Pill',
    emoji: '💊',
    description: 'Take doctor prescribed cognitive tablet',
    timeCue: '08:00 AM',
  },
  {
    id: 4,
    order: 4,
    labelAssamese: '৪. নামঘৰৰ প্ৰাৰ্থনা',
    labelEnglish: '4. Traditional Prayer / Namghar',
    emoji: '🪔',
    description: 'Light diya and quiet meditation',
    timeCue: '09:00 AM',
  },
  {
    id: 5,
    order: 5,
    labelAssamese: '৫. ৰক্তচাপ পৰীক্ষা',
    labelEnglish: '5. Blood Pressure Check',
    emoji: '🩺',
    description: 'Record morning vitals with caregiver',
    timeCue: '11:00 AM',
  },
  {
    id: 6,
    order: 6,
    labelAssamese: '৬. দুপৰীয়াৰ ভাত-আহাৰ',
    labelEnglish: '6. Nutritious Lunch',
    emoji: '🍲',
    description: 'Traditional wholesome meal',
    timeCue: '01:00 PM',
  },
  {
    id: 7,
    order: 7,
    labelAssamese: '৭. বিয়লিৰ স্মৃতিমন্থন',
    labelEnglish: '7. Afternoon Reminiscence',
    emoji: '📖',
    description: 'Look through family album and regional folklore',
    timeCue: '04:00 PM',
  },
];

interface DailyLifeSequenceGameProps {
  onBack: () => void;
}

const getCurrentTime = () => Date.now();

export const DailyLifeSequenceGame: React.FC<DailyLifeSequenceGameProps> = ({ onBack }) => {
  const { t } = useApp();
  const [availableSteps, setAvailableSteps] = useState<RoutineStep[]>([]);
  const [slottedSteps, setSlottedSteps] = useState<(RoutineStep | null)[]>([]);
  const [hintStepId, setHintStepId] = useState<number | null>(null);
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyTier>(2);
  const [hesitationsCount, setHesitationsCount] = useState<number>(0);
  const [hintsUsedCount, setHintsUsedCount] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [finalAccuracy, setFinalAccuracy] = useState<number>(0);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [difficultyDecision, setDifficultyDecision] = useState<DifficultyDecision>();

  const lastActionTimeRef = useRef<number>(0);
  const hesitationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    hesitationTimerRef.current = setInterval(() => {
      const elapsed = getCurrentTime() - lastActionTimeRef.current;
      if (elapsed >= 4500 && hintStepId === null) {
        const nextSlotIndex = slottedSteps.findIndex((s) => s === null);
        if (nextSlotIndex !== -1) {
          const expectedOrder = nextSlotIndex + 1;
          const nextStep = availableSteps.find((s) => s.order === expectedOrder);
          if (nextStep) {
            setHintStepId(nextStep.id);
            setHesitationsCount((prev) => prev + 1);
            setHintsUsedCount((prev) => prev + 1);
          }
        }
      }
    }, 1000);

    return () => {
      if (hesitationTimerRef.current) clearInterval(hesitationTimerRef.current);
    };
  }, [availableSteps, slottedSteps, hintStepId]);

  async function startNewGame(targetLevel?: DifficultyTier) {
    let chosenLevel: DifficultyTier = targetLevel || difficultyLevel;

    if (!targetLevel) {
      const history = await db.gameSessions.toArray();
      chosenLevel = aiEngine.calculateDynamicDifficulty('daily_sequence', history).level;
    }

    setDifficultyLevel(chosenLevel);

    const stepCount = chosenLevel === 1 ? 3 : chosenLevel === 2 ? 4 : chosenLevel === 3 ? 5 : chosenLevel === 4 ? 6 : 7;
    const targetSteps = ALL_ROUTINE_STEPS.slice(0, stepCount);
    const shuffled = [...targetSteps].sort(() => Math.random() - 0.5);

    setAvailableSteps(shuffled);
    setSlottedSteps(new Array(stepCount).fill(null));
    setHintStepId(null);
    setHesitationsCount(0);
    setHintsUsedCount(0);
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

  const handleSelectStep = (step: RoutineStep) => {
    audioManager.playTap();
    lastActionTimeRef.current = getCurrentTime();
    setHintStepId(null);

    const firstEmptyIndex = slottedSteps.findIndex((s) => s === null);
    if (firstEmptyIndex === -1) return;

    const newSlotted = [...slottedSteps];
    newSlotted[firstEmptyIndex] = step;
    setSlottedSteps(newSlotted);

    const newAvailable = availableSteps.filter((s) => s.id !== step.id);
    setAvailableSteps(newAvailable);

    if (firstEmptyIndex === slottedSteps.length - 1) {
      verifySequence(newSlotted);
    }
  };

  const handleRemoveFromSlot = (slotIndex: number) => {
    audioManager.playTap();
    lastActionTimeRef.current = getCurrentTime();
    setHintStepId(null);

    const stepToRemove = slottedSteps[slotIndex];
    if (!stepToRemove) return;

    const newSlotted = [...slottedSteps];
    newSlotted[slotIndex] = null;
    setSlottedSteps(newSlotted);

    setAvailableSteps((prev) => [...prev, stepToRemove]);
  };

  const verifySequence = async (currentSlots: (RoutineStep | null)[]) => {
    let correctCount = 0;
    currentSlots.forEach((slot, idx) => {
      if (slot && slot.order === idx + 1) {
        correctCount += 1;
      }
    });

    const totalSteps = currentSlots.length;
    const accuracy = Math.round((correctCount / totalSteps) * 100);
    const elapsedSec = Math.max(1, Math.round((getCurrentTime() - startTime) / 1000));

    if (correctCount === totalSteps) {
      audioManager.playSuccess();
      const score = Math.max(50, 100 - hintsUsedCount * 8 - hesitationsCount * 4 + difficultyLevel * 4);
      setFinalScore(Math.min(100, score));
      setFinalAccuracy(accuracy);
      setDurationSeconds(elapsedSec);
      setIsGameOver(true);

      const session: GameSession = {
        patientId: 'pat-ner-001',
        gameType: 'daily_sequence',
        gameTitle: 'Daily Life Sequence',
        score: Math.min(100, score),
        maxPossibleScore: 100,
        accuracy,
        durationSeconds: elapsedSec,
        difficultyLevel,
        hesitationsCount,
        hintsUsedCount,
        avgReactionTimeMs: Math.round((elapsedSec / totalSteps) * 1000),
        completedAt: new Date().toISOString(),
        synced: false,
      };

      await db.gameSessions.add(session);
      const history = await db.gameSessions.toArray();
      setDifficultyDecision(aiEngine.calculateDynamicDifficulty('daily_sequence', history));
    } else {
      audioManager.playTryAgain();
    }
  };

  const triggerManualHint = () => {
    audioManager.playTap();
    const nextSlotIndex = slottedSteps.findIndex((s) => s === null);
    if (nextSlotIndex !== -1) {
      const expectedOrder = nextSlotIndex + 1;
      const nextStep = availableSteps.find((s) => s.order === expectedOrder);
      if (nextStep) {
        setHintStepId(nextStep.id);
        setHintsUsedCount((prev) => prev + 1);
      }
    }
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
            {t.sequenceTitle}
          </h2>
          <p className="text-xs text-stone-500 font-semibold">
            Order daily healthcare & wellness steps in proper chronological order
          </p>
        </div>

        {/* Difficulty Selector */}
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
                    ? 'bg-amber-600 text-white shadow-sm'
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

      {/* Target Timeline Slots */}
      <div className="mb-8 bg-white rounded-3xl p-5 sm:p-6 border-2 border-tea-600/30 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-black text-tea-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-tea-700" />
            <span>Timeline Order ({slottedSteps.length} Steps)</span>
          </h3>
          <span className="text-xs font-bold bg-tea-50 text-tea-800 px-3 py-1 rounded-full border border-tea-200">
            Tap cards below in order
          </span>
        </div>

        <div className={`grid gap-3 sm:gap-4 ${
          slottedSteps.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        }`}>
          {slottedSteps.map((step, idx) => (
            <div
              key={idx}
              onClick={() => step && handleRemoveFromSlot(idx)}
              className={`tactile-btn min-h-[120px] sm:min-h-[135px] rounded-2xl p-3 border-2 flex flex-col items-center justify-center text-center transition-all ${
                step
                  ? 'bg-tea-50/90 border-tea-600 shadow-md cursor-pointer hover:bg-tea-100'
                  : 'bg-stone-50 border-dashed border-stone-300 text-stone-400'
              }`}
            >
              {step ? (
                <>
                  <span className="text-2xl sm:text-3xl mb-1">{step.emoji}</span>
                  <span className="text-xs sm:text-sm font-black text-tea-950 leading-tight">
                    {step.labelEnglish}
                  </span>
                  <span className="text-[11px] font-semibold text-stone-600 mt-0.5">
                    {step.timeCue}
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-black text-stone-600 mb-1">
                    {idx + 1}
                  </div>
                  <span className="text-[11px] font-bold text-stone-400">Step {idx + 1}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Available Cards Pool */}
      <div>
        <h4 className="text-xs font-black text-stone-500 uppercase tracking-wider mb-3">
          Available Sequence Cards (Tap in chronological order):
        </h4>
        <div className={`grid gap-3 sm:gap-4 ${
          availableSteps.length <= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {availableSteps.map((step) => {
            const isHinted = hintStepId === step.id;
            return (
              <button
                key={step.id}
                onClick={() => handleSelectStep(step)}
                className={`tactile-btn p-4 rounded-2xl bg-white hover:bg-tea-50/60 border-2 text-left shadow-sm flex flex-col justify-between transition-all ${
                  isHinted ? 'ai-hint-active border-amber-500' : 'border-stone-200 hover:border-tea-400'
                }`}
              >
                <div className="flex items-center space-x-3 mb-1">
                  <span className="text-2xl sm:text-3xl">{step.emoji}</span>
                  <div>
                    <h5 className="text-xs sm:text-sm font-black text-stone-900 leading-tight">
                      {step.labelEnglish}
                    </h5>
                    <p className="text-[11px] font-semibold text-stone-500">{step.labelAssamese}</p>
                  </div>
                </div>
                <p className="text-[11px] text-stone-600 italic mt-1">{step.description}</p>
              </button>
            );
          })}
        </div>

        {availableSteps.length === 0 && !isGameOver && (
          <div className="text-center py-4">
            <button
              onClick={() => startNewGame(difficultyLevel)}
              className="tactile-btn inline-flex items-center space-x-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sequence</span>
            </button>
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
        gameTitle={t.sequenceTitle}
        onPlayAgain={() => startNewGame()}
        onBackToMenu={onBack}
      />
    </div>
  );
};
