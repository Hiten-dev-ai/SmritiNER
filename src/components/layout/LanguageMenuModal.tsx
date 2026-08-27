import React from 'react';
import { Check, Globe2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import type { LanguageCode } from '../../services/translations';

interface LanguageMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const languages: Array<{ code: LanguageCode; nativeName: string; detail: string }> = [
  { code: 'English', nativeName: 'English', detail: 'English' },
  { code: 'Hindi', nativeName: 'हिन्दी', detail: 'Hindi' },
  { code: 'Assamese', nativeName: 'অসমীয়া', detail: 'Assamese' },
];

export const LanguageMenuModal: React.FC<LanguageMenuModalProps> = ({ isOpen, onClose }) => {
  const { selectedLanguage, setSelectedLanguage, t } = useApp();

  if (!isOpen) return null;

  const selectLanguage = (language: LanguageCode) => {
    audioManager.playSuccess();
    setSelectedLanguage(language);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-3 sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-title"
    >
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border-2 border-stone-200">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-tea-100 text-tea-800 flex items-center justify-center">
              <Globe2 className="w-6 h-6" />
            </div>
            <div>
              <h2 id="language-title" className="text-xl font-black text-stone-950">{t.language}</h2>
              <p className="text-sm text-stone-600">English · हिन्दी · অসমীয়া</p>
            </div>
          </div>
          <button onClick={onClose} className="tactile-btn min-w-11 min-h-11 rounded-xl bg-stone-100 flex items-center justify-center" aria-label="Close language menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid gap-3 pt-4">
          {languages.map((language) => {
            const selected = language.code === selectedLanguage;
            return (
              <button
                key={language.code}
                onClick={() => selectLanguage(language.code)}
                className={`tactile-btn elder-touch rounded-2xl border-2 px-5 py-4 text-left flex items-center justify-between gap-4 ${selected ? 'border-tea-600 bg-tea-50 text-tea-950' : 'border-stone-200 bg-white text-stone-900 hover:bg-stone-50'}`}
                aria-pressed={selected}
              >
                <span>
                  <span className="block text-xl font-black">{language.nativeName}</span>
                  <span className="block text-xs font-semibold text-stone-500">{language.detail}</span>
                </span>
                {selected && <Check className="w-6 h-6 text-tea-700" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
