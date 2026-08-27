import type { GameSession, CognitiveMetrics, GameType, DifficultyTier } from '../types';

export interface DifficultyConfig {
  level: DifficultyTier; // 1 to 5
  gridSize?: { rows: number; cols: number };
  itemsCount?: number;
  speedMultiplier?: number;
  timeLimitSeconds?: number;
  hintCooldownSeconds?: number;
  distractionDensity?: number;
  allowManualOverride?: boolean;
}

export interface DifficultyDecision {
  level: DifficultyTier;
  previousLevel: DifficultyTier;
  reason: string;
  averageAccuracy: number;
  averageHesitations: number;
}

export class AIEngine {
  private readonly HESITATION_THRESHOLD_MS = 4000;

  /** Uses up to the last three completed sessions for this game.
   * The decision is deterministic and can be explained to an elder or caregiver.
   */
  calculateDynamicDifficulty(
    currentGame: GameType,
    history: GameSession[],
    patientId = 'pat-ner-001'
  ): DifficultyDecision {
    const recentSessions = history
      .filter(
        (session) => session.gameType === currentGame && session.patientId === patientId
      )
      .sort(
        (first, second) =>
          new Date(first.completedAt).getTime() - new Date(second.completedAt).getTime()
      )
      .slice(-3);

    const previousLevel = (recentSessions.at(-1)?.difficultyLevel ??
      (currentGame === 'reminiscence_album' ? 1 : 2)) as DifficultyTier;

    if (recentSessions.length === 0) {
      return {
        level: previousLevel,
        previousLevel,
        reason: 'Starting at a gentle baseline until a few completed games are available.',
        averageAccuracy: 0,
        averageHesitations: 0,
      };
    }

    const averageAccuracy = Math.round(
      recentSessions.reduce((sum, session) => sum + session.accuracy, 0) /
        recentSessions.length
    );
    const averageHesitations = Number(
      (
        recentSessions.reduce((sum, session) => sum + session.hesitationsCount, 0) /
        recentSessions.length
      ).toFixed(1)
    );

    if (currentGame === 'reminiscence_album') {
      return {
        level: 1,
        previousLevel: 1,
        reason: 'This reminiscence activity stays gentle so familiar memories remain reassuring.',
        averageAccuracy,
        averageHesitations,
      };
    }

    const sustainedHighAccuracy =
      recentSessions.length === 3 &&
      averageAccuracy >= 85 &&
      recentSessions.every((session) => session.accuracy >= 80);

    if (sustainedHighAccuracy && averageHesitations <= 1) {
      const level = Math.min(5, previousLevel + 1) as DifficultyTier;
      return {
        level,
        previousLevel,
        reason:
          level > previousLevel
            ? 'Next game will be a little more challenging because recent answers were accurate with little hesitation.'
            : 'The highest level is being kept because recent answers were accurate with little hesitation.',
        averageAccuracy,
        averageHesitations,
      };
    }

    if (averageAccuracy < 60 || averageHesitations >= 4) {
      const level = Math.max(1, previousLevel - 1) as DifficultyTier;
      return {
        level,
        previousLevel,
        reason:
          level < previousLevel
            ? 'Next game will be gentler because recent games needed more time or hints.'
            : 'The gentlest level is being kept because recent games needed more time or hints.',
        averageAccuracy,
        averageHesitations,
      };
    }

    return {
      level: previousLevel,
      previousLevel,
      reason: 'Next game will stay at the same level because recent performance was steady.',
      averageAccuracy,
      averageHesitations,
    };
  }

  getConfigForLevel(currentGame: GameType, level: DifficultyTier): DifficultyConfig {
    switch (currentGame) {
      case 'majuli_memory':
        return {
          level,
          gridSize:
            level === 1
              ? { rows: 2, cols: 2 } // 4 cards (2 pairs) - Gentle
              : level === 2
              ? { rows: 2, cols: 3 } // 6 cards (3 pairs) - Moderate
              : level === 3
              ? { rows: 2, cols: 4 } // 8 cards (4 pairs) - Challenging
              : level === 4
              ? { rows: 3, cols: 4 } // 12 cards (6 pairs) - Advanced
              : { rows: 4, cols: 4 }, // 16 cards (8 pairs) - Intense Grandmaster
          hintCooldownSeconds: Math.max(3, 10 - level * 1.5),
        };

      case 'chai_harvest':
        return {
          level,
          speedMultiplier: 0.7 + level * 0.35, // Level 5 is 2.45x speed!
          distractionDensity: Math.min(0.55, 0.05 + level * 0.1),
          timeLimitSeconds: level >= 4 ? 30 : level === 3 ? 40 : 50,
        };

      case 'daily_sequence':
        return {
          level,
          itemsCount: level === 1 ? 3 : level === 2 ? 4 : level === 3 ? 5 : level === 4 ? 6 : 7,
          hintCooldownSeconds: Math.max(3, 8 - level),
        };

      case 'weave_pattern':
        return {
          level,
          itemsCount: level <= 2 ? 3 : level <= 4 ? 4 : 5,
          distractionDensity: level * 0.12,
        };

      case 'reminiscence_album':
      default:
        return {
          level: 1,
          hintCooldownSeconds: 5,
        };
    }
  }

