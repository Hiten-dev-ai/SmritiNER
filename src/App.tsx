import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { PatientHome } from './components/patient/PatientHome';
import { CaregiverDashboard } from './components/caregiver/CaregiverDashboard';
import { AshaScreeningView } from './components/caregiver/AshaScreeningView';

const MainContent: React.FC = () => {
  const { mode, isGameActive } = useApp();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [mode]);

  return (
    <div className="min-h-screen min-w-0 flex flex-col justify-between">
      {!isGameActive && <Navbar />}

      <main className="flex-1 pb-10">
        {mode === 'patient' && <PatientHome />}
        {mode === 'caregiver' && <CaregiverDashboard />}
        {mode === 'asha' && (
          <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-fade-in">
            <AshaScreeningView />
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className={`${isGameActive ? 'hidden' : 'hidden sm:block'} py-4 px-4 border-t border-stone-200/60 text-center text-xs text-stone-500`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-bold text-stone-700">SmritiNER (স্মৃতিNER)</span>
          <span className="text-[11px] text-stone-400">North Eastern Regional Cognitive Care Platform</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
