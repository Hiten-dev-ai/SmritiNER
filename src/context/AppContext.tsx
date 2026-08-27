import React, { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AppMode, ThemeMode, FontSizeScale, PatientProfile } from '../types';
import { db, initializeDatabaseSeed } from '../services/db';
import { syncService } from '../services/syncService';
import { audioManager } from '../services/audioManager';
import { translations, type LanguageCode, type TranslationDictionary } from '../services/translations';
import { readAloudService } from '../services/readAloudService';

interface AppContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  fontSize: FontSizeScale;
  setFontSize: (size: FontSizeScale) => void;
  currentPatient: PatientProfile | null;
  setCurrentPatient: (patient: PatientProfile) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  toggleNetworkSimulation: () => void;
  triggerManualSync: () => Promise<void>;
  isAmbientPlaying: boolean;
  toggleAmbientSound: () => void;
  isCaregiverUnlocked: boolean;
  setCaregiverUnlocked: (unlocked: boolean) => void;
  selectedLanguage: LanguageCode;
  setSelectedLanguage: (lang: LanguageCode) => void;
  t: TranslationDictionary;
  isGameActive: boolean;
  setGameActive: (active: boolean) => void;
  judgeDemoEnabled: boolean;
  setJudgeDemoEnabled: (enabled: boolean) => void;
  isReadingAloud: boolean;
  speechSupported: boolean;
  readAloud: (text: string) => boolean;
  stopReadAloud: () => void;
  reminderSoundEnabled: boolean;
  setReminderSoundEnabled: (enabled: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<AppMode>('patient');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('smriti-theme');
    return saved === 'contrast' ? 'contrast' : 'tea';
  });
  const [fontSize, setFontSize] = useState<FontSizeScale>(() => {
    const saved = localStorage.getItem('smriti-font-size');
    return saved === 'normal' || saved === 'extralarge' ? saved : 'large';
  });
  const [currentPatient, setCurrentPatient] = useState<PatientProfile | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(false);
  const [isCaregiverUnlocked, setCaregiverUnlocked] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('smriti-language');
    return saved === 'Hindi' || saved === 'Assamese' ? saved : 'English';
  });
  const [isGameActive, setGameActive] = useState(false);
  const [judgeDemoEnabled, setJudgeDemoEnabledState] = useState(
    () => sessionStorage.getItem('smriti-judge-demo') === 'true'
  );
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [reminderSoundEnabled, setReminderSoundEnabledState] = useState(
    () => localStorage.getItem('smriti-reminder-sound') !== 'false'
  );
  const speechSupported = readAloudService.isSupported();

  useEffect(() => {
    async function init() {
      await initializeDatabaseSeed();
      const patient = await db.patients.toCollection().first();
      if (patient) {
        setCurrentPatient(patient);
      }
    }
    init();

    const unsubscribe = syncService.subscribe((online, pending) => {
      setIsOnline(online);
      setPendingSyncCount(pending);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('theme-tea', 'theme-brahma', 'theme-contrast');
    document.documentElement.classList.add(`theme-${theme}`);
    localStorage.setItem('smriti-theme', theme);
  }, [theme]);

  useEffect(() => {
    const rootSizes: Record<FontSizeScale, string> = {
      normal: '16px',
      large: '18px',
      extralarge: '20px',
    };
    document.documentElement.style.fontSize = rootSizes[fontSize];
    localStorage.setItem('smriti-font-size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    const languageTags: Record<LanguageCode, string> = {
      English: 'en-IN',
      Hindi: 'hi-IN',
      Assamese: 'as-IN',
    };
    document.documentElement.lang = languageTags[selectedLanguage];
    localStorage.setItem('smriti-language', selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => () => readAloudService.stop(), []);

  const setJudgeDemoEnabled = (enabled: boolean) => {
    setJudgeDemoEnabledState(enabled);
    sessionStorage.setItem('smriti-judge-demo', String(enabled));
  };

  const setReminderSoundEnabled = (enabled: boolean) => {
    setReminderSoundEnabledState(enabled);
    localStorage.setItem('smriti-reminder-sound', String(enabled));
  };

  const stopReadAloud = useCallback(() => {
    readAloudService.stop();
    setIsReadingAloud(false);
  }, []);

  const readAloud = useCallback((text: string) => {
    stopReadAloud();
    const started = readAloudService.speak(text, selectedLanguage, () => setIsReadingAloud(false));
    setIsReadingAloud(started);
    return started;
  }, [selectedLanguage, stopReadAloud]);

  const toggleNetworkSimulation = () => {
    audioManager.playTap();
    syncService.setSimulatedNetworkStatus(!isOnline);
  };

  const triggerManualSync = async () => {
    audioManager.playTap();
    const res = await syncService.performSync();
    if (res.success) {
      audioManager.playSuccess();
    }
  };

  const toggleAmbientSound = () => {
    audioManager.playTap();
    const playing = audioManager.toggleAmbientSoundscape();
    setIsAmbientPlaying(playing);
  };

  const t = translations[selectedLanguage] || translations.English;

  return (
    <AppContext.Provider
      value={{
        mode,
        setMode,
        theme,
        setTheme,
        fontSize,
        setFontSize,
        currentPatient,
        setCurrentPatient,
        isOnline,
        pendingSyncCount,
        toggleNetworkSimulation,
        triggerManualSync,
        isAmbientPlaying,
        toggleAmbientSound,
        isCaregiverUnlocked,
        setCaregiverUnlocked,
        selectedLanguage,
        setSelectedLanguage,
        t,
        isGameActive,
        setGameActive,
        judgeDemoEnabled,
        setJudgeDemoEnabled,
        isReadingAloud,
        speechSupported,
        readAloud,
        stopReadAloud,
        reminderSoundEnabled,
        setReminderSoundEnabled,
      }}
    >
      <div
        className={`min-h-screen transition-colors duration-200 ${
          theme === 'tea'
            ? 'bg-[#f8fbf9] text-tea-950'
            : theme === 'brahma'
            ? 'bg-[#f0f9ff] text-brahma-900'
            : 'bg-white text-black font-extrabold'
        } app-surface`}
      >
        {children}
      </div>
    </AppContext.Provider>
  );
};

// oxlint-disable-next-line react/only-export-components -- context hook intentionally colocated with its provider
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
