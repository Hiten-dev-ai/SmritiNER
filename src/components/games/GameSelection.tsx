import React from 'react';
import { audioManager } from '../../services/audioManager';
import { Layers, Leaf, Brain, Palette, Heart, ChevronRight } from 'lucide-react';
import type { GameType } from '../../types';
import { useApp } from '../../context/AppContext';

interface GameSelectionProps {
  onSelectGame: (game: GameType) => void;
}

export const GameSelection: React.FC<GameSelectionProps> = ({ onSelectGame }) => {
  const { t } = useApp();
  const gamesList = [
    {
      id: 'majuli_memory' as GameType,
      title: t.majuliTitle,
      subtitle: t.majuliSubtitle,
      domain: t.memory,
      color: 'from-emerald-500 to-tea-700',
      borderColor: 'border-tea-500',
      bgColor: 'bg-emerald-50/80',
      icon: Layers,
      accentEmoji: '🦏',
    },
    {
      id: 'chai_harvest' as GameType,
      title: t.harvestTitle,
      subtitle: t.harvestSubtitle,
      domain: t.attention,
      color: 'from-green-500 to-emerald-800',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-50/80',
      icon: Leaf,
      accentEmoji: '🍃',
    },
    {
      id: 'daily_sequence' as GameType,
      title: t.sequenceTitle,
      subtitle: t.sequenceSubtitle,
      domain: t.executiveRecall,
      color: 'from-amber-500 to-orange-700',
      borderColor: 'border-amber-500',
      bgColor: 'bg-amber-50/80',
      icon: Brain,
      accentEmoji: '🌅',
    },
    {
      id: 'weave_pattern' as GameType,
      title: t.weaveTitle,
      subtitle: t.weaveSubtitle,
      domain: t.patterns,
      color: 'from-rose-500 to-gamusaRed-700',
      borderColor: 'border-gamusaRed-500',
      bgColor: 'bg-rose-50/80',
      icon: Palette,
      accentEmoji: '🧣',
    },
    {
      id: 'reminiscence_album' as GameType,
      title: t.albumTitle,
      subtitle: t.albumSubtitle,
      domain: t.reminiscence,
      color: 'from-sky-500 to-brahma-700',
      borderColor: 'border-brahma-500',
      bgColor: 'bg-sky-50/80',
      icon: Heart,
      accentEmoji: '📸',
    },
  ];

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-tea-950 tracking-tight">
          {t.selectActivity}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {gamesList.map((game) => {
          const IconComp = game.icon;

          return (
            <button
              key={game.id}
              onClick={() => {
                audioManager.playTap();
                onSelectGame(game.id);
              }}
              className={`tactile-btn relative min-h-[144px] rounded-3xl border-2 p-5 text-left ${game.borderColor} ${game.bgColor} flex flex-col justify-between group select-none transition-all hover:shadow-lg`}
            >
              <span className="pointer-events-none absolute bottom-3 right-3 text-4xl opacity-10">
                {game.accentEmoji}
              </span>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-sm font-black text-stone-800 shadow-xs">
                    {game.domain}
                  </span>
                  <div className={`p-2.5 rounded-2xl bg-gradient-to-tr ${game.color} text-white shadow-xs`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-xl font-black text-stone-950 leading-tight">
                  {game.title}
                </h3>
                <p className="mt-1 text-base font-semibold text-stone-700">
                  {game.subtitle}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-stone-200/80 pt-3 text-base font-black text-tea-900 group-hover:text-tea-700">
                <span>{t.startExercise}</span>
                <div className="w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
