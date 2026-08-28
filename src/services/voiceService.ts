// Voice Service for Multilingual Speech Output and Push-to-Talk Command Recognition
// Supports English (en-IN), Hindi (hi-IN), and Assamese (as-IN).

import type { DetectedVoiceCommand, VoiceActionId, VoicePreferences } from '../types';
import { audioManager } from './audioManager';
import type { LanguageCode } from './translations';

const LANGUAGE_LOCALE_TAGS: Record<LanguageCode, string[]> = {
  English: ['en-IN', 'en-GB', 'en-US', 'en'],
  Hindi: ['hi-IN', 'hi'],
  Assamese: ['as-IN', 'as', 'bn-IN', 'hi-IN'],
};

// Deterministic command synonym dictionaries
const COMMAND_DICTIONARIES: Record<
  LanguageCode,
  Record<VoiceActionId, { keywords: string[]; label: string; requiresConfirmation: boolean }>
> = {
  English: {
    home: { keywords: ['home', 'go home', 'main screen'], label: 'Go to Home', requiresConfirmation: false },
    back: { keywords: ['back', 'go back', 'previous'], label: 'Go Back', requiresConfirmation: false },
    repeat: { keywords: ['repeat', 'say again', 'listen again', 'read again'], label: 'Repeat Instruction', requiresConfirmation: false },
    start_game: { keywords: ['start game', 'play game', 'begin', 'start'], label: 'Start Game', requiresConfirmation: false },
    pause: { keywords: ['pause', 'hold on', 'stop game'], label: 'Pause Game', requiresConfirmation: false },
    continue: { keywords: ['continue', 'resume', 'keep playing'], label: 'Resume', requiresConfirmation: false },
    hint: { keywords: ['hint', 'give hint', 'help me', 'clue'], label: 'Show Hint', requiresConfirmation: false },
    open_routine: { keywords: ['open routine', 'routine', 'checklist', 'my tasks'], label: 'Open Routine', requiresConfirmation: false },
    mark_done: { keywords: ['mark done', 'done', 'completed', 'take medicine'], label: 'Mark Done', requiresConfirmation: true },
    snooze: { keywords: ['snooze', 'snooze 10 minutes', 'remind later', 'later'], label: 'Snooze 10 Minutes', requiresConfirmation: false },
    drink_water: { keywords: ['drink water', 'log water', 'water glass', 'had water'], label: 'Log Water Glass', requiresConfirmation: false },
    call_family: { keywords: ['call family', 'emergency', 'sos', 'call help', 'call daughter', 'call son'], label: 'Call Family / SOS', requiresConfirmation: true },
    stop_listening: { keywords: ['stop listening', 'cancel', 'close', 'never mind'], label: 'Stop Listening', requiresConfirmation: false },
  },
  Hindi: {
    home: { keywords: ['घर', 'होम', 'मुख्य पृष्ठ', 'वापस घर'], label: 'घर जाएं', requiresConfirmation: false },
    back: { keywords: ['पीछे', 'वापस', 'पिछला'], label: 'पीछे जाएं', requiresConfirmation: false },
    repeat: { keywords: ['दोहराएं', 'फिर से बोलो', 'दोबारा सुनो', 'सुनाओ'], label: 'दोबारा सुनें', requiresConfirmation: false },
    start_game: { keywords: ['खेल शुरू', 'शुरू करें', 'खेलें', 'आरंभ'], label: 'खेल शुरू करें', requiresConfirmation: false },
    pause: { keywords: ['रोकें', 'विराम', 'ठहरो'], label: 'खेल रोकें', requiresConfirmation: false },
    continue: { keywords: ['जारी रखें', 'आगे बढ़ें', 'खेलते रहें'], label: 'जारी रखें', requiresConfirmation: false },
    hint: { keywords: ['संकेत', 'मदद', 'सुझाव', 'इशारा'], label: 'संकेत देखें', requiresConfirmation: false },
    open_routine: { keywords: ['दिनचर्या', 'रूटीन', 'काम की सूची', 'दवाई'], label: 'दिनचर्या खोलें', requiresConfirmation: false },
    mark_done: { keywords: ['हो गया', 'पूरा हुआ', 'दवाई ले ली', 'समाप्त'], label: 'पूरा चिह्नित करें', requiresConfirmation: true },
    snooze: { keywords: ['बाद में', 'स्नूज़', '१० मिनट बाद', 'दस मिनट'], label: '१० मिनट बाद याद दिलाएं', requiresConfirmation: false },
    drink_water: { keywords: ['पानी पिया', 'पानी पिएं', 'एक गिलास पानी', 'जल'], label: 'पानी का गिलास जोड़ें', requiresConfirmation: false },
    call_family: { keywords: ['परिवार को फोन', 'फोन करो', 'मदद', 'आपातकाल', 'बुलाओ'], label: 'परिवार को कॉल करें', requiresConfirmation: true },
    stop_listening: { keywords: ['बंद करें', 'रद्द करें', 'रहने दो'], label: 'बंद करें', requiresConfirmation: false },
  },
  Assamese: {
    home: { keywords: ['ঘৰ', 'হোম', 'মুখ্য পৃষ্ঠা', 'ঘৰলৈ'], label: 'ঘৰলৈ যাওক', requiresConfirmation: false },
    back: { keywords: ['পিছলৈ', 'উভতি যাওক', 'আগৰ'], label: 'পিছলৈ যাওক', requiresConfirmation: false },
    repeat: { keywords: ['পুনৰ কওক', 'আকৌ কওক', 'আকৌ শুনক', 'পুনৰাবৃত্তি'], label: 'আকৌ শুনক', requiresConfirmation: false },
    start_game: { keywords: ['খেল আৰম্ভ', 'আৰম্ভ কৰক', 'খেল খেলো'], label: 'খেল আৰম্ভ কৰক', requiresConfirmation: false },
    pause: { keywords: ['ৰখাওক', 'বিৰতি', 'থামো'], label: 'খেল ৰখাওক', requiresConfirmation: false },
    continue: { keywords: ['আগবাঢ়ক', 'চলাই যাওক', 'অব্যাহত ৰাখক'], label: 'আগবাঢ়ক', requiresConfirmation: false },
    hint: { keywords: ['ইংগিত', 'সহায়', 'সংকেত', 'ক্লু'], label: 'ইংগিত দেখুৱাওক', requiresConfirmation: false },
    open_routine: { keywords: ['নিয়মীয়া কাম', 'ৰুটিন', 'কামৰ তালিকা'], label: 'নিয়মীয়া কাম চাওক', requiresConfirmation: false },
    mark_done: { keywords: ['হৈ গ\'ল', 'সম্পূৰ্ণ হ\'ল', 'ঔষধ খালো'], label: 'সম্পূৰ্ণ কৰক', requiresConfirmation: true },
    snooze: { keywords: ['পিছত', 'দহ মিনিট পিছত', 'পিছত কওক'], label: '১০ মিনিট পিছত মনত পেলাওক', requiresConfirmation: false },
    drink_water: { keywords: ['পানী খালো', 'পানী খাওক', 'এগিলাচ পানী'], label: 'পানী খোৱা যোগ কৰক', requiresConfirmation: false },
    call_family: { keywords: ['পৰিয়ালক ফোন', 'ফোন কৰক', 'সহায় লাগিব', 'জৰুৰী'], label: 'পৰিয়ালক ফোন কৰক', requiresConfirmation: true },
    stop_listening: { keywords: ['বন্ধ কৰক', 'বাতিল কৰক', 'নালাগে'], label: 'বন্ধ কৰক', requiresConfirmation: false },
  },
};

type SpeechRecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

class VoiceService {
  private isSpeakingInternal = false;
  public currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: SpeechRecognitionType | null = null;
  private silenceTimer: number | null = null;

  public preferences: VoicePreferences = {
    enabled: true,
    rate: 0.8,
    pitch: 1.0,
    showTranscript: true,
  };

  constructor() {
    this.loadPreferences();
  }

  private loadPreferences() {
    try {
      const saved = localStorage.getItem('smriti-voice-preferences');
      if (saved) {
        this.preferences = { ...this.preferences, ...JSON.parse(saved) };
      }
    } catch {
      // safe fallback
    }
  }

  public savePreferences(next: Partial<VoicePreferences>) {
    this.preferences = { ...this.preferences, ...next };
    try {
      localStorage.setItem('smriti-voice-preferences', JSON.stringify(this.preferences));
    } catch {
      // storage fallback
    }
  }

  // -----------------------------------------------------------------
  // SPEECH SYNTHESIS (Read Aloud)
  // -----------------------------------------------------------------

  public isSpeechSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  public get isSpeaking(): boolean {
    return this.isSpeakingInternal;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSpeechSupported()) return [];
    return window.speechSynthesis.getVoices();
  }

  public findBestVoice(language: LanguageCode): SpeechSynthesisVoice | null {
    if (!this.isSpeechSupported()) return null;
    const voices = window.speechSynthesis.getVoices();
    const candidateTags = LANGUAGE_LOCALE_TAGS[language] || ['en-IN'];

    for (const tag of candidateTags) {
      const direct = voices.find((v) => v.lang.toLowerCase() === tag.toLowerCase());
      if (direct) return direct;
      const prefix = voices.find((v) => v.lang.toLowerCase().startsWith(tag.split('-')[0].toLowerCase()));
      if (prefix) return prefix;
    }
    return voices.length > 0 ? voices[0] : null;
  }

  /**
   * Speak text with rate-limiting, natural punctuation pausing, and game sound ducking.
   */
  public speak(
    text: string,
    language: LanguageCode,
    options?: { onStart?: () => void; onEnd?: () => void; onError?: () => void }
  ): boolean {
    if (!this.isSpeechSupported() || !text.trim()) return false;

    this.stop();
    audioManager.duckAmbient(true);

    const utterance = new SpeechSynthesisUtterance(text);
    const targetTag = LANGUAGE_LOCALE_TAGS[language][0];
    utterance.lang = targetTag;
    utterance.rate = this.preferences.rate || 0.8;
    utterance.pitch = this.preferences.pitch || 1.0;

    const matchedVoice = this.findBestVoice(language);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    this.isSpeakingInternal = true;
    this.currentUtterance = utterance;

    const cleanup = () => {
      this.isSpeakingInternal = false;
      this.currentUtterance = null;
      audioManager.duckAmbient(false);
    };

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      cleanup();
      options?.onEnd?.();
    };

    utterance.onerror = () => {
      cleanup();
      options?.onError?.();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  }

  public stop() {
    if (this.isSpeechSupported()) {
      window.speechSynthesis.cancel();
    }
    this.isSpeakingInternal = false;
    this.currentUtterance = null;
    audioManager.duckAmbient(false);
  }

  // -----------------------------------------------------------------
  // PUSH-TO-TALK VOICE COMMAND PARSER
  // -----------------------------------------------------------------

  public isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  /**
   * Parse user speech transcript into a deterministic command.
   */
  public parseVoiceCommand(transcript: string, language: LanguageCode): DetectedVoiceCommand | null {
    const clean = transcript.trim().toLowerCase();
    if (!clean) return null;

    const dictionary = COMMAND_DICTIONARIES[language] || COMMAND_DICTIONARIES.English;
    let bestMatch: DetectedVoiceCommand | null = null;
    let highestScore = 0;

    for (const [actionKey, definition] of Object.entries(dictionary)) {
      const actionId = actionKey as VoiceActionId;
      for (const keyword of definition.keywords) {
        const kw = keyword.toLowerCase();
        if (clean === kw) {
          return {
            actionId,
            label: definition.label,
            confidence: 1.0,
            requiresConfirmation: definition.requiresConfirmation,
            transcript: clean,
          };
        }
        if (clean.includes(kw) || kw.includes(clean)) {
          const score = kw.length / Math.max(clean.length, kw.length);
          if (score > highestScore && score >= 0.5) {
            highestScore = score;
            bestMatch = {
              actionId,
              label: definition.label,
              confidence: score,
              requiresConfirmation: definition.requiresConfirmation,
              transcript: clean,
            };
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Start push-to-talk listening session with auto-stop after 6s silence.
   */
  public startListening(
    language: LanguageCode,
    callbacks: {
      onStart?: () => void;
      onTranscript?: (transcript: string, isFinal: boolean) => void;
      onCommandDetected?: (command: DetectedVoiceCommand) => void;
      onError?: (error: string) => void;
      onEnd?: () => void;
    }
  ): boolean {
    if (!this.isRecognitionSupported()) {
      callbacks.onError?.('Voice recognition is not supported on this browser.');
      return false;
    }

    this.stopListening();
    this.stop(); // Stop any active speech

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionType;
      webkitSpeechRecognition?: new () => SpeechRecognitionType;
    };
    const RecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!RecognitionClass) return false;

    try {
      this.recognition = new RecognitionClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = LANGUAGE_LOCALE_TAGS[language][0];

      const resetSilenceTimer = () => {
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        this.silenceTimer = window.setTimeout(() => {
          this.stopListening();
        }, 6000); // 6-second silence timeout
      };

      this.recognition.onstart = () => {
        resetSilenceTimer();
        callbacks.onStart?.();
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        resetSilenceTimer();
        let fullTranscript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          fullTranscript += item[0].transcript;
          if (item.isFinal) isFinal = true;
        }

        callbacks.onTranscript?.(fullTranscript, isFinal);

        if (isFinal) {
          const command = this.parseVoiceCommand(fullTranscript, language);
          if (command) {
            callbacks.onCommandDetected?.(command);
          }
        }
      };

      this.recognition.onerror = (e) => {
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        callbacks.onError?.(e.error);
      };

      this.recognition.onend = () => {
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        callbacks.onEnd?.();
      };

      this.recognition.start();
      return true;
    } catch (err) {
      callbacks.onError?.((err as Error).message);
      return false;
    }
  }

  public stopListening() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // safe ignore
      }
      this.recognition = null;
    }
  }
}

export const voiceService = new VoiceService();
