import { describe, expect, it } from 'vitest';
import type { DifficultyTier, GameSession } from '../types';
import { aiEngine } from './aiEngine';

const session = (
  accuracy: number,
  hesitationsCount: number,
  difficultyLevel: DifficultyTier,
  day: number
): GameSession => ({
  patientId: 'pat-ner-001',
  gameType: 'majuli_memory',
  gameTitle: 'Memory match',
  score: accuracy,
  maxPossibleScore: 100,
  accuracy,
  durationSeconds: 60,
  difficultyLevel,
  hesitationsCount,
  hintsUsedCount: hesitationsCount,
  avgReactionTimeMs: 1200,
  completedAt: `2026-08-${String(day).padStart(2, '0')}T10:00:00.000Z`,
  synced: false,
});

describe('explainable difficulty decisions', () => {
  it('raises one level after three consistently strong sessions', () => {
    const decision = aiEngine.calculateDynamicDifficulty('majuli_memory', [
      session(90, 0, 2, 24),
      session(88, 1, 2, 25),
      session(92, 0, 2, 26),
    ]);
    expect(decision.level).toBe(3);
    expect(decision.previousLevel).toBe(2);
    expect(decision.reasonCode).toBe('harder');
  });

  it('lowers one level when recent play needed more support', () => {
    const decision = aiEngine.calculateDynamicDifficulty('majuli_memory', [
      session(55, 4, 3, 25),
      session(50, 5, 3, 26),
    ]);
    expect(decision.level).toBe(2);
    expect(decision.previousLevel).toBe(3);
    expect(decision.reasonCode).toBe('gentler');
  });

  it('clamps at levels one and five', () => {
    const high = aiEngine.calculateDynamicDifficulty('majuli_memory', [
      session(95, 0, 5, 24),
      session(95, 0, 5, 25),
      session(95, 0, 5, 26),
    ]);
    const low = aiEngine.calculateDynamicDifficulty('majuli_memory', [session(40, 5, 1, 26)]);
    expect(high.level).toBe(5);
    expect(high.reasonCode).toBe('highest');
    expect(low.level).toBe(1);
    expect(low.reasonCode).toBe('gentlest');
  });
});
