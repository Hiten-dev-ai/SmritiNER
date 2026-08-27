import React, { useState } from 'react';
import { Accessibility, Languages, ShieldCheck, UserRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import { AccessibilityMenuModal } from './AccessibilityMenuModal';
import { LanguageMenuModal } from './LanguageMenuModal';
import { PinAuthModal } from './PinAuthModal';

export const Navbar: React.FC = () => {
  const { mode, setMode, isCaregiverUnlocked, setCaregiverUnlocked, selectedLanguage, t } = useApp();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const requestCaregiverMode = () => {
    audioManager.playTap();
    if (isCaregiverUnlocked) setMode('caregiver');
    else setPinOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 pt-[env(safe-area-inset-top)] shadow-sm backdrop-blur-md">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_48px_48px_48px] items-center gap-2 px-3 py-2.5 lg:grid-cols-[minmax(0,1fr)_auto_48px_48px] lg:px-6">
          <button onClick={() => setMode('patient')} className="tactile-btn flex min-w-0 items-center gap-2 rounded-xl text-left" aria-label={t.elderMode}>
            <span className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-tea-600 to-tea-900 text-sm font-black text-white shadow-sm">স্মৃ</span>
            <span className="min-w-0"><span className="block truncate text-lg font-black leading-tight tracking-tight text-tea-950">{t.appTitle}</span><span className="hidden truncate text-sm font-semibold text-stone-600 xl:block">{t.appSubtitle}</span></span>
          </button>
          <button onClick={() => setLanguageOpen(true)} className="tactile-btn flex h-[48px] min-w-[48px] items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-100 px-0 text-sm font-bold text-stone-800 lg:px-3" aria-label={`${t.language}: ${selectedLanguage}`}><Languages className="h-6 w-6 shrink-0" /><span className="hidden lg:inline">{selectedLanguage}</span></button>
          <button onClick={() => setAccessibilityOpen(true)} className="tactile-btn flex h-[48px] w-[48px] items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-stone-800" aria-label={t.accessibilitySettings}><Accessibility className="h-6 w-6" /></button>
          {mode === 'patient' ? <button onClick={requestCaregiverMode} className="tactile-btn flex h-[48px] w-[48px] items-center justify-center rounded-xl border border-brahma-700 bg-brahma-600 text-white" aria-label={t.caregiverAccess}><ShieldCheck className="h-6 w-6" /></button> : <button onClick={() => setMode('patient')} className="tactile-btn flex h-[48px] w-[48px] items-center justify-center rounded-xl border border-tea-800 bg-tea-700 text-white" aria-label={t.elderMode}><UserRound className="h-6 w-6" /></button>}
        </div>
      </header>
      <LanguageMenuModal isOpen={languageOpen} onClose={() => setLanguageOpen(false)} />
      <AccessibilityMenuModal isOpen={accessibilityOpen} onClose={() => setAccessibilityOpen(false)} />
      <PinAuthModal isOpen={pinOpen} onClose={() => setPinOpen(false)} onSuccess={() => { setCaregiverUnlocked(true); setPinOpen(false); setMode('caregiver'); }} title={t.caregiverMode} />
    </>
  );
};
