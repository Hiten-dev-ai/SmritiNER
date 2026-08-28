// Voice Command Matching Engine for Multilingual Input in SmritiNER
// Supports English, Hindi, and Assamese.

import type { DetectedVoiceCommand, VoiceActionId } from '../types';
import type { LanguageCode } from './translations';

interface CommandGrammarEntry {
  actionId: VoiceActionId;
  label: string;
  requiresConfirmation: boolean;
  phrases: string[];
  contexts: Array<'patient-home' | 'routine' | 'all'>;
}

const COMMAND_GRAMMAR: Record<LanguageCode, CommandGrammarEntry[]> = {
  English: [
    {
      actionId: 'read_routine',
      label: "Read Today's Routine",
      requiresConfirmation: false,
      contexts: ['patient-home', 'routine', 'all'],
      phrases: [
        'what do i do today',
        "read today's routine",
        'read today routine',
        'read my routine',
        'read routine',
        'what are my tasks',
        'what is scheduled',
        'read schedule',
        'read medicines',
        'what do i take today',
      ],
    },
    {
      actionId: 'start_game',
      label: 'Start Memory Game',
      requiresConfirmation: false,
      contexts: ['patient-home', 'all'],
      phrases: [
        'start memory game',
        'play memory game',
        'play a game',
        'start a game',
        'start game',
        'play game',
        'begin game',
        'start playing',
      ],
    },
    {
      actionId: 'open_routine',
      label: 'Open Routine',
      requiresConfirmation: false,
      contexts: ['patient-home', 'all'],
      phrases: [
        'open routine',
        'show my medicines',
        'show medicines',
        'view routine',
        'open checklist',
        'my routine',
        'open medicine',
        'show routine',
      ],
    },
    {
      actionId: 'drink_water',
      label: 'Log Water Glass',
      requiresConfirmation: true,
      contexts: ['patient-home', 'routine', 'all'],
      phrases: [
        'i drank water',
        'drank water',
        'add one glass of water',
        'add one glass',
        'drink water',
        'add water',
        'log water',
        'water glass',
        'had water',
      ],
    },
    {
      actionId: 'call_family',
      label: 'Call Family / SOS',
      requiresConfirmation: true,
      contexts: ['patient-home', 'routine', 'all'],
      phrases: [
        'call family',
        'call daughter',
        'call son',
        'call help',
        'emergency help',
        'emergency sos',
        'emergency',
        'help me',
        'need help',
        'sos',
      ],
    },
    {
      actionId: 'stop_listening',
      label: 'Stop Listening',
      requiresConfirmation: false,
      contexts: ['patient-home', 'routine', 'all'],
      phrases: [
        'stop listening',
        'never mind',
        'cancel',
        'close',
        'dismiss',
        'stop',
      ],
    },
  ],
  Hindi: [
    {
      actionId: 'read_routine',
      label: 'आज की दिनचर्या सुनाओ',
      requiresConfirmation: false,
      contexts: ['patient-home', 'routine', 'all'],
      phrases: [
        'आज क्या करना है',
        'आज की दिनचर्या सुनाओ',
        'दिनचर्या सुनाओ',
        'दवाई सुनाओ',
        'आज का काम',
        'शेड्यूल सुनाओ',
        'मेरी दवाइयां सुनाओ',
      ],
    },
    {
      actionId: 'start_game',
      label: 'खेल शुरू करें',
      requiresConfirmation: false,
      contexts: ['patient-home', 'all'],
      phrases: [
        'स्मृति खेल शुरू करें',
        'खेल शुरू करें',
        'खेल शुरू',
        'नया खेल',
        'शुरू करें',
        'खेलें',
        'आरंभ करें',
      ],
    },
    {
      actionId: 'open_routine',
      label: 'दिनचर्या खोलें',
      requiresConfirmation: false,
      contexts: ['patient-home', 'all'],
      phrases: [
        'दिनचर्या खोलो',
        'दिनचर्या खोलें',
        'दवाइयां दिखाओ',
        'दवाई खोलो',
        'रूटीन खोलो',
        'काम की सूची',
      ],
    },
    {
      actionId: 'drink_water',
      label: 'पानी का गिलास जोड़ें',
      requiresConfirmation: true,
      contexts: ['patient-home', 'routine', 'all'],
      phrases: [
        'मैंने पानी पिया',
        'एक गिलास पानी',
        'पानी जोड़ें',
        'पानी पिया',
        'पानी पिएं',
        'जल पिया',
      ],
    },
    {
      actionId: 'call_family',
      label: 'परिवार को कॉल करें',
      requiresConfirmation: true,
      contexts: ['patient-home', 'routine', 'all'],
      phrases: [
        'परिवार को फोन करो',
        'परिवार को फोन',
        'मदद चाहिए',
        'मदद करो',
        'आपातकाल',
        'बुलाओ',
        'फोन करो',
      ],
    },
    {
      actionId: 'stop_listening',
      label: 'बंद करें',
      requiresConfirmation: false,
      contexts: ['patient-home', 'routine', 'all'],
      phrases: [
        'सुनना बंद करो',
        'बंद करें',
        'रद्द करें',
        'रहने दो',
        'रोको',
      ],
    },
  ],
  Assamese: [
    {
      actionId: 'read_routine',
      label: 'আজিৰ ৰুটিন শুনক',
      requiresConfirmation: false,
      contexts: ['patient-home', 'routine', 'all'],
      phrases: [
        'আজি কি কৰিব লাগে',
        'আজিৰ ৰুটিন শুনক',
        'ৰুটিন পঢ়ক',
        'ৰুটিন শুনক',
        'ঔষধৰ তালিকা',
        'আজিৰ কাম',
      ],
    },
    {
      actionId: 'start_game',
      label: 'খেল আৰম্ভ কৰক',
      requiresConfirmation: false,
      contexts: ['patient-home', 'all'],
      phrases: [
        'স্মৃতি খেল আৰম্ভ কৰক',
        'খেল আৰম্ভ কৰক',
        'খেল আৰম্ভ',
        'খেল খেলো',
        'আৰম্ভ কৰক',
        'খেলোঁ',
      ],
    },
    {
      actionId: 'open_routine',
      label: 'নিয়মীয়া কাম চাওক',
      requiresConfirmation: false,
      contexts: ['patient-home', 'all'],
      phrases: [
        'ৰুটিন খোলক',
        'নিয়মীয়া কাম খোলক',
        'ঔষধ দেখুৱাওক',
        'তালিকা খোলক',
        'নিয়মীয়া কাম',
      ],
    },
    {
      actionId: 'drink_water',
      label: 'পানী খোৱা যোগ কৰক',
      requiresConfirmation: true,
      contexts: ['patient-home', 'routine', 'all'],
      phrases: [
        'মই পানী খালো',
        'পানী খালো',
        'এগিলাচ পানী',
        'পানী যোগ কৰক',
        'পানী খাইছোঁ',
        'পানী খাওক',
      ],
    },
    {
      actionId: 'call_family',
      label: 'পৰিয়ালক ফোন কৰক',
      requiresConfirmation: true,
      contexts: ['patient-home', 'routine', 'all'],
      phrases: [
        'পৰিয়ালক ফোন কৰক',
        'পৰিয়ালক ফোন',
        'সহায় লাগিব',
        'জৰুৰী',
        'ফোন কৰক',
        'সহায় কৰক',
      ],
    },
    {
      actionId: 'stop_listening',
      label: 'বন্ধ কৰক',
      requiresConfirmation: false,
      contexts: ['patient-home', 'routine', 'all'],
      phrases: [
        'শুনা বন্ধ কৰক',
        'বন্ধ কৰক',
        'বাতিল কৰক',
        'নালাগে',
      ],
    },
  ],
};

