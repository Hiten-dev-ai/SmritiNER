import React from 'react';
import { ArrowLeft, HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import type { DifficultyTier } from '../../types';

interface GameShellProps {
  title: string;
  instruction: string;
  onExit: () => void;
  status?: React.ReactNode;
  onHint?: () => void;
  level?: DifficultyTier;
  onLevelChange?: (level: DifficultyTier) => void;
  children: React.ReactNode;
}

export const GameShell: React.FC<GameShellProps> = ({ title, instruction, onExit, status, onHint, children }) => {
  const { isReadingAloud, speechSupported, readAloud, stopReadAloud, t } = useApp();
  const handleExit = () => { audioManager.playTap(); stopReadAloud(); onExit(); };
  const toggleReadAloud = () => {
    audioManager.playTap();
    if (isReadingAloud) stopReadAloud();
    else readAloud(`${title}. ${instruction}`);
  };

  return (
    <div className="min-h-[100dvh] min-w-0 bg-[#f8fbf9] text-stone-950">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur-md sm:px-5">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-2">
            <button onClick={handleExit} className="tactile-btn flex h-[48px] w-[48px] items-center justify-center rounded-xl border border-stone-300 bg-stone-100 text-stone-800" aria-label={t.exit}><ArrowLeft className="h-6 w-6" /></button>
            <div className="min-w-0 text-center"><h1 className="truncate text-lg font-black leading-tight text-tea-950 sm:text-xl">{title}</h1>{status && <div className="mt-0.5 truncate text-sm font-bold text-tea-800">{status}</div>}</div>
            <div className="flex items-center gap-2">
              {onHint && <button onClick={onHint} className="tactile-btn flex h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-amber-400 bg-amber-50 px-2 text-amber-950" aria-label={t.hint}><HelpCircle className="h-6 w-6" /></button>}
              <button onClick={toggleReadAloud} disabled={!speechSupported} className="tactile-btn flex h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-tea-300 bg-tea-50 px-2 text-tea-900 disabled:opacity-45" aria-label={isReadingAloud ? t.stopListening : t.listen} title={speechSupported ? undefined : t.speechUnavailable}>{isReadingAloud ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}</button>
            </div>
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-center text-base font-semibold leading-snug text-stone-700">{instruction}</p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6">{children}</main>
    </div>
  );
};
