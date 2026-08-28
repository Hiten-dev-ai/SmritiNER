import type { CognitiveDomain, DailyHydrationLog, JourneyGameSession, ReminderItem } from '../types';

export interface DomainTrend {
  domain: CognitiveDomain;
  label: string;
  status: 'insufficient-data' | 'steady' | 'improving' | 'notable-change';
  baselineAccuracy?: number;
  recentAccuracy?: number;
  accuracyChange?: number;
  responseChangePercent?: number;
  hintChange?: number;
  sessions: number;
}
export interface EngagementAnalytics {
  lastActive?: string;
  activeDaysLast7: number;
  completedSessions: number;
  completionRate: number;
  averageAccuracy: number;
  accuracyConsistency: number;
  averageHints: number;
  medianResponseMs: number;
  responseVariabilityMs: number;
  medicationAdherence: number | null;
  routineAdherence: number | null;
  hydrationAdherence: number | null;
  timeOfDay: Array<{ label: string; accuracy: number; sessions: number }>;
  trends: DomainTrend[];
  notableChange: boolean;
}

const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const domainLabels: Partial<Record<CognitiveDomain, string>> = {
  'visual-memory': 'Visual memory', 'working-memory': 'Working memory', memory: 'Everyday recall', recognition: 'Object recognition',
  sequencing: 'Daily sequencing', 'pattern-recognition': 'Pattern recognition', reminiscence: 'Reminiscence engagement',
};

export function computeEngagementAnalytics(sessions: JourneyGameSession[], reminders: ReminderItem[] = [], hydrationLogs: DailyHydrationLog[] = []): EngagementAnalytics {
  const completed = sessions.filter((session) => session.completionStatus === 'completed').sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
  const days = new Set(completed.filter((session) => Date.now() - new Date(session.completedAt).getTime() <= 7 * 86400000).map((session) => session.completedAt.slice(0, 10)));
  const domains = [...new Set(completed.map((session) => session.domain))];
  const trends = domains.map((domain): DomainTrend => {
    const matching = completed.filter((session) => session.domain === domain);
    if (matching.length < 10) return { domain, label: domainLabels[domain] || domain, status: 'insufficient-data', sessions: matching.length };
    const baseline = matching.slice(0, 5); const recent = matching.slice(-5);
    const baselineAccuracy = Math.round(average(baseline.map((session) => session.accuracy)));
    const recentAccuracy = Math.round(average(recent.map((session) => session.accuracy)));
    const accuracyChange = recentAccuracy - baselineAccuracy;
    const baselineResponse = average(baseline.map((session) => session.medianResponseMs));
    const recentResponse = average(recent.map((session) => session.medianResponseMs));
    const responseChangePercent = baselineResponse ? Math.round(((recentResponse - baselineResponse) / baselineResponse) * 100) : 0;
    const hintChange = Number((average(recent.map((session) => session.hintsUsed)) - average(baseline.map((session) => session.hintsUsed))).toFixed(1));
    const recentDays = new Set(recent.map((session) => session.completedAt.slice(0, 10))).size;
    const worsened = [accuracyChange <= -15, responseChangePercent >= 25, hintChange >= 2].filter(Boolean).length;
    const improved = accuracyChange >= 10 && responseChangePercent <= 10;
    return { domain, label: domainLabels[domain] || domain, status: worsened >= 2 && recentDays >= 3 ? 'notable-change' : improved ? 'improving' : 'steady', baselineAccuracy, recentAccuracy, accuracyChange, responseChangePercent, hintChange, sessions: matching.length };
  });
  const adherence = (category: ReminderItem['category']) => {
    const relevant = reminders.filter((reminder) => reminder.category === category);
    if (!relevant.length) return null;
    const completedCount = relevant.reduce((sum, reminder) => sum + (reminder.completedDates?.filter((date) => Date.now() - new Date(`${date}T12:00:00`).getTime() <= 7 * 86400000).length || 0), 0);
    return Math.min(100, Math.round((completedCount / (relevant.length * 7)) * 100));
  };
  const buckets = [{ label: 'Morning', from: 5, to: 12 }, { label: 'Afternoon', from: 12, to: 17 }, { label: 'Evening', from: 17, to: 24 }];
  const timeOfDay = buckets.map((bucket) => { const values = completed.filter((session) => { const hour = new Date(session.completedAt).getHours(); return hour >= bucket.from && hour < bucket.to; }); return { label: bucket.label, sessions: values.length, accuracy: Math.round(average(values.map((session) => session.accuracy))) }; });
  return {
    lastActive: completed.at(-1)?.completedAt, activeDaysLast7: days.size, completedSessions: completed.length,
    completionRate: sessions.length ? Math.round((completed.length / sessions.length) * 100) : 0,
    averageAccuracy: Math.round(average(completed.map((session) => session.accuracy))),
    accuracyConsistency: completed.length > 1 ? Math.max(0, Math.round(100 - Math.sqrt(average(completed.map((session) => (session.accuracy - average(completed.map((item) => item.accuracy))) ** 2))) * 2)) : 0,
    averageHints: Number(average(completed.map((session) => session.hintsUsed)).toFixed(1)),
    medianResponseMs: Math.round(median(completed.map((session) => session.medianResponseMs))), responseVariabilityMs: Math.round(average(completed.map((session) => session.responseVariabilityMs))),
    medicationAdherence: adherence('medicine'), routineAdherence: adherence('routine'),
    hydrationAdherence: hydrationLogs.length ? Math.round(hydrationLogs.filter((log) => Date.now() - new Date(`${log.date}T12:00:00`).getTime() <= 7 * 86400000).reduce((sum, log) => sum + Math.min(1, log.glassesDrunk / Math.max(1, log.targetGlasses)), 0) / 7 * 100) : null,
    timeOfDay, trends,
    notableChange: trends.some((trend) => trend.status === 'notable-change'),
  };
}
