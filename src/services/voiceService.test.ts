import { describe, expect, it } from 'vitest';
import { voiceService } from './voiceService';

describe('VoiceService Command Parser', () => {
  it('parses English voice commands accurately', () => {
    const homeCmd = voiceService.parseVoiceCommand('go home', 'English');
    expect(homeCmd).not.toBeNull();
    expect(homeCmd?.actionId).toBe('home');
    expect(homeCmd?.requiresConfirmation).toBe(false);

    const gameCmd = voiceService.parseVoiceCommand('start game', 'English');
    expect(gameCmd?.actionId).toBe('start_game');

    const sosCmd = voiceService.parseVoiceCommand('call family', 'English');
    expect(sosCmd?.actionId).toBe('call_family');
    expect(sosCmd?.requiresConfirmation).toBe(true);

    const doneCmd = voiceService.parseVoiceCommand('mark done', 'English');
    expect(doneCmd?.actionId).toBe('mark_done');
    expect(doneCmd?.requiresConfirmation).toBe(true);
  });

  it('parses Hindi voice commands accurately', () => {
    const homeCmd = voiceService.parseVoiceCommand('घर', 'Hindi');
    expect(homeCmd?.actionId).toBe('home');

    const startCmd = voiceService.parseVoiceCommand('खेल शुरू', 'Hindi');
    expect(startCmd?.actionId).toBe('start_game');

    const sosCmd = voiceService.parseVoiceCommand('परिवार को फोन', 'Hindi');
    expect(sosCmd?.actionId).toBe('call_family');
    expect(sosCmd?.requiresConfirmation).toBe(true);

    const waterCmd = voiceService.parseVoiceCommand('पानी पिएं', 'Hindi');
    expect(waterCmd?.actionId).toBe('drink_water');
  });

  it('parses Assamese voice commands accurately', () => {
    const homeCmd = voiceService.parseVoiceCommand('ঘৰলৈ', 'Assamese');
    expect(homeCmd?.actionId).toBe('home');

    const startCmd = voiceService.parseVoiceCommand('খেল আৰম্ভ', 'Assamese');
    expect(startCmd?.actionId).toBe('start_game');

    const hintCmd = voiceService.parseVoiceCommand('ইংগিত', 'Assamese');
    expect(hintCmd?.actionId).toBe('hint');

    const routineCmd = voiceService.parseVoiceCommand('নিয়মীয়া কাম', 'Assamese');
    expect(routineCmd?.actionId).toBe('open_routine');
  });

  it('returns null for unrelated noise or empty transcripts', () => {
    expect(voiceService.parseVoiceCommand('', 'English')).toBeNull();
    expect(voiceService.parseVoiceCommand('random babble xyz', 'English')).toBeNull();
  });
});
