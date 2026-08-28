import React from 'react';
import { Leaf } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthPage } from './components/auth/AuthPage';
import { Navbar } from './components/layout/Navbar';

const PatientHome = React.lazy(() => import('./components/patient/PatientHome').then((module) => ({ default: module.PatientHome })));
const CaregiverDashboard = React.lazy(() => import('./components/caregiver/CaregiverDashboard').then((module) => ({ default: module.CaregiverDashboard })));

const MainContent: React.FC = () => {
  const { authStatus, user, isGameActive } = useApp();
  if (authStatus === 'checking') return <div className="flex min-h-[100dvh] items-center justify-center bg-tea-950 text-white"><div className="text-center"><Leaf className="mx-auto h-12 w-12 animate-pulse text-assamGold-400" /><p className="mt-4 text-xl font-black">Opening SmritiNER…</p></div></div>;
  if (authStatus === 'unauthenticated' || !user) return <AuthPage />;
  return <div className="flex min-h-[100dvh] min-w-0 flex-col">
    {!isGameActive && <Navbar />}
    <main className="min-w-0 flex-1"><React.Suspense fallback={<div className="p-10 text-center text-lg font-black text-tea-800">Opening your workspace…</div>}>{user.role === 'patient' ? <PatientHome /> : <CaregiverDashboard />}</React.Suspense></main>
    {!isGameActive && <footer className="hidden border-t border-stone-200 px-4 py-4 text-center text-sm text-stone-500 sm:block">SmritiNER · Cognitive engagement and caregiver support · Not a medical diagnosis</footer>}
  </div>;
};

export default function App() { return <AppProvider><MainContent /></AppProvider>; }
