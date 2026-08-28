import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthenticatedPatient, FontSizeScale, ThemeMode, UserAccount } from '../types';
import { api, ApiError } from '../services/api';
import { audioManager } from '../services/audioManager';
import { translations, type LanguageCode, type TranslationDictionary } from '../services/translations';
import { readAloudService } from '../services/readAloudService';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';
interface RegisterInput { displayName: string; username: string; email: string; password: string }

interface AppContextType {
  authStatus: AuthStatus;
  authError: string | null;
  user: UserAccount | null;
  patients: AuthenticatedPatient[];
  currentPatient: AuthenticatedPatient | null;
  setCurrentPatient: (patient: AuthenticatedPatient) => void;
  login: (identifier: string, password: string) => Promise<boolean>;
  registerCaregiver: (input: RegisterInput) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshPatients: () => Promise<void>;
  isOfflineSession: boolean;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  fontSize: FontSizeScale;
  setFontSize: (size: FontSizeScale) => void;
  isOnline: boolean;
  isAmbientPlaying: boolean;
  toggleAmbientSound: () => void;
  selectedLanguage: LanguageCode;
  setSelectedLanguage: (lang: LanguageCode) => void;
  t: TranslationDictionary;
  isGameActive: boolean;
  setGameActive: (active: boolean) => void;
  isReadingAloud: boolean;
  speechSupported: boolean;
  readAloud: (text: string) => boolean;
  stopReadAloud: () => void;
  reminderSoundEnabled: boolean;
  setReminderSoundEnabled: (enabled: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const authCacheKey = 'smriti-auth-cache-v2';

const readAuthCache = () => {
  try { return JSON.parse(localStorage.getItem(authCacheKey) || 'null') as { user: UserAccount; patients: AuthenticatedPatient[]; selectedPatientId?: string } | null; }
  catch { return null; }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [patients, setPatients] = useState<AuthenticatedPatient[]>([]);
  const [currentPatient, setCurrentPatientState] = useState<AuthenticatedPatient | null>(null);
  const [isOfflineSession, setOfflineSession] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [theme, setTheme] = useState<ThemeMode>(() => localStorage.getItem('smriti-theme') === 'contrast' ? 'contrast' : 'tea');
  const [fontSize, setFontSize] = useState<FontSizeScale>(() => {
    const saved = localStorage.getItem('smriti-font-size');
    return saved === 'normal' || saved === 'extralarge' ? saved : 'large';
  });
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('smriti-language');
    return saved === 'Hindi' || saved === 'Assamese' ? saved : 'English';
  });
  const [isGameActive, setGameActive] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [reminderSoundEnabled, setReminderSoundEnabledState] = useState(() => localStorage.getItem('smriti-reminder-sound') !== 'false');
  const speechSupported = readAloudService.isSupported();

  const applyAuth = useCallback((nextUser: UserAccount, nextPatients: AuthenticatedPatient[], offline = false) => {
    const cached = readAuthCache();
    const selected = nextPatients.find((patient) => patient.id === cached?.selectedPatientId) || nextPatients[0] || null;
    setUser(nextUser); setPatients(nextPatients); setCurrentPatientState(selected); setOfflineSession(offline);
    setAuthStatus('authenticated'); setAuthError(null);
    localStorage.setItem(authCacheKey, JSON.stringify({ user: nextUser, patients: nextPatients, selectedPatientId: selected?.id }));
  }, []);

