import { config } from '../config.js';

const TIMEZONE = config.timezone;
export const DEFAULT_DURATION_MINUTES = 120;

function belgradeWallTimeParts(d: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? '0');

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

function belgradeLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const rough = Date.UTC(year, month - 1, day, hour - 2, minute);
  for (let offsetMs = -6 * 3600000; offsetMs <= 6 * 3600000; offsetMs += 60000) {
    const candidate = new Date(rough + offsetMs);
    const w = belgradeWallTimeParts(candidate);
    if (w.year === year && w.month === month && w.day === day && w.hour === hour && w.minute === minute) {
      return candidate;
    }
  }
  throw new Error('Не удалось преобразовать дату в часовой пояс Белграда');
}

/** Полночь указанного календарного дня в Europe/Belgrade */
export function belgradeMidnightOnSameDay(d: Date): Date {
  const w = belgradeWallTimeParts(d);
  return belgradeLocalToUtc(w.year, w.month, w.day, 0, 0);
}

/** Начало следующего календарного дня в Europe/Belgrade (конец all-day, exclusive) */
export function belgradeStartOfNextDay(d: Date): Date {
  const w = belgradeWallTimeParts(d);
  return belgradeLocalToUtc(w.year, w.month, w.day + 1, 0, 0);
}

type EventTimingFields = {
  startsAt: Date;
  timeUnset?: boolean | null;
  durationMinutes?: number | null;
};

export function eventEndTime(event: EventTimingFields): Date {
  if (event.timeUnset) {
    return belgradeStartOfNextDay(event.startsAt);
  }
  const durationMinutes = event.durationMinutes ?? DEFAULT_DURATION_MINUTES;
  return new Date(event.startsAt.getTime() + durationMinutes * 60 * 1000);
}

export function isUpcomingEvent(event: EventTimingFields, now = new Date()): boolean {
  return eventEndTime(event) > now;
}
