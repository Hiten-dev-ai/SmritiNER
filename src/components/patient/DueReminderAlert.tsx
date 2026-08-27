import React, { useEffect } from 'react';
import { BellRing, CheckCircle2, Clock3, ListChecks, Volume2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { audioManager } from '../../services/audioManager';
import { db } from '../../services/db';
import { getLocalDateKey } from '../../services/localDate';
import type { ReminderItem } from '../../types';

interface DueReminderAlertProps {
  reminder: ReminderItem;
  onOpenRoutine: () => void;
}

export const DueReminderAlert: React.FC<DueReminderAlertProps> = ({ reminder, onOpenRoutine }) => {
  const { reminderSoundEnabled, readAloud, speechSupported, t } = useApp();
  const today = getLocalDateKey();

  useEffect(() => {
    if (!reminder.id || reminder.lastAlertedDate === today) return;
    if (reminderSoundEnabled) audioManager.playTryAgain();
    void db.reminders.update(reminder.id, { lastAlertedDate: today });
  }, [reminder.id, reminder.lastAlertedDate, reminderSoundEnabled, today]);

  const markDone = async () => {
    if (!reminder.id) return;
    audioManager.playSuccess();
    const completedDates = reminder.completedDates.includes(today) ? reminder.completedDates : [...reminder.completedDates, today];
    await db.reminders.update(reminder.id, { completedDates, snoozedUntil: undefined, synced: false });
  };

  const snooze = async () => {
    if (!reminder.id) return;
    audioManager.playTap();
    await db.reminders.update(reminder.id, { snoozedUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(), synced: false });
  };

  return (
    <section className="rounded-3xl border-2 border-amber-500 bg-amber-50 p-5 shadow-sm" role="alert" aria-labelledby="due-reminder-title">
      <div className="flex items-start gap-3">
        <span className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-stone-950"><BellRing className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1"><p className="text-base font-black text-amber-900">{t.reminderAlert} · {t.dueNow}</p><h2 id="due-reminder-title" className="mt-1 break-words text-xl font-black text-stone-950">{reminder.title}</h2><p className="mt-1 text-base font-semibold text-stone-700">{reminder.time}{reminder.dosage ? ` · ${reminder.dosage}` : ''}</p></div>
        {speechSupported && <button onClick={() => readAloud(`${t.reminderAlert}. ${reminder.title}. ${reminder.time}. ${reminder.notes ?? ''}`)} className="tactile-btn flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl border border-amber-400 bg-white text-amber-900" aria-label={t.listen}><Volume2 className="h-6 w-6" /></button>}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button onClick={() => { void markDone(); }} className="tactile-btn flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-tea-700 px-4 text-base font-black text-white"><CheckCircle2 className="h-5 w-5" />{t.markDone}</button>
        <button onClick={() => { void snooze(); }} className="tactile-btn flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-amber-400 bg-white px-4 text-base font-black text-amber-950"><Clock3 className="h-5 w-5" />{t.snooze}</button>
        <button onClick={onOpenRoutine} className="tactile-btn flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-stone-100 px-4 text-base font-black text-stone-900"><ListChecks className="h-5 w-5" />{t.openRoutine}</button>
      </div>
    </section>
  );
};