/**
 * Normalizes input transcript:
 * - NFC Unicode normalization
 * - Lowercase
 * - Strips punctuation marks (English, Indic danda)
 * - Collapses repeated whitespace
 */
export function normalizeTranscript(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'।॥]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pure deterministic voice command matcher.
 * Evaluates candidate phrases, preferring the longest matching phrase.
 */
export function matchVoiceCommand(
  transcript: string,
  language: LanguageCode,
  context: 'patient-home' | 'routine' = 'patient-home'
): DetectedVoiceCommand | null {
  const normalized = normalizeTranscript(transcript);
  if (!normalized || normalized.length < 2) {
    return null;
  }

  const grammar = COMMAND_GRAMMAR[language] || COMMAND_GRAMMAR.English;

  // Flatten and filter entries active for current context
  const candidateMatches: Array<{
    actionId: VoiceActionId;
    label: string;
    requiresConfirmation: boolean;
    phrase: string;
    phraseLength: number;
    isExact: boolean;
  }> = [];

  for (const entry of grammar) {
    if (!entry.contexts.includes(context) && !entry.contexts.includes('all')) {
      continue;
    }

    for (const rawPhrase of entry.phrases) {
      const phrase = normalizeTranscript(rawPhrase);
      if (!phrase) continue;

      if (normalized === phrase) {
        candidateMatches.push({
          actionId: entry.actionId,
          label: entry.label,
          requiresConfirmation: entry.requiresConfirmation,
          phrase,
          phraseLength: phrase.length,
          isExact: true,
        });
      } else if (
        normalized.includes(phrase) ||
        // Check for boundary match
        new RegExp(`(^|\\s)${phrase}(\\s|$)`).test(normalized)
      ) {
        candidateMatches.push({
          actionId: entry.actionId,
          label: entry.label,
          requiresConfirmation: entry.requiresConfirmation,
          phrase,
          phraseLength: phrase.length,
          isExact: false,
        });
      }
    }
  }

  if (candidateMatches.length === 0) {
    return null;
  }

  // Sort candidates: Exact match first, then longest matching phrase length descending
  candidateMatches.sort((a, b) => {
    if (a.isExact && !b.isExact) return -1;
    if (!a.isExact && b.isExact) return 1;
    return b.phraseLength - a.phraseLength;
  });

  const best = candidateMatches[0];
  return {
    actionId: best.actionId,
    label: best.label,
    confidence: best.isExact ? 1.0 : 0.9,
    requiresConfirmation: best.requiresConfirmation,
    transcript,
  };
}

// Alias for backwards compatibility
export const parseVoiceCommand = matchVoiceCommand;

export const voiceService = {
  normalizeTranscript,
  matchVoiceCommand,
  parseVoiceCommand,
};
