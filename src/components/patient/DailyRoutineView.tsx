import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Bell, CalendarDays, CheckCircle2, Clock, Droplets, Footprints, Pill } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import { db } from '../../services/db';
import type { ReminderItem } from '../../types';
import { getLocalDateKey, isReminderScheduledForDate } from '../../services/localDate';

interface DailyRoutineViewProps { onBack?: () => void }
type RoutineFilter = 'all' | 'medicine' | 'routine';

export const DailyRoutineView: React.FC<DailyRoutineViewProps> = ({ onBack }) => {
  const { selectedLanguage, t } = useApp();
  const todayStr = getLocalDateKey();
  const reminders = (useLiveQuery(() => db.reminders.toArray()) || []).filter((reminder) => isReminderScheduledForDate(reminder, todayStr));
  const [filter, setFilter] = useState<RoutineFilter>('all');
  const locale = selectedLanguage === 'Hindi' ? 'hi-IN' : selectedLanguage === 'Assamese' ? 'as-IN' : 'en-IN';

  const iconFor = (category: ReminderItem['category']) => {
    if (category === 'medicine') return <Pill className="w-6 h-6 text-rose-600" />;
    if (category === 'hydration') return <Droplets className="w-6 h-6 text-sky-600" />;
    if (category === 'appointment') return <CalendarDays className="w-6 h-6 text-purple-700" />;
    if (category === 'prayer') return <Bell className="w-6 h-6 text-amber-600" />;
    return <Footprints className="w-6 h-6 text-tea-700" />;
  };

  const formatTime = (value: string) => {
    if (/^\d{2}:\d{2}$/.test(value)) {
      const [hours, minutes] = value.split(':').map(Number);
      return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
    }
    return value;
  };

  const toggleReminder = async (reminder: ReminderItem) => {
    if (!reminder.id) return;
    audioManager.playTap();
    const complete = reminder.completedDates.includes(todayStr);
    const completedDates = complete
      ? reminder.completedDates.filter((date) => date !== todayStr)
      : [...reminder.completedDates, todayStr];
    if (!complete) audioManager.playSuccess();
    await db.reminders.update(reminder.id, { completedDates, synced: false });
  };

  const filteredReminders = reminders.filter((reminder) => {
    if (filter === 'medicine') return reminder.category === 'medicine';
    if (filter === 'routine') return reminder.category !== 'medicine';
    return true;
  });
  const completedCount = reminders.filter((reminder) => reminder.completedDates.includes(todayStr)).length;
  const filters: Array<{ key: RoutineFilter; label: string }> = [
    { key: 'all', label: t.allActivities },
    { key: 'medicine', label: t.medicinesOnly },
    { key: 'routine', label: t.routinesOnly },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-fade-in space-y-6 min-w-0">
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-5 shadow-sm border border-stone-200">
        {onBack && (
          <button onClick={() => { audioManager.playTap(); onBack(); }} className="tactile-btn elder-touch flex items-center gap-2 text-stone-700 bg-stone-100 hover:bg-stone-200 px-4 rounded-xl text-sm font-bold self-start">
            <ArrowLeft className="w-5 h-5" /><span>{t.home}</span>
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-tea-950 leading-tight">{t.todaysRoutine}</h1>
          <p className="mt-1 text-base font-semibold text-stone-500">{new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="bg-tea-50 border border-tea-300 px-4 py-2 rounded-2xl text-center self-start sm:self-auto shrink-0">
          <span className="block text-sm font-bold text-tea-800">{t.today}</span>
          <span className="text-lg font-black text-tea-900">{completedCount} / {reminders.length} {t.done}</span>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Routine filters">
        {filters.map((item) => (
          <button key={item.key} onClick={() => { audioManager.playTap(); setFilter(item.key); }} className={`tactile-btn min-h-14 min-w-0 px-2 sm:px-4 py-2 rounded-xl text-base font-bold leading-tight ${filter === item.key ? 'bg-tea-700 text-white shadow-sm' : 'bg-white text-stone-700 border border-stone-300'}`} aria-pressed={filter === item.key}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {filteredReminders.map((reminder) => {
          const complete = reminder.completedDates.includes(todayStr);
          return (
            <button key={reminder.id} type="button" onClick={() => toggleReminder(reminder)} className={`tactile-btn w-full text-left rounded-3xl p-4 sm:p-6 border-2 flex items-center justify-between gap-3 ${complete ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-stone-200 shadow-sm'}`} aria-pressed={complete}>
              <span className="flex items-center gap-3 sm:gap-4 min-w-0">
                <span className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border-2 ${complete ? 'bg-emerald-100 border-emerald-300' : 'bg-stone-100 border-stone-200'}`}>{iconFor(reminder.category)}</span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 rounded-full bg-tea-100 px-2.5 py-1 text-base font-black text-tea-800"><Clock className="h-4 w-4" /> {formatTime(reminder.time)}</span>
                    {reminder.dosage && <span className="rounded-full bg-rose-50 px-2 py-1 text-base font-bold text-rose-700">{reminder.dosage}</span>}
                  </span>
                  <span className={`block text-lg sm:text-xl font-black mt-1 break-words ${complete ? 'line-through text-stone-500' : 'text-stone-900'}`}>{reminder.title}</span>
                  {reminder.notes && <span className="mt-1 block break-words text-base text-stone-700">{reminder.notes}</span>}
                </span>
              </span>
              <span className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center border-2 ${complete ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-white border-stone-300 text-transparent'}`}><CheckCircle2 className="w-6 h-6" /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
