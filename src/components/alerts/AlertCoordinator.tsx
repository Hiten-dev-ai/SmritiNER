// Application-Level Patient Alert Coordinator
// Evaluates reminder schedules, plays gentle chimes, and handles due reminder actions.

import React, { useEffect, useRef, useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  Clock3,
  ListChecks,
  Volume2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { audioManager } from '../../services/audioManager';
import { db } from '../../services/db';
import { getLocalDateKey } from '../../services/localDate';
import type { ReminderItem } from '../../types';

interface AlertCoordinatorProps {
  onOpenRoutine?: () => void;
}

export const AlertCoordinator: React.FC<AlertCoordinatorProps> = ({ onOpenRoutine }) => {
  const { currentPatient, readAloud, t } = useApp();
  const [dueReminder, setDueReminder] = useState<ReminderItem | null>(null);
  const alertedOccurrencesRef = useRef<Set<string>>(new Set());
  const isCheckingRef = useRef<boolean>(false);

  // Time conversion helper: "08:00 AM" -> minutes from midnight
  const parseTimeToMinutes = (timeStr: string): number => {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return -1;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const evaluateReminders = async () => {
    if (!currentPatient || isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      const today = getLocalDateKey();
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // 1. Fetch patient reminders (server or local DB)
      let reminders: ReminderItem[] = [];
      try {
        const res = await api.listCollection<ReminderItem>(currentPatient.id, 'reminders');
        reminders = res.items || [];
      } catch {
        reminders = await db.reminders.where({ patientId: currentPatient.id }).toArray();
      }

      // 2. Find any active due reminder
      for (const reminder of reminders) {
        if (reminder.alertsEnabled === false) continue;

        // Check if already completed today
        const completedDates = Array.isArray(reminder.completedDates) ? reminder.completedDates : [];
        if (completedDates.includes(today)) continue;

        // Check if currently snoozed
        if (reminder.snoozedUntil && Date.now() < new Date(reminder.snoozedUntil).getTime()) {
          continue;
        }

        // Check time matching
        const reminderMinutes = parseTimeToMinutes(reminder.time);
        if (reminderMinutes === -1) continue;

        // Trigger if current time is at or past scheduled time (within 120 min window)
        const diff = currentMinutes - reminderMinutes;
        if (diff >= 0 && diff <= 120) {
          const occurrenceKey = `${reminder.id}_${today}_${reminder.time}`;

          // Only chime and surface if not already alerted this exact occurrence
          if (!alertedOccurrencesRef.current.has(occurrenceKey)) {
            alertedOccurrencesRef.current.add(occurrenceKey);
            setDueReminder(reminder);
            audioManager.play('reminder');
          } else if (!dueReminder) {
            setDueReminder(reminder);
          }
          break; // Show one due alert at a time
        }
      }
    } catch {
      // Evaluation fallback
    } finally {
      isCheckingRef.current = false;
    }
  };

  // Mount evaluation, interval timer (every 60s), visibility change, and online reconnect
  useEffect(() => {
    if (!currentPatient) return;

    void evaluateReminders();

    const interval = setInterval(() => {
      void evaluateReminders();
    }, 60000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void evaluateReminders();
      }
    };

    const onOnline = () => {
      void evaluateReminders();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
    };
  }, [currentPatient]);

  if (!dueReminder || !currentPatient) return null;

  const today = getLocalDateKey();

  const handleMarkDone = async () => {
    const reminderId = dueReminder.id;
    if (!reminderId) return;

    audioManager.play('pair-match');
    setDueReminder(null);

    try {
      await api.completeReminder(currentPatient.id, reminderId, today);
    } catch {
      // Offline fallback: update local IndexedDB
      const completedDates = Array.isArray(dueReminder.completedDates)
        ? dueReminder.completedDates
        : [];
      if (!completedDates.includes(today)) {
        completedDates.push(today);
      }
      if (typeof reminderId === 'number') {
        await db.reminders.update(reminderId, { completedDates, snoozedUntil: undefined, synced: false });
      }
    }
  };

  const handleSnooze = async () => {
    const reminderId = dueReminder.id;
    if (!reminderId) return;

    audioManager.play('tap');
    setDueReminder(null);

    try {
      await api.snoozeReminder(currentPatient.id, reminderId, 10);
    } catch {
      const snoozedUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      if (typeof reminderId === 'number') {
        await db.reminders.update(reminderId, { snoozedUntil, synced: false });
      }
    }
  };

  const handleListen = () => {
    const text = `${t.reminderAlert}. ${dueReminder.title}. ${dueReminder.time}. ${
      dueReminder.dosage ? dueReminder.dosage + '.' : ''
    } ${dueReminder.notes || ''}`;
    readAloud(text);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[min(94vw,540px)] animate-fadeIn">
      <div
        className="rounded-3xl border-2 border-amber-400 bg-amber-50/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md text-stone-900"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-stone-950 shadow-md">
              <BellRing className="h-6 w-6 animate-bounce" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-black text-amber-900 uppercase tracking-wider">
                {t.reminderAlert} · {t.dueNow}
              </p>
              <h3 className="mt-0.5 text-base sm:text-lg font-black text-stone-950 truncate">
                {dueReminder.title}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-stone-700">
                {dueReminder.time} {dueReminder.dosage ? `· ${dueReminder.dosage}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleListen}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-300 bg-white text-amber-900 hover:bg-amber-100 transition shadow-sm"
              aria-label={t.listen}
            >
              <Volume2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setDueReminder(null)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-300 bg-white text-stone-600 hover:bg-amber-100 transition"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          <button
            onClick={() => void handleMarkDone()}
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-teal-800 px-3 text-xs sm:text-sm font-black text-white shadow-md hover:bg-teal-900 transition"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{t.markDone}</span>
          </button>
          <button
            onClick={() => void handleSnooze()}
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border border-amber-400 bg-white px-3 text-xs sm:text-sm font-black text-amber-950 hover:bg-amber-100 transition"
          >
            <Clock3 className="h-4 w-4" />
            <span>{t.snooze}</span>
          </button>
          <button
            onClick={() => {
              setDueReminder(null);
              onOpenRoutine?.();
            }}
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border border-stone-300 bg-stone-100 px-3 text-xs sm:text-sm font-black text-stone-900 hover:bg-stone-200 transition"
          >
            <ListChecks className="h-4 w-4" />
            <span>{t.openRoutine}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
