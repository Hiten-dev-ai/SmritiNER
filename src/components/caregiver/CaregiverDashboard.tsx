import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import { aiEngine } from '../../services/aiEngine';
import { generateClinicalPDF } from '../../services/reportGenerator';
import { CognitiveCharts } from './CognitiveCharts';
import { ReminderManager } from './ReminderManager';
import { ReminiscenceManager } from './ReminiscenceManager';
import { AshaScreeningView } from './AshaScreeningView';
import {
  Activity,
  CalendarCheck,
  Heart,
  Stethoscope,
  FileDown,
  User,
  MapPin,
  Phone,
  HardDrive,
} from 'lucide-react';

type CaregiverTab = 'analytics' | 'reminders' | 'photos' | 'asha';

export const CaregiverDashboard: React.FC = () => {
  const { currentPatient } = useApp();
  const [activeTab, setActiveTab] = useState<CaregiverTab>('analytics');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const sessions = useLiveQuery(() => db.gameSessions.toArray()) || [];
  const reminders = useLiveQuery(() => db.reminders.toArray()) || [];

  const handleDownloadPDF = async () => {
    if (!currentPatient) return;
    audioManager.playTap();
    setIsGeneratingPdf(true);

    try {
      const metrics = aiEngine.computeCognitiveMetrics(sessions);
      generateClinicalPDF(currentPatient, metrics, sessions, reminders);
      audioManager.playSuccess();
    } catch {
      // safe fallback
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-fade-in">
      {/* Top Patient Profile Summary Bar */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 w-full md:w-auto">
          <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-brahma-500 to-brahma-700 text-white flex items-center justify-center font-black text-2xl shadow-md">
            {currentPatient?.name ? currentPatient.name.charAt(0) : 'B'}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight break-words min-w-0">
                {currentPatient?.name || 'Bhaben Barua'}
              </h2>
              <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                {currentPatient?.diagnosisStage || 'Early Stage Dementia'}
              </span>
              <span className="text-xs font-bold bg-brahma-50 text-brahma-900 px-2.5 py-0.5 rounded-full border border-brahma-200">Demo data</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-2 flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> {currentPatient?.age || 74} Yrs / {currentPatient?.gender || 'Male'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {currentPatient?.villageOrDistrict || 'Jorhat'}, {currentPatient?.state || 'Assam'}
              </span>
              <span className="flex items-start gap-1 text-rose-700 font-semibold break-words min-w-0">
                <Phone className="w-3.5 h-3.5" /> Caregiver: {currentPatient?.emergencyContactName || 'Anuradha'} ({currentPatient?.emergencyContactPhone || '+91 94350 12890'})
              </span>
            </p>
          </div>
        </div>

        {/* Download Neurologist PDF Report Button */}
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf}
          className="tactile-btn w-full md:w-auto shrink-0 flex items-center justify-center space-x-2 bg-tea-700 hover:bg-tea-800 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-md border-2 border-tea-600"
        >
          <FileDown className={`w-5 h-5 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
          <span>{isGeneratingPdf ? 'Compiling PDF...' : 'Download Clinical PDF Report'}</span>
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-brahma-200 bg-brahma-50 px-4 py-3 text-sm text-brahma-950 flex items-start gap-3" role="note">
        <HardDrive className="w-5 h-5 mt-0.5 shrink-0" />
        <p><strong>Local prototype privacy:</strong> this dashboard uses demo health data stored in this browser. It does not upload records to a cloud service or provide a medical diagnosis.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-stone-200 pb-3">
        {[
          { key: 'analytics', label: '📊 Cognitive Analytics & MoCA Trajectory', icon: Activity },
          { key: 'reminders', label: '💊 Daily Medicines & Routine Manager', icon: CalendarCheck },
          { key: 'photos', label: '📸 Family Photo Reminiscence Lane', icon: Heart },
          { key: 'asha', label: '🩺 ASHA Field Cognitive Registry', icon: Stethoscope },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => {
                audioManager.playTap();
                setActiveTab(tab.key as CaregiverTab);
              }}
              className={`tactile-btn flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? 'bg-brahma-600 text-white shadow-md'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      {activeTab === 'analytics' && <CognitiveCharts sessions={sessions} />}
      {activeTab === 'reminders' && <ReminderManager />}
      {activeTab === 'photos' && <ReminiscenceManager />}
      {activeTab === 'asha' && <AshaScreeningView />}
    </div>
  );
};
