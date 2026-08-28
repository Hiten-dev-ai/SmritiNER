import React, { useState } from 'react';
import { Accessibility, Languages, LogOut, UserRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import { AccessibilityMenuModal } from './AccessibilityMenuModal';
import { LanguageMenuModal } from './LanguageMenuModal';

export const Navbar: React.FC = () => {
  const { user, selectedLanguage, logout, t } = useApp();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  return <>
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 pt-[env(safe-area-inset-top)] shadow-sm backdrop-blur-md">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_48px_48px_48px] items-center gap-2 px-3 py-2.5 lg:grid-cols-[minmax(0,1fr)_auto_48px_auto] lg:px-6">
        <div className="flex min-w-0 items-center gap-2"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-tea-600 to-tea-900 text-sm font-black text-white shadow-sm">স্মৃ</span><span className="min-w-0"><span className="block truncate text-lg font-black leading-tight text-tea-950">SmritiNER</span><span className="hidden truncate text-sm font-semibold text-stone-600 xl:block">{user?.role === 'caregiver' ? 'Caretaker workspace' : 'Your memory journey'}</span></span></div>
        <button onClick={() => setLanguageOpen(true)} className="tactile-btn flex h-12 min-w-12 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-100 px-0 text-sm font-bold text-stone-800 lg:px-3" aria-label={`${t.language}: ${selectedLanguage}`}><Languages className="h-6 w-6" /><span className="hidden lg:inline">{selectedLanguage}</span></button>
        <button onClick={() => setAccessibilityOpen(true)} className="tactile-btn flex h-12 w-12 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-stone-800" aria-label={t.accessibilitySettings}><Accessibility className="h-6 w-6" /></button>
        <button onClick={() => { audioManager.playTap(); void logout(); }} className="tactile-btn flex h-12 min-w-12 items-center justify-center gap-2 rounded-xl border border-tea-800 bg-tea-800 px-0 font-bold text-white lg:px-3" aria-label="Sign out"><UserRound className="h-5 w-5 lg:hidden" /><LogOut className="hidden h-5 w-5 lg:block" /><span className="hidden max-w-32 truncate lg:inline">{user?.displayName}</span></button>
      </div>
    </header>
    <LanguageMenuModal isOpen={languageOpen} onClose={() => setLanguageOpen(false)} />
    <AccessibilityMenuModal isOpen={accessibilityOpen} onClose={() => setAccessibilityOpen(false)} />
  </>;
};
