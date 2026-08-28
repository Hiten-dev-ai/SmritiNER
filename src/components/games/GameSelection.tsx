import React from 'react';
import { ChevronRight, Clock3, Flower2, Sparkles } from 'lucide-react';
import type { JourneyGameSession } from '../../types';
import {
  journeyDefinitions,
  localizedGame,
  type JourneyGameType,
} from '../../services/journeyEngine';
import { audioManager } from '../../services/audioManager';
import { useApp } from '../../context/AppContext';

interface GameSelectionProps {
  onSelectGame: (game: JourneyGameType) => void;
  sessions: JourneyGameSession[];
}

export const GameSelection: React.FC<GameSelectionProps> = ({ onSelectGame, sessions }) => {
  const { selectedLanguage, gameProgress } = useApp();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-tea-100 px-3 py-1 text-sm font-black text-tea-800">
            <Flower2 className="h-4 w-4" />
            Your Memory Garden
          </span>
          <h2 className="mt-2 text-3xl font-black text-tea-950">Choose a fresh memory game</h2>
          <p className="mt-1 text-base font-semibold text-stone-600">
            Every session uses a fresh mix. There is no rush and no failing.
          </p>
        </div>
        <span className="text-sm font-bold text-stone-500">12 gentle stages per game</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {journeyDefinitions.map((game, index) => {
          const localized = localizedGame(game.id, selectedLanguage);
          const progress = gameProgress[game.id];
          const stage = progress?.recommendedStage || progress?.unlockedStage || 1;
          const completed = sessions.filter(
            (session) => session.gameType === game.id && session.completionStatus === 'completed'
          ).length;

          return (
            <button
              key={game.id}
              onClick={() => {
                audioManager.play('tap');
                onSelectGame(game.id);
              }}
              className="group relative min-h-56 overflow-hidden rounded-[1.75rem] border-2 border-white bg-white p-5 text-left shadow-md transition hover:-translate-y-1 hover:shadow-xl"
            >
              <span className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${game.colors}`} />
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${game.colors} text-4xl shadow-md`}
              >
                {game.emoji}
              </span>
              <span className="mt-4 block text-xl font-black text-stone-950">
                {localized.title}
              </span>
              <span className="mt-1 block text-base font-semibold text-stone-600">
                {localized.subtitle}
              </span>

              <span className="mt-5 flex items-center justify-between border-t border-stone-100 pt-3">
                <span className="flex items-center gap-3 text-sm font-bold text-stone-600">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-assamGold-600" />
                    Stage {stage} of 12
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock3 className="h-4 w-4" />
                    {game.estimatedMinutes} min
                  </span>
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tea-100 text-tea-800 group-hover:bg-tea-800 group-hover:text-white transition">
                  <ChevronRight />
                </span>
              </span>

              {completed > 0 && (
                <span className="absolute right-4 top-4 rounded-full bg-white/95 px-2.5 py-1 text-xs font-black text-tea-800 shadow">
                  {completed} journeys
                </span>
              )}
              {index < 3 && !completed && (
                <span className="absolute right-4 top-4 rounded-full bg-assamGold-300 px-2.5 py-1 text-xs font-black text-stone-950">
                  Recommended
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
