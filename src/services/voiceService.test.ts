import { describe, expect, it } from 'vitest';
import { matchVoiceCommand, normalizeTranscript, voiceService } from './voiceService';

describe('VoiceService Command Parser', () => {
  describe('Transcript Normalization', () => {
    it('normalizes Unicode, punctuation, and extra whitespace', () => {
      expect(normalizeTranscript('  Start,  Memory   Game! ')).toBe('start memory game');
      expect(normalizeTranscript('आज क्या करना है?')).toBe('आज क्या करना है');
      expect(normalizeTranscript('আজি কি কৰিব লাগে?।')).toBe('আজি কি কৰিব লাগে');
    });
  });

  describe('English Command Matching', () => {
    it('matches "start memory game" and variants to start_game', () => {
      const cmd1 = matchVoiceCommand('start memory game', 'English');
      expect(cmd1?.actionId).toBe('start_game');
      expect(cmd1?.requiresConfirmation).toBe(false);

      const cmd2 = matchVoiceCommand('Play a game please!', 'English');
      expect(cmd2?.actionId).toBe('start_game');
    });

    it('matches "what do I do today" and "read today\'s routine" to read_routine', () => {
      const cmd1 = matchVoiceCommand('what do i do today', 'English');
      expect(cmd1?.actionId).toBe('read_routine');
      expect(cmd1?.requiresConfirmation).toBe(false);

      const cmd2 = matchVoiceCommand("read today's routine", 'English');
      expect(cmd2?.actionId).toBe('read_routine');
    });

    it('matches "open routine" and "show my medicines" to open_routine', () => {
      const cmd1 = matchVoiceCommand('open routine', 'English');
      expect(cmd1?.actionId).toBe('open_routine');
      expect(cmd1?.requiresConfirmation).toBe(false);

      const cmd2 = matchVoiceCommand('show my medicines', 'English');
      expect(cmd2?.actionId).toBe('open_routine');
    });

    it('matches "I drank water" to drink_water with confirmation required', () => {
      const cmd = matchVoiceCommand('I drank water', 'English');
      expect(cmd?.actionId).toBe('drink_water');
      expect(cmd?.requiresConfirmation).toBe(true);
    });

    it('matches "call family" and "help me" to call_family with confirmation required', () => {
      const cmd1 = matchVoiceCommand('call family', 'English');
      expect(cmd1?.actionId).toBe('call_family');
      expect(cmd1?.requiresConfirmation).toBe(true);

      const cmd2 = matchVoiceCommand('emergency help me', 'English');
      expect(cmd2?.actionId).toBe('call_family');
      expect(cmd2?.requiresConfirmation).toBe(true);
    });

    it('matches "stop listening" and "cancel" to stop_listening', () => {
      const cmd = matchVoiceCommand('stop listening', 'English');
      expect(cmd?.actionId).toBe('stop_listening');
      expect(cmd?.requiresConfirmation).toBe(false);
    });

    it('prefers longest-match when candidate keywords overlap', () => {
      // "read today's routine" contains "routine", but should match read_routine rather than open_routine
      const cmd = matchVoiceCommand("read today's routine", 'English');
      expect(cmd?.actionId).toBe('read_routine');
    });
  });

  describe('Hindi Command Matching', () => {
    it('matches Hindi game, routine, hydration, and SOS commands', () => {
      expect(matchVoiceCommand('खेल शुरू करें', 'Hindi')?.actionId).toBe('start_game');
      expect(matchVoiceCommand('आज क्या करना है', 'Hindi')?.actionId).toBe('read_routine');
      expect(matchVoiceCommand('दिनचर्या खोलो', 'Hindi')?.actionId).toBe('open_routine');
      
      const water = matchVoiceCommand('मैंने पानी पिया', 'Hindi');
      expect(water?.actionId).toBe('drink_water');
      expect(water?.requiresConfirmation).toBe(true);

      const sos = matchVoiceCommand('परिवार को फोन करो', 'Hindi');
      expect(sos?.actionId).toBe('call_family');
      expect(sos?.requiresConfirmation).toBe(true);

      expect(matchVoiceCommand('सुनना बंद करो', 'Hindi')?.actionId).toBe('stop_listening');
    });
  });

  describe('Assamese Command Matching', () => {
    it('matches Assamese game, routine, hydration, and SOS commands', () => {
      expect(matchVoiceCommand('স্মৃতি খেল আৰম্ভ কৰক', 'Assamese')?.actionId).toBe('start_game');
      expect(matchVoiceCommand('আজি কি কৰিব লাগে', 'Assamese')?.actionId).toBe('read_routine');
      expect(matchVoiceCommand('ৰুটিন খোলক', 'Assamese')?.actionId).toBe('open_routine');

      const water = matchVoiceCommand('মই পানী খালো', 'Assamese');
      expect(water?.actionId).toBe('drink_water');
      expect(water?.requiresConfirmation).toBe(true);

      const sos = matchVoiceCommand('পৰিয়ালক ফোন কৰক', 'Assamese');
      expect(sos?.actionId).toBe('call_family');
      expect(sos?.requiresConfirmation).toBe(true);

      expect(matchVoiceCommand('শুনা বন্ধ কৰক', 'Assamese')?.actionId).toBe('stop_listening');
    });
  });

  describe('Noise and Safety Rejection', () => {
    it('returns null for blank, single-character, or unrelated speech', () => {
      expect(matchVoiceCommand('', 'English')).toBeNull();
      expect(voiceService.parseVoiceCommand('', 'English')).toBeNull();
      expect(matchVoiceCommand('a', 'English')).toBeNull();
      expect(matchVoiceCommand('the weather is quite nice today', 'English')).toBeNull();
      expect(matchVoiceCommand('random conversation about tea and biscuits', 'English')).toBeNull();
    });

    it('does not trigger sensitive commands on partial unrelated syllables', () => {
      expect(matchVoiceCommand('calling someone on the road', 'English')).toBeNull();
      expect(matchVoiceCommand('waterfall', 'English')).toBeNull();
    });
  });
});
