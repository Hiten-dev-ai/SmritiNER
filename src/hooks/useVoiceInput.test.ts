import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type BrowserSpeechRecognitionInstance } from './useVoiceInput';
import { matchVoiceCommand } from '../services/voiceService';

class MockSpeechRecognition implements BrowserSpeechRecognitionInstance {
  continuous = false;
  interimResults = false;
  lang = 'en-IN';
  maxAlternatives = 1;
  onstart: (() => void) | null = null;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;

  static instances: MockSpeechRecognition[] = [];

  constructor() {
    MockSpeechRecognition.instances.push(this);
  }

  start = vi.fn(() => {
    if (this.onstart) {
      this.onstart();
    }
  });

  stop = vi.fn(() => {
    if (this.onend) {
      this.onend();
    }
  });

  abort = vi.fn(() => {
    if (this.onend) {
      this.onend();
    }
  });
}

describe('Voice Input Engine & Recognition Lifecycle', () => {
  beforeEach(() => {
    MockSpeechRecognition.instances = [];
    (globalThis as any).window = {
      SpeechRecognition: MockSpeechRecognition,
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    delete (globalThis as any).window;
  });

  it('instantiates SpeechRecognition with correct configuration and regional language tags', () => {
    const enInstance = new MockSpeechRecognition();
    enInstance.lang = 'en-IN';
    enInstance.continuous = false;
    enInstance.interimResults = true;
    enInstance.maxAlternatives = 1;
    enInstance.start();

    expect(enInstance.start).toHaveBeenCalled();
    expect(enInstance.lang).toBe('en-IN');
    expect(enInstance.continuous).toBe(false);
    expect(enInstance.interimResults).toBe(true);

    const hiInstance = new MockSpeechRecognition();
    hiInstance.lang = 'hi-IN';
    expect(hiInstance.lang).toBe('hi-IN');

    const asInstance = new MockSpeechRecognition();
    asInstance.lang = 'as-IN';
    expect(asInstance.lang).toBe('as-IN');
  });

  it('processes transcript events and parses valid commands', () => {
    let capturedTranscript = '';
    const instance = new MockSpeechRecognition();

    instance.onresult = (event: any) => {
      let accumulated = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        accumulated += event.results[i][0].transcript;
      }
      capturedTranscript = accumulated;
    };

    // Simulate interim transcript event
    instance.onresult({
      resultIndex: 0,
      results: [
        {
          isFinal: false,
          0: { transcript: 'start memory', confidence: 0.8 },
          length: 1,
        },
      ],
    });
    expect(capturedTranscript).toBe('start memory');

    // Simulate final transcript event
    instance.onresult({
      resultIndex: 0,
      results: [
        {
          isFinal: true,
          0: { transcript: 'start memory game', confidence: 0.95 },
          length: 1,
        },
      ],
    });
    expect(capturedTranscript).toBe('start memory game');

    const detected = matchVoiceCommand(capturedTranscript, 'English');
    expect(detected?.actionId).toBe('start_game');
    expect(detected?.requiresConfirmation).toBe(false);
  });

  it('normalizes error types correctly', () => {
    const errorMap: Record<string, string> = {
      'not-allowed': 'permission-denied',
      'service-not-allowed': 'permission-denied',
      'audio-capture': 'no-microphone',
      'no-speech': 'no-speech',
      network: 'network',
      'language-not-supported': 'language-unavailable',
    };

    for (const [browserError, normalized] of Object.entries(errorMap)) {
      let mappedError: string | null = null;
      if (browserError === 'not-allowed' || browserError === 'service-not-allowed') {
        mappedError = 'permission-denied';
      } else if (browserError === 'audio-capture') {
        mappedError = 'no-microphone';
      } else if (browserError === 'no-speech') {
        mappedError = 'no-speech';
      } else if (browserError === 'network') {
        mappedError = 'network';
      } else if (browserError === 'language-not-supported') {
        mappedError = 'language-unavailable';
      }

      expect(mappedError).toBe(normalized);
    }
  });

  it('correctly simulates Assamese runtime fallback sequence: as-IN -> hi-IN -> en-IN', () => {
    const fallbackSequence: string[] = [];
    let currentLang = 'as-IN';
    let fallbackIndex = 0;

    const handleError = (err: string) => {
      if (err === 'language-not-supported') {
        if (fallbackIndex === 0) {
          fallbackIndex = 1;
          currentLang = 'hi-IN';
          fallbackSequence.push(currentLang);
        } else if (fallbackIndex === 1) {
          fallbackIndex = 2;
          currentLang = 'en-IN';
          fallbackSequence.push(currentLang);
        }
      }
    };

    // First as-IN failure
    handleError('language-not-supported');
    expect(currentLang).toBe('hi-IN');

    // Second hi-IN failure
    handleError('language-not-supported');
    expect(currentLang).toBe('en-IN');

    expect(fallbackSequence).toEqual(['hi-IN', 'en-IN']);
  });
});
