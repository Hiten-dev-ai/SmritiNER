import { describe, expect, it } from 'vitest';
import {
  chooseFreshItems,
  computeNextProgress,
  evaluateSessionOutcome,
  journeyDefinitions,
  journeyItems,
  nextStage,
  profileForStage,
  routines,
} from './journeyEngine';
import type { GameProgress, JourneyGameSession } from '../types';

const mockSession = (
  stage: number,
  accuracy: number,
  hintsUsed: number,
  mistakes = 0,
  completionStatus = 'completed',
  gameType: JourneyGameSession['gameType'] = 'majuli_memory'
): JourneyGameSession => ({
  patientId: 'patient-test',
  gameType,
  domain: 'visual-memory',
  stage,
  accuracy,
  durationSeconds: 90,
  memoryLoad: 4,
  mistakes,
  hintsUsed,
  medianResponseMs: 2200,
  responseVariabilityMs: 250,
  completionStatus: completionStatus as 'completed' | 'abandoned',
  contentVariantIds: [`set-1`],
  roundResults: [
    { round: 1, correct: true, responseMs: 1200, mistakes: 0, hintsUsed: 0, contentVariantId: 'v1' },
    { round: 2, correct: accuracy >= 50, responseMs: 1500, mistakes, hintsUsed, contentVariantId: 'v2' },
    { round: 3, correct: accuracy >= 80, responseMs: 1400, mistakes: 0, hintsUsed: 0, contentVariantId: 'v3' },
  ],
  startedAt: '2026-08-01T08:00:00.000Z',
  completedAt: '2026-08-01T08:02:00.000Z',
  clientEventId: `event-${Date.now()}`,
});

const defaultProgress = (gameType: GameProgress['gameType'] = 'majuli_memory', unlocked = 1, recommended = 1): GameProgress => ({
  patientId: 'patient-test',
  gameType,
  unlockedStage: unlocked,
  recommendedStage: recommended,
  lastDecision: 'start',
  reasonText: 'Starting baseline',
  consecutiveStrong: 0,
  consecutiveSupport: 0,
  updatedAt: '2026-08-01T08:00:00.000Z',
});

describe('SmritiNER 8 Games & 12-Stage Profiles', () => {
  it('contains exactly 8 cognitive games with regional metadata', () => {
    expect(journeyDefinitions).toHaveLength(8);
    const ids = journeyDefinitions.map((g) => g.id);
    expect(ids).toContain('mahjong_memory');
    expect(ids).toContain('majuli_memory');
    expect(ids).toContain('tea_tray_recall');
    expect(ids).toContain('market_list_recall');
    expect(ids).toContain('missing_object');
    expect(ids).toContain('daily_steps');
    expect(ids).toContain('weave_pattern');
    expect(ids).toContain('memory_lane');
  });

  it('provides 12 distinct stages for Smriti Mahjong Memory', () => {
    // Stages 1–4: Visible matching (6 to 12 tiles)
    expect(profileForStage('mahjong_memory', 1).tileCount).toBe(6);
    expect(profileForStage('mahjong_memory', 1).mode).toBe('visible-match');
    expect(profileForStage('mahjong_memory', 4).tileCount).toBe(12);
    expect(profileForStage('mahjong_memory', 4).mode).toBe('visible-match');

    // Stages 5–6: Preview then hidden
    expect(profileForStage('mahjong_memory', 5).mode).toBe('hidden-match');
    expect(profileForStage('mahjong_memory', 5).previewDurationMs).toBe(6000);

    // Stages 7–8: Hidden memory with 1 visible swap
    expect(profileForStage('mahjong_memory', 7).mode).toBe('shuffle-memory');
    expect(profileForStage('mahjong_memory', 7).shuffleCount).toBe(1);

    // Stages 9–10: Similar tiles with 1 swap
    expect(profileForStage('mahjong_memory', 10).tileCount).toBe(20);

    // Stages 11–12: Advanced memory with 2 swaps
    expect(profileForStage('mahjong_memory', 12).tileCount).toBe(20);
    expect(profileForStage('mahjong_memory', 12).shuffleCount).toBe(2);
    expect(profileForStage('mahjong_memory', 12).previewDurationMs).toBe(3500);
  });

  it('contains at least 32 bundled cultural and daily illustrations', () => {
    expect(journeyItems.length).toBeGreaterThanOrEqual(32);
    expect(routines.length).toBeGreaterThanOrEqual(10);
    const rhino = journeyItems.find((item) => item.id === 'rhino');
    expect(rhino?.label.Assamese).toBe('এশিঙীয়া গঁড়');

    const fresh = chooseFreshItems(4, ['rhino', 'tea']);
    expect(fresh).toHaveLength(4);
    expect(fresh.every((item) => item.id !== 'rhino' && item.id !== 'tea')).toBe(true);
  });
});

