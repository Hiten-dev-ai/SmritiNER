import { describe, expect, it } from 'vitest';
import { chooseFreshItems, journeyItems, nextStage, profileForStage, routines } from './journeyEngine';
import type { JourneyGameSession } from '../types';

const session = (stage: number, accuracy: number, hintsUsed: number, day: number): JourneyGameSession => ({
  patientId: 'patient-test', gameType: 'majuli_memory', domain: 'visual-memory', stage, accuracy,
  durationSeconds: 90, memoryLoad: 4, mistakes: 0, hintsUsed, medianResponseMs: 2200,
  responseVariabilityMs: 250, completionStatus: 'completed', contentVariantIds: [`set-${day}`],
  roundResults: [], startedAt: `2026-08-${String(day).padStart(2, '0')}T08:00:00.000Z`,
  completedAt: `2026-08-${String(day).padStart(2, '0')}T08:02:00.000Z`, clientEventId: `event-${day}`,
});

describe('journey difficulty and content', () => {
  it('grows Memory Match from six to sixteen cards across twelve stages', () => {
    expect(profileForStage('majuli_memory', 1).memoryLoad * 2).toBe(6);
    expect(profileForStage('majuli_memory', 4).memoryLoad * 2).toBe(8);
    expect(profileForStage('majuli_memory', 7).memoryLoad * 2).toBe(12);
    expect(profileForStage('majuli_memory', 12).memoryLoad * 2).toBe(16);
  });

  it('raises or lowers only one stage using recent comparable sessions', () => {
    expect(nextStage('majuli_memory', [session(4, 92, 0, 1), session(4, 90, 1, 2)])).toBe(5);
    expect(nextStage('majuli_memory', [session(4, 55, 3, 1), session(4, 52, 4, 2)])).toBe(3);
    expect(nextStage('majuli_memory', [session(12, 98, 0, 1), session(12, 99, 0, 2)])).toBe(12);
  });

  it('has sufficient familiar content and routine variety', () => {
    expect(journeyItems.length).toBeGreaterThanOrEqual(24);
    expect(routines.length).toBeGreaterThanOrEqual(10);
    const recent = journeyItems.slice(0, 8).map((item) => item.id);
    const selected = chooseFreshItems(6, recent);
    expect(selected.every((item) => !recent.includes(item.id))).toBe(true);
  });
});