  shouldOfferHint(lastInteractionTime: number, hintsUsedCount: number): boolean {
    const elapsed = Date.now() - lastInteractionTime;
    return elapsed >= this.HESITATION_THRESHOLD_MS && hintsUsedCount < 2;
  }

  computeCognitiveMetrics(sessions: GameSession[]): CognitiveMetrics {
    if (!sessions || sessions.length === 0) {
      return {
        memoryIndex: 82,
        attentionIndex: 85,
        executiveFunction: 80,
        motorReactionScore: 78,
        overallCognitiveScore: 81,
        fatigueIndex: 14,
        riskOfDecline: 'Low',
        clinicalSummary:
          'Baseline cognitive performance is stable. Patient actively engages with visual memory, executive sequencing, and sensory-motor exercises.',
      };
    }

    const memorySessions = sessions.filter(
      (s) => s.gameType === 'majuli_memory' || s.gameType === 'reminiscence_album'
    );
    const attentionSessions = sessions.filter(
      (s) => s.gameType === 'chai_harvest' || s.gameType === 'weave_pattern'
    );
    const executiveSessions = sessions.filter((s) => s.gameType === 'daily_sequence');

    const avg = (arr: GameSession[], key: keyof GameSession) =>
      arr.length > 0
        ? Math.round(arr.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0) / arr.length)
        : 75;

    const memoryIndex = Math.min(100, Math.max(25, avg(memorySessions, 'accuracy')));
    const attentionIndex = Math.min(100, Math.max(25, avg(attentionSessions, 'accuracy')));
    const executiveFunction = Math.min(100, Math.max(25, avg(executiveSessions, 'accuracy')));

    const avgReactionTime = avg(sessions, 'avgReactionTimeMs') || 1400;
    const motorReactionScore = Math.min(
      100,
      Math.max(35, Math.round(115 - (avgReactionTime / 2400) * 55))
    );

    const overallCognitiveScore = Math.round(
      memoryIndex * 0.35 + attentionIndex * 0.25 + executiveFunction * 0.25 + motorReactionScore * 0.15
    );

    const avgHesitations = avg(sessions, 'hesitationsCount');
    const fatigueIndex = Math.min(100, Math.max(5, avgHesitations * 10));

    let riskOfDecline: 'Low' | 'Moderate' | 'High' = 'Low';
    let clinicalSummary =
      'Cognitive indices demonstrate strong stability and reliable short-term memory retrieval across multiple clinical domains.';

    if (sessions.length >= 4) {
      const firstHalf = sessions.slice(0, Math.floor(sessions.length / 2));
      const secondHalf = sessions.slice(Math.floor(sessions.length / 2));

      const firstAvg = avg(firstHalf, 'accuracy');
      const secondAvg = avg(secondHalf, 'accuracy');

      const declineDelta = firstAvg - secondAvg;

      if (declineDelta >= 14 || overallCognitiveScore < 60) {
        riskOfDecline = 'High';
        clinicalSummary =
          'Clinical Alert: Noticeable downward shift in memory and sequence recall over recent sessions. Full neurological review recommended.';
      } else if (declineDelta >= 7 || overallCognitiveScore < 72) {
        riskOfDecline = 'Moderate';
        clinicalSummary =
          'Mild fluctuation in focus and motor reaction times observed. Recommend scheduled cognitive therapy sessions and hydration adherence.';
      }
    }

    return {
      memoryIndex,
      attentionIndex,
      executiveFunction,
      motorReactionScore,
      overallCognitiveScore,
      fatigueIndex,
      riskOfDecline,
      clinicalSummary,
    };
  }
}

export const aiEngine = new AIEngine();
