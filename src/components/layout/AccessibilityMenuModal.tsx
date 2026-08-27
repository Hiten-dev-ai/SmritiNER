import React, { useEffect, useRef } from 'react';
import { Accessibility, Bell, Cloud, CloudOff, Volume2, VolumeX, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import type { FontSizeScale } from '../../types';

interface AccessibilityMenuModalProps { isOpen: boolean; onClose: () => void }

export const AccessibilityMenuModal: React.FC<AccessibilityMenuModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, fontSize, setFontSize, isAmbientPlaying, toggleAmbientSound, isOnline, reminderSoundEnabled, setReminderSoundEnabled, t } = useApp();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="accessibility-title">
      <div className="max-h-[100dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <div className="flex min-w-0 items-center gap-3"><span className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl bg-tea-100 text-tea-800"><Accessibility className="h-6 w-6" /></span><h2 id="accessibility-title" className="text-xl font-black text-stone-950">{t.accessibilitySettings}</h2></div>
          <button ref={closeRef} onClick={onClose} className="tactile-btn flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-stone-100" aria-label={t.close}><X className="h-6 w-6" /></button>
        </div>
        <div className={`mt-4 flex min-h-[48px] items-center gap-3 rounded-2xl border px-4 text-base font-bold ${isOnline ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-amber-400 bg-amber-50 text-amber-950'}`} role="status">
          {isOnline ? <Cloud className="h-5 w-5" /> : <CloudOff className="h-5 w-5" />}{isOnline ? t.online : t.offlineSaved}
        </div>
        <div className="mt-4 space-y-3">
          <button onClick={toggleAmbientSound} className={`tactile-btn flex min-h-[56px] w-full items-center gap-3 rounded-2xl border px-4 text-base font-bold ${isAmbientPlaying ? 'border-tea-800 bg-tea-700 text-white' : 'border-stone-300 bg-stone-100 text-stone-900'}`} aria-pressed={isAmbientPlaying}>{isAmbientPlaying ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}{isAmbientPlaying ? t.soundOn : t.sound}</button>
          <button onClick={() => setReminderSoundEnabled(!reminderSoundEnabled)} className={`tactile-btn flex min-h-[56px] w-full items-center gap-3 rounded-2xl border px-4 text-base font-bold ${reminderSoundEnabled ? 'border-brahma-600 bg-brahma-50 text-brahma-950' : 'border-stone-300 bg-stone-100 text-stone-700'}`} aria-pressed={reminderSoundEnabled}><Bell className="h-6 w-6" />{t.reminderSound}</button>
          <button onClick={() => { audioManager.playTap(); setTheme(theme === 'contrast' ? 'tea' : 'contrast'); }} className="tactile-btn flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-stone-300 bg-stone-100 px-4 text-base font-bold text-stone-900" aria-pressed={theme === 'contrast'}><Accessibility className="h-6 w-6" />{theme === 'contrast' ? t.standardContrast : t.highContrast}</button>
          <fieldset><legend className="mb-2 text-base font-bold text-stone-800">Text size</legend><div className="grid grid-cols-3 gap-2">
            {(['normal', 'large', 'extralarge'] as FontSizeScale[]).map((size, index) => <button key={size} onClick={() => { audioManager.playTap(); setFontSize(size); }} className={`tactile-btn min-h-[56px] rounded-2xl border text-base font-black ${fontSize === size ? 'border-tea-700 bg-tea-700 text-white' : 'border-stone-300 bg-white text-stone-800'}`} aria-pressed={fontSize === size}>{index === 0 ? 'A' : index === 1 ? 'A+' : 'A++'}</button>)}
          </div></fieldset>
        </div>
      </div>
    </div>
  );
};
