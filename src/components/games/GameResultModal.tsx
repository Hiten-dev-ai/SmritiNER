import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { audioManager } from '../../services/audioManager';
import { Trophy, Star, RefreshCw, ArrowLeft, Brain, Sparkles } from 'lucide-react';
import type { DifficultyDecision } from '../../services/aiEngine';
import { useApp } from '../../context/AppContext';

interface GameResultModalProps {
  isOpen: boolean;
  score: number;
  accuracy: number;
  durationSeconds: number;
  difficultyLevel: number;
  difficultyDecision?: DifficultyDecision;
  gameTitle: string;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({
  isOpen,
  score,
  accuracy,
  durationSeconds,
  difficultyLevel,
  difficultyDecision,
  gameTitle,
  onPlayAgain,
  onBackToMenu,
}) => {
  const { t } = useApp();
  useEffect(() => {
    if (isOpen) {
      audioManager.playVictory();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2a7c44', '#f59e0b', '#0284c7', '#e11d48'],
        });
      } catch {
        // safe fallback
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getPraiseMessage = () => {
    if (accuracy >= 90) return { assamese: 'বহুত ভাল! (Outstanding!)', sub: 'Your memory and focus are sharp today!' };
    if (accuracy >= 70) return { assamese: 'খুব ভাল! (Wonderful Work!)', sub: 'Great effort and steady attention!' };
    return { assamese: 'ভাল চেষ্টা! (Good Effort!)', sub: 'Every practice strengthens your mind!' };
  };

  const praise = getPraiseMessage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border-4 border-tea-500 text-center relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-assamGold-300/30 rounded-full blur-2xl" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-tea-300/30 rounded-full blur-2xl" />

        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-assamGold-500 to-amber-300 text-stone-900 shadow-xl mb-4 animate-bounce">
          <Trophy className="w-12 h-12" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-tea-900 leading-tight">
          {praise.assamese}
        </h2>
        <p className="text-xs font-bold text-tea-700 mb-1">{gameTitle}</p>
        <p className="text-sm sm:text-base font-semibold text-stone-600 mb-6">
          {praise.sub}
        </p>

        {/* Stars Rating */}
        <div className="flex justify-center space-x-2 mb-6">
          {[1, 2, 3].map((starIdx) => {
            const isEarned =
              starIdx === 1 ||
              (starIdx === 2 && accuracy >= 65) ||
              (starIdx === 3 && accuracy >= 85);

            return (
              <div
                key={starIdx}
                className={`p-3 rounded-2xl transition-all ${
                  isEarned
                    ? 'bg-amber-100 text-amber-500 scale-110 shadow-md'
                    : 'bg-stone-100 text-stone-300'
                }`}
              >
                <Star className="w-8 h-8 fill-current" />
              </div>
            );
          })}
        </div>

        {/* Game Stats Card */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-tea-50/80 rounded-2xl border border-tea-200 mb-6">
          <div>
            <span className="text-xs font-bold text-tea-800 uppercase tracking-wider block">{t.score}</span>
            <span className="text-2xl font-black text-tea-950">{score}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-tea-800 uppercase tracking-wider block">{t.accuracy}</span>
            <span className="text-2xl font-black text-emerald-700">{accuracy}%</span>
          </div>
          <div>
            <span className="text-xs font-bold text-tea-800 uppercase tracking-wider block">{t.time}</span>
            <span className="text-2xl font-black text-tea-950">{durationSeconds}s</span>
          </div>
        </div>

        {/* Explainable on-device difficulty decision */}
        <div aria-live="polite" className="text-left text-sm text-tea-900 bg-tea-100/80 py-3 px-4 rounded-xl mb-6">
          <div className="flex items-center justify-center gap-2 font-bold">
            <Brain className="w-4 h-4 text-tea-700" />
            <span>Explainable on-device adaptation</span>
            <Sparkles className="w-3.5 h-3.5 text-assamGold-600" />
          </div>
          <p className="mt-2 text-center font-semibold">
            {difficultyDecision?.reason ?? `This game was completed at level ${difficultyLevel}.`}
          </p>
          {difficultyDecision && (
            <p className="mt-1 text-center text-xs text-tea-700">
              Next level: {difficultyDecision.level} · Last games averaged {difficultyDecision.averageAccuracy}% accuracy and {difficultyDecision.averageHesitations} hesitations.
            </p>
          )}
        </div>

        {/* Large Tactile Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => {
              audioManager.playTap();
              onPlayAgain();
            }}
            className="tactile-btn py-4 px-6 rounded-2xl bg-tea-600 hover:bg-tea-700 text-white font-bold text-lg flex items-center justify-center space-x-2 shadow-lg shadow-tea-600/30"
          >
            <RefreshCw className="w-5 h-5" />
            <span>{t.playAgain}</span>
          </button>

          <button
            onClick={() => {
              audioManager.playTap();
              onBackToMenu();
            }}
            className="tactile-btn py-4 px-6 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-lg flex items-center justify-center space-x-2 border-2 border-stone-300"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t.backToMenu}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
