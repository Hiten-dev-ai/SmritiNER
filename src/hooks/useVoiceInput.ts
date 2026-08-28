import { useCallback, useEffect, useRef, useState } from 'react';
import type { LanguageCode } from '../services/translations';
import type { VoiceInputError } from '../types';

// SpeechRecognition type definitions
export interface BrowserSpeechRecognitionEvent {
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

export interface BrowserSpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export interface BrowserSpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

const LANGUAGE_TAGS: Record<LanguageCode, string> = {
  English: 'en-IN',
  Hindi: 'hi-IN',
  Assamese: 'as-IN',
};

const SILENCE_TIMEOUT_MS = 6000;

export function useVoiceInput(language: LanguageCode) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<VoiceInputError | null>(null);

  const recognitionRef = useRef<BrowserSpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const currentLangRef = useRef<string>(LANGUAGE_TAGS[language]);
  const assameseFallbackIndexRef = useRef<number>(0);
  const hasWarnedAssameseRef = useRef<boolean>(false);
  const isIntentionalStopRef = useRef<boolean>(false);

  // Check if browser supports speech recognition
  const getSpeechRecognitionClass = useCallback((): BrowserSpeechRecognitionConstructor | null => {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }, []);

  const isSupported = Boolean(getSpeechRecognitionClass());

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const resetSilenceTimer = useCallback((onTimeout: () => void) => {
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(() => {
      onTimeout();
    }, SILENCE_TIMEOUT_MS);
  }, [clearSilenceTimer]);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    isIntentionalStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, [clearSilenceTimer]);

  const startSessionWithLang = useCallback(
    (targetLang: string) => {
      const RecognitionClass = getSpeechRecognitionClass();
      if (!RecognitionClass) {
        setError('unsupported');
        return;
      }

      // If active session exists, abort it cleanly before starting new one
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }

      clearSilenceTimer();
      isIntentionalStopRef.current = false;
      currentLangRef.current = targetLang;

      try {
        const instance = new RecognitionClass();
        instance.continuous = false;
        instance.interimResults = true;
        instance.maxAlternatives = 1;
        instance.lang = targetLang;

        instance.onstart = () => {
          setIsListening(true);
          resetSilenceTimer(() => {
            stopListening();
          });
        };

        instance.onresult = (event: BrowserSpeechRecognitionEvent) => {
          resetSilenceTimer(() => {
            stopListening();
          });

          let accumulated = '';
          let hasFinal = false;

          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const res = event.results[i];
            if (res && res[0]) {
              accumulated += res[0].transcript;
              if (res.isFinal) {
                hasFinal = true;
              }
            }
          }

          if (accumulated) {
            setTranscript(accumulated.trim());
          }

          if (hasFinal) {
            clearSilenceTimer();
            // Automatically stop after final result is received
            stopListening();
          }
        };

        instance.onerror = (event: BrowserSpeechRecognitionErrorEvent) => {
          clearSilenceTimer();
          const errType = event.error;

          // Intentional aborts are not errors
          if (errType === 'aborted' || isIntentionalStopRef.current) {
            return;
          }

          // Handle Assamese runtime fallback: as-IN -> hi-IN -> en-IN
          if (errType === 'language-not-supported' && language === 'Assamese') {
            if (assameseFallbackIndexRef.current === 0) {
              if (!hasWarnedAssameseRef.current) {
                console.warn(
                  '[SmritiNER] Browser does not support as-IN speech recognition. Retrying with hi-IN...'
                );
                hasWarnedAssameseRef.current = true;
              }
              assameseFallbackIndexRef.current = 1;
              startSessionWithLang('hi-IN');
              return;
            } else if (assameseFallbackIndexRef.current === 1) {
              console.warn(
                '[SmritiNER] hi-IN speech recognition not supported. Retrying with en-IN...'
              );
              assameseFallbackIndexRef.current = 2;
              startSessionWithLang('en-IN');
              return;
            }
          }

          // Normalize error codes
          setIsListening(false);
          if (errType === 'not-allowed' || errType === 'service-not-allowed') {
            setError('permission-denied');
          } else if (errType === 'audio-capture') {
            setError('no-microphone');
          } else if (errType === 'no-speech') {
            setError('no-speech');
          } else if (errType === 'network') {
            setError('network');
          } else if (errType === 'language-not-supported') {
            setError('language-unavailable');
          } else {
            setError('no-speech');
          }
        };

        instance.onend = () => {
          clearSilenceTimer();
          setIsListening(false);
          recognitionRef.current = null;
        };

        recognitionRef.current = instance;
        instance.start();
      } catch {
        setError('unsupported');
        setIsListening(false);
      }
    },
    [getSpeechRecognitionClass, language, clearSilenceTimer, resetSilenceTimer, stopListening]
  );

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('unsupported');
      return;
    }
    // Clear stale transcript & error
    setTranscript('');
    setError(null);
    assameseFallbackIndexRef.current = 0;
    const defaultTag = LANGUAGE_TAGS[language] || 'en-IN';
    startSessionWithLang(defaultTag);
  }, [isSupported, language, startSessionWithLang]);

  // Clean up on unmount or language change
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, [language, clearSilenceTimer]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
    error,
  };
}
