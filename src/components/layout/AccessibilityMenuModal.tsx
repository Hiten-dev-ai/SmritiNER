import React, { useEffect, useRef } from 'react';
import {
  Accessibility,
  Bell,
  Check,
  Cloud,
  CloudOff,
  Music,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import type { FontSizeScale } from '../../types';

interface AccessibilityMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityMenuModal: React.FC<AccessibilityMenuModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    isAmbientPlaying,
    toggleAmbientSound,
    audioPreferences,
    setAudioPreferences,
    isOnline,
    reminderSoundEnabled,
    setReminderSoundEnabled,
    t,
  } = useApp();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePreviewSound = () => {
    audioManager.play('pair-match');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-title"
    >
      <div className="max-h-[100dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-tea-100 text-tea-800">
              <Accessibility className="h-6 w-6" />
            </span>
            <h2 id="accessibility-title" className="text-xl font-black text-stone-950">
              {t.accessibilitySettings}
            </h2>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-stone-100 hover:bg-stone-200 transition"
            aria-label={t.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Network status */}
        <div
          className={`mt-4 flex min-h-[48px] items-center gap-3 rounded-2xl border px-4 text-sm font-bold ${
            isOnline
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-amber-400 bg-amber-50 text-amber-950'
          }`}
          role="status"
        >
          {isOnline ? <Cloud className="h-5 w-5 text-emerald-700" /> : <CloudOff className="h-5 w-5 text-amber-700" />}
          {isOnline ? t.online : t.offlineSaved}
        </div>

        {/* Controls */}
        <div className="mt-4 space-y-4">
          {/* Game Sound Effects & Volume */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-tea-700" /> Game Sound Effects
              </span>
              <button
                type="button"
                onClick={() =>
                  setAudioPreferences({ effectsEnabled: !audioPreferences.effectsEnabled })
                }
                className={`min-h-9 rounded-xl px-3 text-xs font-black transition ${
                  audioPreferences.effectsEnabled
                    ? 'bg-tea-800 text-white'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {audioPreferences.effectsEnabled ? 'Enabled' : 'Muted'}
              </button>
            </div>

            {audioPreferences.effectsEnabled && (
              <div className="mt-3 pt-3 border-t border-stone-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-500">Volume Level</span>
                  <button
                    type="button"
                    onClick={handlePreviewSound}
                    className="text-xs font-black text-tea-700 flex items-center gap-1 hover:underline"
                  >
                    <Sparkles className="h-3 w-3" /> Preview Sound
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((vol) => (
                    <button
                      key={vol}
                      type="button"
                      onClick={() => {
                        setAudioPreferences({ effectsVolume: vol });
                        audioManager.play('tap');
                      }}
                      className={`min-h-10 rounded-xl border text-xs font-black capitalize transition ${
                        audioPreferences.effectsVolume === vol
                          ? 'border-tea-700 bg-tea-700 text-white shadow-sm'
                          : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50'
                      }`}
                    >
                      {vol}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ambient Soundscape */}
          <button
            onClick={toggleAmbientSound}
            className={`flex min-h-[52px] w-full items-center justify-between rounded-2xl border px-4 text-sm font-bold transition ${
              isAmbientPlaying
                ? 'border-tea-800 bg-tea-800 text-white shadow-sm'
                : 'border-stone-300 bg-stone-100 text-stone-900 hover:bg-stone-200'
            }`}
            aria-pressed={isAmbientPlaying}
          >
            <span className="flex items-center gap-2.5">
              <Music className="h-5 w-5" />
              Brahmaputra Calming Drone
            </span>
            <span className="text-xs font-black uppercase">
              {isAmbientPlaying ? 'Playing' : 'Off'}
            </span>
          </button>

          {/* Reminder Alert Sound */}
          <button
            onClick={() => setReminderSoundEnabled(!reminderSoundEnabled)}
            className={`flex min-h-[52px] w-full items-center justify-between rounded-2xl border px-4 text-sm font-bold transition ${
              reminderSoundEnabled
                ? 'border-brahma-600 bg-brahma-50 text-brahma-950 shadow-sm'
                : 'border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
            aria-pressed={reminderSoundEnabled}
          >
            <span className="flex items-center gap-2.5">
              <Bell className="h-5 w-5" />
              {t.reminderSound}
            </span>
            <span className="text-xs font-black uppercase">
              {reminderSoundEnabled ? 'On' : 'Off'}
            </span>
          </button>

          {/* High Contrast */}
          <button
            onClick={() => {
              audioManager.play('tap');
              setTheme(theme === 'contrast' ? 'tea' : 'contrast');
            }}
            className="flex min-h-[52px] w-full items-center justify-between rounded-2xl border border-stone-300 bg-stone-100 px-4 text-sm font-bold text-stone-900 hover:bg-stone-200 transition"
            aria-pressed={theme === 'contrast'}
          >
            <span className="flex items-center gap-2.5">
              <Accessibility className="h-5 w-5" />
              {theme === 'contrast' ? t.standardContrast : t.highContrast}
            </span>
            {theme === 'contrast' && <Check className="h-5 w-5 text-stone-900" />}
          </button>

          {/* Text Size */}
          <fieldset className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
            <legend className="mb-2 text-xs font-black uppercase tracking-wider text-stone-500">
              Text size
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'large', 'extralarge'] as FontSizeScale[]).map((size, index) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    audioManager.play('tap');
                    setFontSize(size);
                  }}
                  className={`min-h-[48px] rounded-xl border text-base font-black transition ${
                    fontSize === size
                      ? 'border-tea-700 bg-tea-700 text-white shadow-sm'
                      : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50'
                  }`}
                  aria-pressed={fontSize === size}
                >
                  {index === 0 ? 'A (Normal)' : index === 1 ? 'A+ (Large)' : 'A++ (Max)'}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
};
