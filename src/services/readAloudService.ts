import type { LanguageCode } from './translations';

const languageTags: Record<LanguageCode, string> = {
  English: 'en-IN',
  Hindi: 'hi-IN',
  Assamese: 'as-IN',
};

import { audioManager } from './audioManager';

class ReadAloudService {
  isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  speak(text: string, language: LanguageCode, onEnd?: () => void) {
    if (!this.isSupported() || !text.trim()) return false;
    window.speechSynthesis.cancel();
    audioManager.duckAmbient(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageTags[language] || 'en-IN';
    utterance.rate = 0.82;
    utterance.pitch = 1;
    const finish = () => {
      audioManager.duckAmbient(false);
      onEnd?.();
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
    return true;
  }

  stop() {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
      audioManager.duckAmbient(false);
    }
  }
}

export const readAloudService = new ReadAloudService();