describe('Shared Progression Engine Rules', () => {
  it('correctly evaluates individual session outcomes', () => {
    const progress = defaultProgress('majuli_memory', 1, 1);
    const strong = mockSession(1, 90, 0, 0, 'completed');
    expect(evaluateSessionOutcome(strong, progress).outcome).toBe('strong');

    const support = mockSession(1, 50, 3, 3, 'completed');
    expect(evaluateSessionOutcome(support, progress).outcome).toBe('support-needed');

    expect(nextStage('majuli_memory', [strong])).toBe(1);
  });
  it('requires two consecutive strong sessions at frontier to unlock the next stage', () => {
    let progress = defaultProgress('majuli_memory', 1, 1);

    // First strong session builds evidence
    const s1 = mockSession(1, 95, 0, 0, 'completed');
    const res1 = computeNextProgress(progress, s1, 'recommended');
    expect(res1.decision.outcome).toBe('strong');
    expect(res1.decision.reasonCode).toBe('building-evidence');
    expect(res1.updatedProgress.unlockedStage).toBe(1);
    expect(res1.updatedProgress.consecutiveStrong).toBe(1);

    // Second consecutive strong session unlocks stage 2!
    const s2 = mockSession(1, 90, 1, 0, 'completed');
    const res2 = computeNextProgress(res1.updatedProgress, s2, 'recommended');
    expect(res2.decision.outcome).toBe('strong');
    expect(res2.decision.reasonCode).toBe('stage-unlocked');
    expect(res2.updatedProgress.unlockedStage).toBe(2);
    expect(res2.updatedProgress.recommendedStage).toBe(2);
    expect(res2.updatedProgress.consecutiveStrong).toBe(0);
  });

  it('recommends a gentler stage after two consecutive support-needed sessions without relocking', () => {
    let progress = defaultProgress('majuli_memory', 4, 4);

    // First support-needed session
    const s1 = mockSession(4, 50, 2, 3, 'completed');
    const res1 = computeNextProgress(progress, s1, 'recommended');
    expect(res1.decision.outcome).toBe('support-needed');
    expect(res1.decision.reasonCode).toBe('building-evidence');
    expect(res1.updatedProgress.recommendedStage).toBe(4);
    expect(res1.updatedProgress.unlockedStage).toBe(4); // Never drops

    // Second support-needed session
    const s2 = mockSession(4, 45, 3, 4, 'completed');
    const res2 = computeNextProgress(res1.updatedProgress, s2, 'recommended');
    expect(res2.decision.outcome).toBe('support-needed');
    expect(res2.decision.reasonCode).toBe('gentler-next-time');
    expect(res2.updatedProgress.recommendedStage).toBe(3);
    expect(res2.updatedProgress.unlockedStage).toBe(4); // Remains 4
  });

  it('marks lower stage manual replays as comfort replays and preserves frontier unlock', () => {
    const progress = defaultProgress('majuli_memory', 6, 6);

    // Patient chooses to replay Stage 2 comfortably
    const replaySession = mockSession(2, 100, 0, 0, 'completed');
    const result = computeNextProgress(progress, replaySession, 'manual');

    expect(result.decision.reasonCode).toBe('manual-comfort-replay');
    expect(result.updatedProgress.unlockedStage).toBe(6);
    expect(result.updatedProgress.recommendedStage).toBe(6);
  });
});
