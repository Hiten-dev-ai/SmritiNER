import { describe, expect, it } from 'vitest';
import { getIndiaMinutesNow, getLocalDateKey, isReminderScheduledForDate, timeToMinutes } from './localDate';

describe('India-local reminder dates', () => {
  it('uses the next Indian calendar date before UTC midnight', () => {
    const instant = new Date('2026-08-27T20:15:00.000Z');
    expect(getLocalDateKey(instant)).toBe('2026-08-28');
    expect(getIndiaMinutesNow(instant)).toBe(105);
  });

  it('parses both stored time formats', () => {
    expect(timeToMinutes('08:30 AM')).toBe(510);
    expect(timeToMinutes('20:30')).toBe(1230);
    expect(timeToMinutes('12:00 AM')).toBe(0);
  });

  it('distinguishes daily and one-time reminders', () => {
    expect(isReminderScheduledForDate({ repeat: 'daily' }, '2026-08-28')).toBe(true);
    expect(isReminderScheduledForDate({ repeat: 'once', scheduledDate: '2026-08-28' }, '2026-08-28')).toBe(true);
    expect(isReminderScheduledForDate({ repeat: 'once', scheduledDate: '2026-08-27' }, '2026-08-28')).toBe(false);
  });
});
