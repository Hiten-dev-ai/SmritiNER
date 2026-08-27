import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { audioManager } from '../../services/audioManager';
import { Droplets, Plus, Minus, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { DailyHydrationLog } from '../../types';
import { useApp } from '../../context/AppContext';

export const HydrationTracker: React.FC = () => {
  const { t } = useApp();
  const todayStr = new Date().toISOString().split('T')[0];
  const logs = useLiveQuery(() => db.hydrationLogs.where('date').equals(todayStr).toArray()) || [];
  const todayLog: DailyHydrationLog | undefined = logs[0];

  const glasses = todayLog?.glassesDrunk ?? 0;
  const targetGlasses = todayLog?.targetGlasses ?? 6;

  const updateHydration = async (newCount: number) => {
    audioManager.playTap();
    const clamped = Math.max(0, Math.min(10, newCount));
    if (clamped >= targetGlasses && glasses < targetGlasses) {
      audioManager.playVictory();
      confetti({ particleCount: 40, spread: 60, colors: ['#0284c7', '#38bdf8', '#bae6fd'] });
    } else {
      audioManager.playSuccess();
    }

    if (todayLog && todayLog.id) {
      await db.hydrationLogs.update(todayLog.id, {
        glassesDrunk: clamped,
        synced: false,
      });
    } else {
      await db.hydrationLogs.add({
        patientId: 'pat-ner-001',
        date: todayStr,
        glassesDrunk: clamped,
        targetGlasses: 6,
        synced: false,
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-sky-50 to-blue-100/50 rounded-3xl p-5 sm:p-6 border-2 border-brahma-300 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-brahma-600 text-white rounded-2xl shadow-xs">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-brahma-950 leading-tight">
              {t.hydrationTitle}
            </h3>
          </div>
        </div>

        <span className="text-xs sm:text-sm font-black bg-white text-brahma-900 px-3 py-1 rounded-full border border-brahma-200 shadow-xs">
          {glasses} / {targetGlasses} {t.glasses}
        </span>
      </div>

      {/* Glasses Row */}
      <div className="grid grid-cols-6 gap-2 sm:gap-3 my-4 max-w-md mx-auto">
        {[1, 2, 3, 4, 5, 6].map((gIndex) => {
          const isDrunk = glasses >= gIndex;

          return (
            <button
              key={gIndex}
              onClick={() => updateHydration(isDrunk ? gIndex - 1 : gIndex)}
              className={`tactile-btn relative h-16 sm:h-18 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                isDrunk
                  ? 'bg-gradient-to-t from-brahma-500 to-sky-400 border-brahma-600 text-white shadow-xs scale-105'
                  : 'bg-white border-dashed border-brahma-300 text-brahma-300 hover:border-brahma-400'
              }`}
              aria-label={`${gIndex} ${t.glasses}`}
              aria-pressed={isDrunk}
            >
              <Droplets className={`w-5 h-5 sm:w-6 sm:h-6 ${isDrunk ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-bold mt-0.5">{gIndex}</span>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-brahma-200/60">
        <div>
          {glasses >= targetGlasses ? (
            <span className="flex items-center space-x-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.targetAchieved}</span>
            </span>
          ) : (
            <span className="text-xs font-bold text-brahma-800">
              {targetGlasses - glasses} {t.remaining}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => updateHydration(glasses - 1)}
            disabled={glasses === 0}
            className="tactile-btn min-w-11 min-h-11 rounded-xl bg-white text-brahma-900 border border-brahma-300 disabled:opacity-40 flex items-center justify-center"
            aria-label="Remove one glass"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => updateHydration(glasses + 1)}
            className="tactile-btn min-h-11 px-3 rounded-xl bg-brahma-600 hover:bg-brahma-700 text-white font-bold text-xs flex items-center space-x-1 shadow-xs"
            aria-label={t.addGlass}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addGlass}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