  useEffect(() => {
    let active = true;
    api.me().then((payload) => { if (active) applyAuth(payload.user, payload.patients); }).catch((error) => {
      if (!active) return;
      const cached = readAuthCache();
      if (!(error instanceof ApiError && error.status === 401) && cached && !navigator.onLine) applyAuth(cached.user, cached.patients, true);
      else { localStorage.removeItem(authCacheKey); setAuthStatus('unauthenticated'); }
    });
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online); window.addEventListener('offline', offline);
    return () => { active = false; window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, [applyAuth]);

  useEffect(() => { document.documentElement.classList.remove('theme-tea', 'theme-brahma', 'theme-contrast'); document.documentElement.classList.add(`theme-${theme}`); localStorage.setItem('smriti-theme', theme); }, [theme]);
  useEffect(() => { document.documentElement.style.fontSize = ({ normal: '16px', large: '18px', extralarge: '20px' })[fontSize]; localStorage.setItem('smriti-font-size', fontSize); }, [fontSize]);
  useEffect(() => { document.documentElement.lang = ({ English: 'en-IN', Hindi: 'hi-IN', Assamese: 'as-IN' })[selectedLanguage]; localStorage.setItem('smriti-language', selectedLanguage); }, [selectedLanguage]);
  useEffect(() => () => readAloudService.stop(), []);

  const login = async (identifier: string, password: string) => {
    setAuthError(null);
    try { const payload = await api.login(identifier, password); applyAuth(payload.user, payload.patients); return true; }
    catch (error) { setAuthError(error instanceof Error ? error.message : 'Unable to sign in.'); return false; }
  };
  const registerCaregiver = async (input: RegisterInput) => {
    setAuthError(null);
    try { const payload = await api.registerCaregiver(input); applyAuth(payload.user, payload.patients); return true; }
    catch (error) { setAuthError(error instanceof Error ? error.message : 'Unable to create account.'); return false; }
  };
  const logout = async () => {
    try { if (!isOfflineSession) await api.logout(); } catch { /* local logout remains available */ }
    const hasPendingResults = Object.keys(localStorage).some((key) => key.startsWith('smriti-session-outbox-') && localStorage.getItem(key) !== '[]');
    if (!hasPendingResults) Object.keys(localStorage).filter((key) => key.startsWith('smriti-sessions-')).forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem(authCacheKey); setUser(null); setPatients([]); setCurrentPatientState(null); setAuthStatus('unauthenticated'); setOfflineSession(false);
  };
  const refreshPatients = async () => {
    if (!user) return;
    const payload = await api.listPatients();
    applyAuth(user, payload.patients);
  };
  const setCurrentPatient = (patient: AuthenticatedPatient) => {
    setCurrentPatientState(patient);
    if (user) localStorage.setItem(authCacheKey, JSON.stringify({ user, patients, selectedPatientId: patient.id }));
  };
  const stopReadAloud = useCallback(() => { readAloudService.stop(); setIsReadingAloud(false); }, []);
  const readAloud = useCallback((text: string) => {
    stopReadAloud();
    const started = readAloudService.speak(text, selectedLanguage, () => setIsReadingAloud(false));
    setIsReadingAloud(started); return started;
  }, [selectedLanguage, stopReadAloud]);
  const toggleAmbientSound = () => { audioManager.playTap(); setIsAmbientPlaying(audioManager.toggleAmbientSoundscape()); };
  const setReminderSoundEnabled = (enabled: boolean) => { setReminderSoundEnabledState(enabled); localStorage.setItem('smriti-reminder-sound', String(enabled)); };
  const t = translations[selectedLanguage] || translations.English;
  const value: AppContextType = { authStatus, authError, user, patients, currentPatient, setCurrentPatient, login, registerCaregiver, logout, refreshPatients, isOfflineSession, theme, setTheme, fontSize, setFontSize, isOnline, isAmbientPlaying, toggleAmbientSound, selectedLanguage, setSelectedLanguage, t, isGameActive, setGameActive, isReadingAloud, speechSupported, readAloud, stopReadAloud, reminderSoundEnabled, setReminderSoundEnabled };

  return <AppContext.Provider value={value}><div className={`min-h-screen app-surface ${theme === 'contrast' ? 'bg-white text-black font-extrabold' : 'bg-[#f8fbf9] text-tea-950'}`}>{children}</div></AppContext.Provider>;
};

// oxlint-disable-next-line react/only-export-components -- context hook intentionally colocated
export const useApp = () => { const context = useContext(AppContext); if (!context) throw new Error('useApp must be used within an AppProvider'); return context; };
