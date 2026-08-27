import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { audioManager } from '../../services/audioManager';
import { Plus, Trash2, Clock, Pill } from 'lucide-react';
import type { ReminderItem } from '../../types';
import { getLocalDateKey } from '../../services/localDate';

export const ReminderManager: React.FC = () => {
  const reminders = useLiveQuery(() => db.reminders.toArray()) || [];
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'medicine' | 'hydration' | 'routine' | 'prayer' | 'appointment'>('medicine');
  const [time, setTime] = useState('08:00');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [repeat, setRepeat] = useState<'daily' | 'once'>('daily');
  const [scheduledDate, setScheduledDate] = useState(getLocalDateKey());
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    audioManager.playSuccess();
    const newReminder: Omit<ReminderItem, 'id'> = {
      patientId: 'pat-ner-001',
      title: title.trim(),
      category,
      time,
      dosage: dosage.trim() || undefined,
      notes: notes.trim() || undefined,
      completedDates: [],
      iconName: category === 'medicine' ? 'Pill' : category === 'hydration' ? 'Droplets' : 'Bell',
      repeat,
      scheduledDate: repeat === 'once' ? scheduledDate : undefined,
      alertsEnabled,
      synced: false,
    };

    await db.reminders.add(newReminder as ReminderItem);
    setTitle('');
    setDosage('');
    setNotes('');
    setShowAddForm(false);
  };

  const handleDeleteReminder = async (id?: number) => {
    if (!id) return;
    audioManager.playTap();
    await db.reminders.delete(id);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm animate-fade-in">
      <div className="mb-6 flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-black text-stone-900">
            Medication & Routine Schedule
          </h3>
          <p className="text-xs text-stone-500">
            Due alerts appear while this app is open; closed-app alarms are not claimed.
          </p>
        </div>

        <button
          onClick={() => {
            audioManager.playTap();
            setShowAddForm(!showAddForm);
          }}
          className="tactile-btn flex items-center space-x-2 bg-tea-600 hover:bg-tea-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Cancel' : 'Add New Reminder'}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddReminder} className="bg-stone-50 p-5 rounded-2xl border border-stone-200 mb-6 space-y-4 animate-fade-in">
          <h4 className="font-bold text-sm text-stone-800">Add Routine / Medicine</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">Title / Activity</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Donepezil 5mg or Morning Walk"
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-tea-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-tea-600"
              >
                <option value="medicine">💊 Medicine</option>
                <option value="routine">🌅 Daily Routine</option>
                <option value="hydration">💧 Hydration</option>
                <option value="prayer">🪔 Prayer / Namghar</option>
                <option value="appointment">🏥 Doctor Appointment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">Scheduled Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-tea-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">Dosage / Details (Optional)</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 1 Tablet after breakfast"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-tea-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-stone-600">Repeats</label>
              <select value={repeat} onChange={(event) => setRepeat(event.target.value as 'daily' | 'once')} className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-tea-600 focus:outline-none"><option value="daily">Every day</option><option value="once">One time</option></select>
            </div>

            {repeat === 'once' && <div><label className="mb-1 block text-xs font-bold text-stone-600">Scheduled date</label><input type="date" value={scheduledDate} min={getLocalDateKey()} onChange={(event) => setScheduledDate(event.target.value)} required className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-tea-600 focus:outline-none" /></div>}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">Notes / Instructions</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Take with warm water"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-tea-600"
            />
          </div>

          <label className="flex min-h-[48px] items-center gap-3 rounded-xl border border-stone-300 bg-white px-3 text-sm font-bold text-stone-800"><input type="checkbox" checked={alertsEnabled} onChange={(event) => setAlertsEnabled(event.target.checked)} className="h-5 w-5 accent-tea-700" />Show an in-app due alert and optional sound</label>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tactile-btn px-5 py-2 rounded-xl bg-tea-600 hover:bg-tea-700 text-white text-xs font-bold shadow"
            >
              Save Schedule
            </button>
          </div>
        </form>
      )}

      {/* Reminders List */}
      <div className="divide-y divide-stone-100">
        {reminders.map((r) => (
          <div key={r.id} className="py-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-stone-100 text-stone-700">
                {r.category === 'medicine' ? <Pill className="w-5 h-5 text-rose-600" /> : <Clock className="w-5 h-5 text-tea-700" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-tea-800 bg-tea-50 px-2 py-0.5 rounded">
                    {/^\d{2}:\d{2}$/.test(r.time)
                      ? new Date(2000, 0, 1, ...r.time.split(':').map(Number) as [number, number]).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
                      : r.time}
                  </span>
                  <span className="text-xs font-semibold text-stone-400 capitalize">
                    {r.category}
                  </span>
                </div>
                <h4 className="font-bold text-stone-900 text-sm mt-0.5">{r.title}</h4>
                {r.notes && <p className="text-xs text-stone-500">{r.notes}</p>}
              </div>
            </div>

            <button
              onClick={() => handleDeleteReminder(r.id)}
              className="p-2 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50"
              title="Delete Reminder"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
