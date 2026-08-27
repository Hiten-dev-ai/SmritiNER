import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { aiEngine } from '../../services/aiEngine';
import { Activity, ShieldCheck, TrendingUp } from 'lucide-react';
import type { GameSession } from '../../types';

interface CognitiveChartsProps {
  sessions: GameSession[];
}

export const CognitiveCharts: React.FC<CognitiveChartsProps> = ({ sessions }) => {
  const metrics = aiEngine.computeCognitiveMetrics(sessions);
  const needsSupport = metrics.engagementTrend === 'needs-support';
  const variable = metrics.engagementTrend === 'variable';
  const trendLabel = metrics.engagementTrend === 'insufficient-data'
    ? 'More activity needed'
    : metrics.engagementTrend === 'needs-support'
      ? 'Needs more support'
      : metrics.engagementTrend === 'variable'
        ? 'Variable participation'
        : 'Steady participation';

  // Format session data for Recharts (group by date or chronological session)
  const trajectoryData = sessions.slice(-10).map((s, idx) => ({
    name: `S${idx + 1} (${new Date(s.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})`,
    Score: s.score,
    Accuracy: s.accuracy,
    ReactionTime: Math.round(s.avgReactionTimeMs / 10), // scaled
    Level: s.difficultyLevel * 20,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Non-diagnostic engagement status */}
      <div
        className={`rounded-3xl p-6 border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          needsSupport
            ? 'bg-rose-50 border-rose-400 text-rose-950'
            : variable
            ? 'bg-amber-50 border-amber-400 text-amber-950'
            : 'bg-emerald-50 border-emerald-400 text-emerald-950'
        }`}
      >
        <div className="flex items-start space-x-3">
          <div
            className={`p-3 rounded-2xl ${
              needsSupport
                ? 'bg-rose-200 text-rose-800'
                : variable
                ? 'bg-amber-200 text-amber-800'
                : 'bg-emerald-200 text-emerald-800'
            }`}
          >
            {needsSupport ? (
              <Activity className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white shadow-sm">
                Engagement trend: {trendLabel}
              </span>
            </div>
            <h3 className="text-lg font-black mt-1">Suggested caregiver support</h3>
            <p className="text-xs sm:text-sm font-medium mt-0.5 opacity-90">
              {metrics.supportSummary}
            </p>
          </div>
        </div>

        <div className="shrink-0 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-sm border border-black/5 text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
            Recent engagement index
          </span>
          <span className="text-2xl sm:text-3xl font-black text-stone-900">
            {metrics.overallCognitiveScore}
            <span className="text-sm font-normal text-stone-500">/100</span>
          </span>
        </div>
      </div>

      {/* Activity-derived engagement indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Memory Retention', val: metrics.memoryIndex, color: 'text-tea-800', barColor: 'bg-tea-600' },
          { label: 'Attention & Focus', val: metrics.attentionIndex, color: 'text-blue-700', barColor: 'bg-blue-600' },
          { label: 'Executive Routine', val: metrics.executiveFunction, color: 'text-amber-700', barColor: 'bg-amber-500' },
          { label: 'Motor Reaction', val: metrics.motorReactionScore, color: 'text-purple-700', barColor: 'bg-purple-600' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
              {item.label}
            </span>
            <div className="flex items-baseline space-x-1 mb-2">
              <span className={`text-2xl sm:text-3xl font-black ${item.color}`}>{item.val}</span>
              <span className="text-xs font-semibold text-stone-400">%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${item.barColor}`}
                style={{ width: `${item.val}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Recent game activity trend */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-tea-700" />
              <span>Cognitive Engagement Trends</span>
            </h4>
            <p className="text-xs text-stone-500">
              Shows recent game accuracy and on-device difficulty adjustments. It is not a diagnostic score.
            </p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trajectoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#236338" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#236338" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#78716c' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e7e5e4',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="Score"
                stroke="#236338"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#scoreGrad)"
              />
              <Area
                type="monotone"
                dataKey="Accuracy"
                stroke="#0284c7"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#accGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
