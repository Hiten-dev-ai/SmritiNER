import { describe, expect, it } from 'vitest';
import { computeEngagementAnalytics } from './analyticsEngine';
import type { JourneyGameSession } from '../types';

const makeSession = (index: number, accuracy: number, responseMs: number, hints: number): JourneyGameSession => ({
  patientId: 'patient-test', gameType: 'market_list_recall', domain: 'memory', stage: 4,
  accuracy, durationSeconds: 100, memoryLoad: 4, mistakes: 1, hintsUsed: hints,
  medianResponseMs: responseMs, responseVariabilityMs: 200, completionStatus: 'completed',
  contentVariantIds: [`variant-${index}`], roundResults: [],
  startedAt: `2026-08-${String(index + 1).padStart(2, '0')}T08:00:00.000Z`,
  completedAt: `2026-08-${String(index + 1).padStart(2, '0')}T08:02:00.000Z`, clientEventId: `event-${index}`,
});

describe('longitudinal caregiver analytics', () => {
  it('shows insufficient data until five baseline and five recent sessions exist', () => {
    const result = computeEngagementAnalytics(Array.from({ length: 9 }, (_, index) => makeSession(index, 80, 2000, 1)));
    expect(result.trends[0].status).toBe('insufficient-data');
  });

  it('flags only consistent multi-measure change across at least three days', () => {
    const baseline = Array.from({ length: 5 }, (_, index) => makeSession(index, 90, 1800, 0));
    const recent = Array.from({ length: 5 }, (_, index) => makeSession(index + 5, 65, 2800, 3));
    const result = computeEngagementAnalytics([...baseline, ...recent]);
    expect(result.notableChange).toBe(true);
    expect(result.trends[0]).toMatchObject({ status: 'notable-change', accuracyChange: -25 });
  });

  it('does not turn a single changed measure into an alert', () => {
    const baseline = Array.from({ length: 5 }, (_, index) => makeSession(index, 90, 1800, 0));
    const recent = Array.from({ length: 5 }, (_, index) => makeSession(index + 5, 70, 1800, 0));
    expect(computeEngagementAnalytics([...baseline, ...recent]).notableChange).toBe(false);
  });
});
