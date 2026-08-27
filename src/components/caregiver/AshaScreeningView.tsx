import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { audioManager } from '../../services/audioManager';
import {
  Stethoscope,
  UserPlus,
  FileCheck,
  MapPin,
} from 'lucide-react';
import type { AshaScreeningRecord } from '../../types';

export const AshaScreeningView: React.FC = () => {
  const pastScreenings = useLiveQuery(() => db.ashaScreenings.toArray()) || [];

  const [elderName, setElderName] = useState('');
  const [elderAge, setElderAge] = useState<number>(72);
  const [villageName, setVillageName] = useState('Teok Gaon');
  const [district, setDistrict] = useState('Jorhat');
  const [ashaWorkerName] = useState('Jonali Das');

  // Scores
  const [orientationScore, setOrientationScore] = useState<number>(4);
  const [memoryRecallScore, setMemoryRecallScore] = useState<number>(4);
  const [attentionMathScore, setAttentionMathScore] = useState<number>(3);
  const [handloomPatternScore, setHandloomPatternScore] = useState<number>(4);
  const [routineRecallScore, setRoutineRecallScore] = useState<number>(5);
  const [ashaNotes, setAshaNotes] = useState('');

  const totalScore =
    orientationScore +
    memoryRecallScore +
    attentionMathScore +
    handloomPatternScore +
    routineRecallScore;

  const getRiskCategory = (score: number) => {
    if (score >= 20) return 'Normal Cognitive Aging';
    if (score >= 15) return 'Mild Impairment / Watchlist';
    return 'Urgent Neurological Referral';
  };

  const riskCategory = getRiskCategory(totalScore);

  const handleSubmitScreening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!elderName.trim()) return;

    audioManager.playSuccess();

    const record: Omit<AshaScreeningRecord, 'id'> = {
      elderName: elderName.trim(),
      elderAge,
      villageName,
      district,
      ashaWorkerName,
      screeningDate: new Date().toISOString().split('T')[0],
      orientationScore,
      memoryRecallScore,
      attentionMathScore,
      handloomPatternScore,
      routineRecallScore,
      totalScore,
      dementiaRiskCategory: riskCategory as any,
      ashaNotes: ashaNotes.trim() || 'Screening conducted during home visit.',
      synced: false,
    };

    await db.ashaScreenings.add(record as AshaScreeningRecord);

    setElderName('');
    setAshaNotes('');
    alert('ASHA Cognitive Screening Record saved to local IndexedDB successfully!');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gamusaRed-600 to-rose-700 rounded-3xl p-6 text-white shadow-md">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-white/20 rounded-2xl">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black">
              ASHA & Anganwadi Field Cognitive Screening Tool
            </h3>
            <p className="text-xs sm:text-sm text-rose-100">
              Rapid MoCA-adapted 5-minute screening for rural North Eastern village elders
            </p>
          </div>
        </div>
      </div>

      {/* Field Screening Form */}
      <form
        onSubmit={handleSubmitScreening}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6"
      >
        <h4 className="text-lg font-black text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-gamusaRed-600" />
          <span>Conduct New Village Elder Cognitive Screening</span>
        </h4>

        {/* Demographics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">Elder's Full Name</label>
            <input
              type="text"
              value={elderName}
              onChange={(e) => setElderName(e.target.value)}
              placeholder="e.g. Minati Saikia"
              required
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-gamusaRed-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">Age (Years)</label>
            <input
              type="number"
              value={elderAge}
              onChange={(e) => setElderAge(Number(e.target.value))}
              min={50}
              max={105}
              required
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-gamusaRed-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">Village & District</label>
            <input
              type="text"
              value={`${villageName}, ${district}`}
              onChange={(e) => {
                const parts = e.target.value.split(',');
                setVillageName(parts[0]?.trim() || '');
                setDistrict(parts[1]?.trim() || 'Jorhat');
              }}
              required
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-gamusaRed-500"
            />
          </div>
        </div>

        {/* 5-Domain Standard Evaluation */}
        <div className="space-y-4 pt-2">
          <h5 className="text-xs font-black uppercase tracking-wider text-stone-500">
            5-Domain Cognitive Scorecard (0 to 5 Points Each)
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Orientation */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <span className="text-xs font-bold text-stone-700 block mb-1">
                1. Orientation (Time & Place)
              </span>
              <p className="text-[11px] text-stone-500 mb-2">Year, Season, Day, District, Village</p>
              <select
                value={orientationScore}
                onChange={(e) => setOrientationScore(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-sm bg-white"
              >
                {[0, 1, 2, 3, 4, 5].map((s) => (
                  <option key={s} value={s}>{s} / 5 Points</option>
                ))}
              </select>
            </div>

            {/* 2. Memory 3-Word Recall */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <span className="text-xs font-bold text-stone-700 block mb-1">
                2. Memory Recall (3 Words)
              </span>
              <p className="text-[11px] text-stone-500 mb-2">Rhino, Tea leaf, Muga silk</p>
              <select
                value={memoryRecallScore}
                onChange={(e) => setMemoryRecallScore(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-sm bg-white"
              >
                {[0, 1, 2, 3, 4, 5].map((s) => (
                  <option key={s} value={s}>{s} / 5 Points</option>
                ))}
              </select>
            </div>

            {/* 3. Attention & Sequence */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <span className="text-xs font-bold text-stone-700 block mb-1">
                3. Attention & Counting
              </span>
              <p className="text-[11px] text-stone-500 mb-2">Counting backwards from 20</p>
              <select
                value={attentionMathScore}
                onChange={(e) => setAttentionMathScore(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-sm bg-white"
              >
                {[0, 1, 2, 3, 4, 5].map((s) => (
                  <option key={s} value={s}>{s} / 5 Points</option>
                ))}
              </select>
            </div>

            {/* 4. Pattern Recognition */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <span className="text-xs font-bold text-stone-700 block mb-1">
                4. Handloom Motif Pattern
              </span>
              <p className="text-[11px] text-stone-500 mb-2">Gamosa motif matching check</p>
              <select
                value={handloomPatternScore}
                onChange={(e) => setHandloomPatternScore(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-sm bg-white"
              >
                {[0, 1, 2, 3, 4, 5].map((s) => (
                  <option key={s} value={s}>{s} / 5 Points</option>
                ))}
              </select>
            </div>

            {/* 5. Routine Recall */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <span className="text-xs font-bold text-stone-700 block mb-1">
                5. Routine & Executive Order
              </span>
              <p className="text-[11px] text-stone-500 mb-2">Order of morning routine steps</p>
              <select
                value={routineRecallScore}
                onChange={(e) => setRoutineRecallScore(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-sm bg-white"
              >
                {[0, 1, 2, 3, 4, 5].map((s) => (
                  <option key={s} value={s}>{s} / 5 Points</option>
                ))}
              </select>
            </div>

            {/* Total Assessment Score Pill */}
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900 block">Total Screening Score</span>
                <span className="text-2xl font-black text-amber-950">{totalScore} / 25</span>
              </div>
              <span className="text-[11px] font-bold text-amber-800 mt-1">
                Category: <strong>{riskCategory}</strong>
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-600 mb-1">
            ASHA Worker Clinical Observations
          </label>
          <textarea
            rows={2}
            value={ashaNotes}
            onChange={(e) => setAshaNotes(e.target.value)}
            placeholder="e.g. Elder is active but had slight hesitation during month recall. Advised family for hydration."
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-gamusaRed-500"
          />
        </div>

        <button
          type="submit"
          className="tactile-btn w-full py-4 rounded-2xl bg-gamusaRed-600 hover:bg-gamusaRed-700 text-white font-black text-base shadow-md flex items-center justify-center space-x-2"
        >
          <FileCheck className="w-5 h-5" />
          <span>Save Rural Screening Record (Offline-Ready)</span>
        </button>
      </form>

      {/* Past Village Screening Logs */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
        <h4 className="text-base font-black text-stone-900 mb-4">
          Recent Village Elder Screenings (ASHA Health Registry)
        </h4>

        <div className="divide-y divide-stone-100">
          {pastScreenings.map((rec) => (
            <div key={rec.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h5 className="font-bold text-stone-900 text-base">{rec.elderName}</h5>
                  <span className="text-xs text-stone-500">({rec.elderAge} yrs)</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      rec.dementiaRiskCategory === 'Urgent Neurological Referral'
                        ? 'bg-red-100 text-red-800'
                        : rec.dementiaRiskCategory === 'Mild Impairment / Watchlist'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {rec.dementiaRiskCategory}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> {rec.villageName}, {rec.district} • Screened by ASHA {rec.ashaWorkerName} ({rec.screeningDate})
                </p>
                <p className="text-xs text-stone-600 mt-1 italic">{rec.ashaNotes}</p>
              </div>

              <div className="shrink-0 bg-stone-50 px-4 py-2 rounded-2xl border border-stone-200 text-center">
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Score</span>
                <span className="text-xl font-black text-stone-800">{rec.totalScore}/25</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
