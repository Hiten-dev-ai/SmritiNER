const INDIA_TIME_ZONE = 'Asia/Kolkata';

const dateParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${value('year')}-${value('month')}-${value('day')}`;
};

export const getLocalDateKey = (date = new Date()) => dateParts(date);

export const getIndiaMinutesNow = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: INDIA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hours = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minutes = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  return hours * 60 + minutes;
};

export const timeToMinutes = (time: string) => {
  const value = time.trim();
  const twelveHour = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHour) {
    let hours = Number(twelveHour[1]) % 12;
    if (twelveHour[3].toUpperCase() === 'PM') hours += 12;
    return hours * 60 + Number(twelveHour[2]);
  }
  const twentyFourHour = value.match(/^(\d{1,2}):(\d{2})$/);
  return twentyFourHour ? Number(twentyFourHour[1]) * 60 + Number(twentyFourHour[2]) : 24 * 60;
};

export const isReminderScheduledForDate = (
  reminder: { repeat?: 'daily' | 'once'; scheduledDate?: string },
  dateKey: string
) => (reminder.repeat ?? 'daily') === 'daily' || reminder.scheduledDate === dateKey;

