import React, { useState } from 'react';
import {
  Accessibility,
  Cloud,
  CloudOff,
  Languages,
  ShieldCheck,
  UserRound,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import type { FontSizeScale } from '../../types';
import { LanguageMenuModal } from './LanguageMenuModal';
import { PinAuthModal } from './PinAuthModal';

export const Navbar: React.FC = () => {
  const {
    mode,
    setMode,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    isAmbientPlaying,
    toggleAmbientSound,
    isCaregiverUnlocked,
    setCaregiverUnlocked,
    selectedLanguage,
    isOnline,
    t,
  } = useApp();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const requestCaregiverMode = () => {
    audioManager.playTap();
    if (isCaregiverUnlocked) setMode('caregiver');
    else setPinOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <button
              onClick={() => setMode('patient')}
              className="tactile-btn min-w-0 flex items-center gap-2.5 rounded-xl text-left"
              aria-label={t.elderMode}
            >
              <span className="shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-tea-600 to-tea-900 flex items-center justify-center text-white shadow-sm text-sm font-black">
                স্মৃ
              </span>
              <span className="min-w-0">
                <span className="block text-lg sm:text-xl font-black text-tea-950 tracking-tight leading-none truncate">{t.appTitle}</span>
                <span className="hidden sm:block text-[11px] text-stone-600 font-semibold mt-1 truncate">{t.appSubtitle}</span>
              </span>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`hidden md:flex items-center gap-1.5 min-h-11 rounded-xl px-3 text-xs font-bold border ${isOnline ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-300'}`}>
                {isOnline ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
                {isOnline ? t.online : t.offlineSaved}
              </span>
              <button
                onClick={() => setLanguageOpen(true)}
                className="tactile-btn min-h-11 px-3 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 flex items-center gap-2 font-bold text-sm"
                aria-label={`${t.language}: ${selectedLanguage}`}
              >
                <Languages className="w-5 h-5" />
                <span className="hidden sm:inline">{selectedLanguage}</span>
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={toggleAmbientSound}
                className={`tactile-btn min-w-11 min-h-11 sm:px-3 rounded-xl flex items-center justify-center gap-2 border text-xs font-bold ${isAmbientPlaying ? 'bg-tea-700 border-tea-800 text-white' : 'bg-stone-100 border-stone-200 text-stone-700'}`}
                aria-label={isAmbientPlaying ? t.soundOn : t.sound}
                aria-pressed={isAmbientPlaying}
              >
                {isAmbientPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                <span className="hidden lg:inline">{isAmbientPlaying ? t.soundOn : t.sound}</span>
              </button>

              <button
                onClick={() => {
                  audioManager.playTap();
                  setTheme(theme === 'contrast' ? 'tea' : 'contrast');
                }}
                className="tactile-btn min-w-11 min-h-11 sm:px-3 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 flex items-center justify-center gap-2 text-xs font-bold"
                aria-label={theme === 'contrast' ? t.standardContrast : t.highContrast}
                aria-pressed={theme === 'contrast'}
              >
                <Accessibility className="w-5 h-5" />
                <span className="hidden lg:inline">{theme === 'contrast' ? t.standardContrast : t.highContrast}</span>
              </button>

              <div className="flex items-center rounded-xl bg-stone-100 border border-stone-200 p-0.5" aria-label="Text size">
                {(['normal', 'large', 'extralarge'] as FontSizeScale[]).map((size, index) => (
                  <button
                    key={size}
                    onClick={() => {
                      audioManager.playTap();
                      setFontSize(size);
                    }}
                    className={`tactile-btn min-w-10 min-h-10 rounded-lg font-black text-xs ${fontSize === size ? 'bg-white text-tea-900 shadow-sm' : 'text-stone-600'}`}
                    aria-label={`Text size ${index + 1}`}
                    aria-pressed={fontSize === size}
                  >
                    {index === 0 ? 'A' : index === 1 ? 'A+' : 'A++'}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'patient' ? (
              <button
                onClick={requestCaregiverMode}
                className="tactile-btn min-h-11 min-w-11 sm:px-3 rounded-xl bg-brahma-600 text-white border border-brahma-700 flex items-center justify-center gap-2 text-xs font-bold shrink-0"
                aria-label={t.caregiverAccess}
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="hidden sm:inline">{t.caregiverAccess}</span>
              </button>
            ) : (
              <button
                onClick={() => setMode('patient')}
                className="tactile-btn min-h-11 px-3 rounded-xl bg-tea-700 text-white border border-tea-800 flex items-center justify-center gap-2 text-xs font-bold shrink-0"
              >
                <UserRound className="w-5 h-5" />
                <span>{t.elderMode}</span>
              </button>
            )}
          </div>

          {!isOnline && (
            <div className="md:hidden mt-2 rounded-xl bg-amber-50 text-amber-950 border border-amber-300 px-3 py-2 text-xs font-bold flex items-center gap-2" role="status">
              <CloudOff className="w-4 h-4" /> {t.offlineSaved}
            </div>
          )}
        </div>
      </header>

      <LanguageMenuModal isOpen={languageOpen} onClose={() => setLanguageOpen(false)} />
      <PinAuthModal
        isOpen={pinOpen}
        onClose={() => setPinOpen(false)}
        onSuccess={() => {
          setCaregiverUnlocked(true);
          setPinOpen(false);
          setMode('caregiver');
        }}
        title={t.caregiverMode}
      />
    </>
  );
};
