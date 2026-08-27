import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { ArrowLeft, Brain, RefreshCw, Sparkles, Trophy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import type { DifficultyDecision } from '../../services/aiEngine';

interface GameResultModalProps {
  isOpen: boolean;
  accuracy: number;
  difficultyDecision?: DifficultyDecision;
  gameTitle: string;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({ isOpen, accuracy, difficultyDecision, gameTitle, onPlayAgain, onBackToMenu }) => {
  const { t, stopReadAloud } = useApp();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    titleRef.current?.focus();
    audioManager.playVictory();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try { confetti({ particleCount: 45, spread: 60, origin: { y: 0.45 }, colors: ['#2a7c44', '#f59e0b', '#0284c7'] }); } catch { /* visual enhancement only */ }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')).filter((element) => !element.hasAttribute('disabled'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      stopReadAloud();
      previousFocus?.focus();
    };
  }, [isOpen, stopReadAloud]);

  if (!isOpen) return null;

  const praise = accuracy >= 90 ? t.outstanding : accuracy >= 70 ? t.wonderfulWork : t.goodEffort;
  const encouragement = accuracy >= 90 ? t.encouragementStrong : accuracy >= 70 ? t.encouragementSteady : t.encouragementPractice;
  const reasons: Record<DifficultyDecision['reasonCode'], string> = {
    start: t.adaptationStart,
    harder: t.adaptationHarder,
    highest: t.adaptationHighest,
    gentler: t.adaptationGentler,
    gentlest: t.adaptationGentlest,
    same: t.adaptationSame,
    reminiscence: t.adaptationReminiscence,
  };
  const nextStep = difficultyDecision ? reasons[difficultyDecision.reasonCode] : t.adaptationSame;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden bg-white sm:flex sm:items-center sm:justify-center sm:bg-black/60 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="game-result-title">
      <div ref={panelRef} className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg sm:rounded-3xl sm:border-4 sm:border-tea-500 sm:shadow-2xl">
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-5 pb-4 pt-[calc(1.25rem+env(safe-area-inset-top))] text-center sm:p-7">
          <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-assamGold-500 to-amber-300 text-stone-950 shadow-lg"><Trophy className="h-9 w-9" /></span>
          <h2 ref={titleRef} tabIndex={-1} id="game-result-title" className="mt-4 text-3xl font-black leading-tight text-tea-950 outline-none">{praise}</h2>
          <p className="mt-1 text-base font-bold text-tea-800">{gameTitle}</p>
          <p className="mt-3 max-w-sm text-lg font-semibold leading-relaxed text-stone-700">{encouragement}</p>

          <section className="mt-6 w-full max-w-md rounded-3xl border-2 border-tea-300 bg-tea-50 p-5" aria-labelledby="next-step-title">
            <div className="flex items-center justify-center gap-2 text-tea-900"><Brain className="h-6 w-6" /><h3 id="next-step-title" className="text-lg font-black">{t.nextStep}</h3><Sparkles className="h-5 w-5 text-assamGold-600" /></div>
            <p className="mt-3 text-lg font-semibold leading-relaxed text-tea-950">{nextStep}</p>
          </section>
        </div>

        <div className="grid shrink-0 gap-3 border-t border-stone-200 bg-white/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur sm:grid-cols-2 sm:rounded-b-3xl">
          <button onClick={() => { audioManager.playTap(); onPlayAgain(); }} className="tactile-btn flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-tea-700 px-5 text-lg font-black text-white shadow-lg"><RefreshCw className="h-5 w-5" />{t.playAgain}</button>
          <button onClick={() => { audioManager.playTap(); onBackToMenu(); }} className="tactile-btn flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 border-stone-300 bg-stone-100 px-5 text-lg font-black text-stone-900"><ArrowLeft className="h-5 w-5" />{t.backToMenu}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};
