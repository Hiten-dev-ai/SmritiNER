import type { LanguageCode } from './translations';

const languageTags: Record<LanguageCode, string> = {
  English: 'en-IN',
  Hindi: 'hi-IN',
  Assamese: 'as-IN',
};

class ReadAloudService {
  isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  speak(text: string, language: LanguageCode, onEnd?: () => void) {
    if (!this.isSupported() || !text.trim()) return false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageTags[language];
    utterance.rate = 0.82;
    utterance.pitch = 1;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
    return true;
  }

  stop() {
    if (this.isSupported()) window.speechSynthesis.cancel();
  }
}

export const readAloudService = new ReadAloudService();
