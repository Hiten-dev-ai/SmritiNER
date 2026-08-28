import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  CalendarDays,
  Clock3,
  Compass,
  HandHeart,
  HeartHandshake,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import type { DailyHydrationLog, GameProgress, JourneyGameSession, ReminderItem } from '../../types';
import { computeEngagementAnalytics } from '../../services/analyticsEngine';
import { journeyDefinitions } from '../../services/journeyEngine';

interface CognitiveChartsProps {
  sessions: JourneyGameSession[];
  reminders: ReminderItem[];
  hydrationLogs: DailyHydrationLog[];
  gameProgress?: Record<string, GameProgress>;
}

export const CognitiveCharts: React.FC<CognitiveChartsProps> = ({
  sessions,
  reminders,
  hydrationLogs,
  gameProgress = {},
}) => {
  const analytics = computeEngagementAnalytics(sessions, reminders, hydrationLogs);
  const chart = sessions.slice(-20).map((session) => ({
    date: new Date(session.completedAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    }),
    Accuracy: session.accuracy,
    'Response consistency': Math.max(
      0,
      100 - Math.round(session.responseVariabilityMs / 20)
    ),
    'Memory load': (session.memoryLoad || 3) * 10,
  }));

  const totalComfortReplays = sessions.filter((s) => s.stageSource === 'manual').length;

  return (
    <div className="space-y-5">
      {/* Baseline status alert */}
      <section
        className={`rounded-3xl border-2 p-5 ${
          analytics.notableChange
            ? 'border-amber-400 bg-amber-50'
            : 'border-emerald-300 bg-emerald-50'
        }`}
      >
        <div className="flex items-start gap-3">
          {analytics.notableChange ? (
            <TriangleAlert className="mt-1 h-7 w-7 shrink-0 text-amber-800" />
          ) : (
            <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-emerald-800" />
          )}
          <div>
            <h2 className="text-xl font-black text-stone-950">
              {analytics.notableChange
                ? 'Notable change — check in'
                : 'No consistent notable change detected'}
            </h2>
            <p className="mt-1 max-w-4xl font-semibold text-stone-700">
              {analytics.notableChange
                ? 'Two or more engagement measures shifted from this patient’s personal baseline across multiple days. Check sleep, illness, mood, medicine changes, or device conditions. Discuss sudden or persistent changes with a qualified clinician.'
                : 'Recent activity is being compared only with this patient’s own baseline. These observations are not a dementia diagnosis or clinical score.'}
            </p>
          </div>
        </div>
      </section>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            icon: CalendarDays,
            label: 'Active days (7)',
            value: `${analytics.activeDaysLast7}/7`,
          },
          {
            icon: Activity,
            label: 'Completed journeys',
            value: analytics.completedSessions,
          },
          {
            icon: ShieldCheck,
            label: 'Completion rate',
            value: `${analytics.completionRate}%`,
          },
          {
            icon: HeartHandshake,
            label: 'Comfort replays',
            value: totalComfortReplays,
          },
          {
            icon: Clock3,
            label: 'Median response',
            value: analytics.medianResponseMs
              ? `${(analytics.medianResponseMs / 1000).toFixed(1)}s`
              : '—',
          },
          {
            icon: Lightbulb,
            label: 'Hints per session',
            value: analytics.averageHints || '—',
          },
          {
            icon: Activity,
            label: 'Accuracy consistency',
            value: analytics.completedSessions > 1 ? `${analytics.accuracyConsistency}%` : '—',
          },
          {
            icon: Sparkles,
            label: 'Games available',
            value: '8 / 8',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <card.icon className="h-6 w-6 text-tea-700" />
            <span className="mt-3 block text-xs font-bold text-stone-500">{card.label}</span>
            <span className="mt-1 block text-2xl font-black text-stone-950">{card.value}</span>
          </div>
        ))}
      </div>

      {/* 12-Stage Game Journeys Section */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-teal-700" />
          <h2 className="text-xl font-black text-stone-950">Game Journey Progression (12 Stages)</h2>
        </div>
        <p className="mt-1 text-sm font-semibold text-stone-500">
          Persistent unlock frontiers and suggested stages across all 8 games. Unlocked stages are never lost.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {journeyDefinitions.map((game) => {
            const prog = gameProgress[game.id];
            const unlocked = prog?.unlockedStage || 1;
            const recommended = prog?.recommendedStage || 1;
            const gameSessions = sessions.filter((s) => s.gameType === game.id);
            const count = gameSessions.length;
            const avgAcc = count
              ? Math.round(gameSessions.reduce((sum, s) => sum + s.accuracy, 0) / count)
              : null;

            return (
              <div
                key={game.id}
                className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 transition hover:border-tea-400 hover:bg-white"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{game.emoji}</span>
                  <span className="rounded-full bg-tea-100 px-2.5 py-0.5 text-xs font-black text-tea-800">
                    Stage {unlocked}/12
                  </span>
                </div>
                <h3 className="mt-2 text-base font-black text-stone-900">{game.title}</h3>
                <p className="text-xs font-semibold text-stone-500 capitalize">{game.domain}</p>

                <div className="mt-3 flex items-center justify-between text-xs font-bold text-stone-600 border-t pt-2">
                  <span>Recommended: Stage {recommended}</span>
                  <span>{avgAcc !== null ? `${avgAcc}% avg` : 'No plays yet'}</span>
                </div>

                {/* Mini 12-stage bar */}
                <div className="mt-2 flex h-2 gap-0.5 overflow-hidden rounded-full bg-stone-200">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((st) => (
                    <div
                      key={st}
                      className={`flex-1 transition-all ${
                        st === recommended
                          ? 'bg-emerald-500 ring-1 ring-emerald-600'
                          : st <= unlocked
                          ? 'bg-tea-700'
                          : 'bg-stone-200'
                      }`}
                      title={`Stage ${st}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Engagement Pattern Chart */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Recent engagement pattern</h2>
          <p className="text-sm font-semibold text-stone-500">
            Accuracy and response consistency from completed game sessions
          </p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="accuracy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#236338" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#236338" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="Accuracy"
                  stroke="#236338"
                  strokeWidth={3}
                  fill="url(#accuracy)"
                />
                <Area
                  type="monotone"
                  dataKey="Response consistency"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Care routine</h2>
          <div className="mt-4 space-y-4">
            <Adherence label="Medicine completion" value={analytics.medicationAdherence} />
            <Adherence label="Routine completion" value={analytics.routineAdherence} />
            <Adherence label="Hydration target" value={analytics.hydrationAdherence} />
            <div className="border-t pt-4">
              <p className="text-sm font-black text-stone-500">TIME OF DAY</p>
              {analytics.timeOfDay.map((bucket) => (
                <div key={bucket.label} className="mt-3 flex items-center justify-between">
                  <span className="font-bold">{bucket.label}</span>
                  <span className="text-sm font-semibold text-stone-600">
                    {bucket.sessions ? `${bucket.accuracy}% · ${bucket.sessions} sessions` : 'No data'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Change from Personal Baseline Table */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <HandHeart className="h-6 w-6 text-brahma-700" />
          <h2 className="text-xl font-black">Change from personal baseline</h2>
        </div>
        <p className="mt-1 text-sm font-semibold text-stone-500">
          A baseline needs five earlier and five recent comparable sessions. Values describe game engagement only.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b text-sm text-stone-500">
                <th className="p-3">Area</th>
                <th className="p-3">Data</th>
                <th className="p-3">Accuracy</th>
                <th className="p-3">Response time</th>
                <th className="p-3">Support use</th>
                <th className="p-3">Observation</th>
              </tr>
            </thead>
            <tbody>
              {analytics.trends.length ? (
                analytics.trends.map((trend) => (
                  <tr key={trend.domain} className="border-b last:border-0">
                    <td className="p-3 font-black">{trend.label}</td>
                    <td className="p-3 font-semibold">{trend.sessions} sessions</td>
                    <td className="p-3">
                      {trend.status === 'insufficient-data'
                        ? '—'
                        : `${trend.baselineAccuracy}% → ${trend.recentAccuracy}% (${
                            trend.accuracyChange! >= 0 ? '+' : ''
                          }${trend.accuracyChange})`}
                    </td>
                    <td className="p-3">
                      {trend.responseChangePercent === undefined
                        ? '—'
                        : `${trend.responseChangePercent >= 0 ? '+' : ''}${
                            trend.responseChangePercent
                          }%`}
                    </td>
                    <td className="p-3">
                      {trend.hintChange === undefined
                        ? '—'
                        : `${trend.hintChange >= 0 ? '+' : ''}${trend.hintChange} hints`}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-black ${
                          trend.status === 'notable-change'
                            ? 'bg-amber-100 text-amber-900'
                            : trend.status === 'improving'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {trend.status === 'insufficient-data'
                          ? 'Insufficient data'
                          : trend.status === 'notable-change'
                          ? 'Check in'
                          : trend.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center font-semibold text-stone-500">
                    Complete games to begin a personal baseline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="flex items-start gap-2 rounded-2xl bg-stone-100 p-4 text-sm font-semibold text-stone-600">
        <HandHeart className="mt-0.5 h-5 w-5 shrink-0" />
        Device, time of day, interruptions, vision, hearing, familiarity, illness, and mood can influence results. This dashboard supports caregiver observation and does not diagnose or predict dementia.
      </p>
    </div>
  );
};

const Adherence: React.FC<{ label: string; value: number | null }> = ({ label, value }) => (
  <div>
    <div className="flex justify-between text-sm font-bold">
      <span>{label}</span>
      <span>{value === null ? 'No data' : `${value}%`}</span>
    </div>
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
      <div
        className="h-full rounded-full bg-tea-600"
        style={{ width: `${value || 0}%` }}
      />
    </div>
  </div>
);
