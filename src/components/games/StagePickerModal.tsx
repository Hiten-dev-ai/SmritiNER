import React from 'react';
import { HeartHandshake, Lock, Sparkles, X } from 'lucide-react';
import type { JourneyGameType } from '../../types';
import { getGameDefinition, profileForStage } from '../../services/journeyEngine';
import { audioManager } from '../../services/audioManager';

interface StagePickerModalProps {
  open: boolean;
  onClose: () => void;
  gameType: JourneyGameType;
  unlockedStage: number;
  recommendedStage: number;
  onSelectStage: (stage: number, source: 'recommended' | 'manual') => void;
}

export const StagePickerModal: React.FC<StagePickerModalProps> = ({
  open,
  onClose,
  gameType,
  unlockedStage = 1,
  recommendedStage = 1,
  onSelectStage,
}) => {
  if (!open) return null;

  const def = getGameDefinition(gameType);
  const stages = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleSelect = (stage: number) => {
    if (stage > unlockedStage) return;
    audioManager.play('tap');
    const source = stage === recommendedStage ? 'recommended' : 'manual';
    onSelectStage(stage, source);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/60 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stage-picker-title"
    >
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[85dvh] sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tea-100 text-2xl">
              {def.emoji}
            </span>
            <div>
              <h2 id="stage-picker-title" className="text-xl font-black text-stone-900">
                Choose Stage — {def.title}
              </h2>
              <p className="text-xs font-semibold text-stone-500">
                Stage {unlockedStage} of 12 unlocked · Play any unlocked stage for comfort
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stage Grid */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {stages.map((st) => {
              const isUnlocked = st <= unlockedStage;
              const isRecommended = st === recommendedStage;
              const isPastStage = st < unlockedStage;
              const profile = profileForStage(gameType, st);

              let itemDescription = `${profile.memoryLoad} items`;
              if (gameType === 'mahjong_memory') {
                itemDescription = `${profile.tileCount || 6} tiles (${profile.mode === 'visible-match' ? 'Visible' : 'Hidden'})`;
              }

              return (
                <button
                  key={st}
                  disabled={!isUnlocked}
                  onClick={() => handleSelect(st)}
                  className={`relative flex flex-col items-center justify-between rounded-2xl border-2 p-4 text-center transition ${
                    isRecommended
                      ? 'border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-400'
                      : isUnlocked
                      ? 'border-stone-200 bg-white hover:border-tea-500 hover:bg-tea-50/50 shadow-sm'
                      : 'border-stone-100 bg-stone-50/60 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Recommended Badge */}
                  {isRecommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-700 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" /> Next Goal
                    </span>
                  )}

                  {/* Stage Number & Icon */}
                  <div className="mt-1 flex items-center justify-center">
                    {isUnlocked ? (
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-lg ${
                          isRecommended
                            ? 'bg-emerald-600 text-white'
                            : isPastStage
                            ? 'bg-tea-100 text-tea-900'
                            : 'bg-stone-100 text-stone-900'
                        }`}
                      >
                        {st}
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-200 text-stone-400">
                        <Lock className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  {/* Stage Title */}
                  <div className="mt-2">
                    <span className="block text-sm font-black text-stone-900">Stage {st}</span>
                    <span className="block text-[11px] font-semibold text-stone-500">
                      {itemDescription}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-3 w-full border-t border-stone-100 pt-2 text-[11px] font-bold">
                    {isRecommended ? (
                      <span className="text-emerald-700 font-black">Play Now</span>
                    ) : isPastStage ? (
                      <span className="flex items-center justify-center gap-1 text-tea-700">
                        <HeartHandshake className="h-3 w-3" /> Comfort
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-stone-600">Unlocked</span>
                    ) : (
                      <span className="text-stone-400">Locked</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-amber-50/80 p-4 border border-amber-200 text-amber-900 text-xs font-semibold">
            <HeartHandshake className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
            <p>
              <strong>Comfort Replay:</strong> Playing earlier stages is encouraged whenever you want a relaxed session. Unlocked stages are never locked again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
