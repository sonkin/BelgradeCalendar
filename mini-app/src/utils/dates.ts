const TIMEZONE = 'Europe/Belgrade';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  timeZone: TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', {
  timeZone: TIMEZONE,
  weekday: 'long',
});

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  timeZone: TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
});

export interface DateDisplay {
  weekdayDate: string;
  relative: string;
  time: string;
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function belgradeDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatEventDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatEventTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatWeekdayDate(iso: string): string {
  const weekday = weekdayFormatter.format(new Date(iso));
  const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalized}, ${formatEventDate(iso)}`;
}

export function daysUntil(iso: string): number {
  const eventKey = belgradeDateKey(new Date(iso));
  const todayKey = belgradeDateKey(new Date());
  const [ey, em, ed] = eventKey.split('-').map(Number);
  const [ty, tm, td] = todayKey.split('-').map(Number);
  const eventUtc = Date.UTC(ey, em - 1, ed);
  const todayUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((eventUtc - todayUtc) / 86400000);
}

export function formatRelativeUntil(iso: string): string {
  const days = daysUntil(iso);

  if (days <= 0) return 'сегодня';
  if (days === 1) return 'завтра';

  const weeks = Math.floor(days / 7);
  const remainder = days % 7;

  if (weeks === 0) {
    return `через ${days} ${plural(days, 'день', 'дня', 'дней')}`;
  }

  const parts = [`${weeks} ${plural(weeks, 'неделю', 'недели', 'недель')}`];
  if (remainder > 0) {
    parts.push(`${remainder} ${plural(remainder, 'день', 'дня', 'дней')}`);
  }

  return `через ${parts.join(' и ')}`;
}

export function getDateDisplay(iso: string, timeUnset = false): DateDisplay {
  return {
    weekdayDate: formatWeekdayDate(iso),
    relative: formatRelativeUntil(iso),
    time: timeUnset ? '' : formatEventTime(iso),
  };
}

export function formatEventTimeLabel(iso: string, timeUnset: boolean): string {
  return timeUnset ? 'время уточняется' : formatEventTime(iso);
}

/** Ключ дня для группировки: YYYY-MM-DD (Belgrade), чтобы сортировка была хронологической */
export function dayKey(iso: string): string {
  return belgradeDateKey(new Date(iso));
}

/** @deprecated use getDateDisplay / formatWeekdayDate in UI */
export function dayLabel(iso: string): string {
  return formatWeekdayDate(iso);
}

export function sortEventsByStart<T extends { startsAt: string }>(events: T[]): T[] {
  return [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function eventMonthKey(iso: string): string {
  return dayKey(iso).slice(0, 7);
}

export function currentBelgradeMonthKey(): string {
  return dayKey(new Date().toISOString()).slice(0, 7);
}

/** Текущий месяц + 11 следующих (12 всего) */
export const LIST_MONTH_COUNT = 12;

export function belgradeMonthKeyByOffset(offset: number): string {
  const w = belgradeWallTimeParts(new Date());
  let month = w.month + offset;
  let year = w.year;
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function listSelectableMonthKeys(): string[] {
  return Array.from({ length: LIST_MONTH_COUNT }, (_, i) => belgradeMonthKeyByOffset(i));
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const label = new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIMEZONE,
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Краткий список: «суббота 3 июля, 19:00» */
export function formatCompactListSchedule(iso: string, timeUnset: boolean): string {
  const d = new Date(iso);
  const weekday = new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIMEZONE,
    weekday: 'long',
  })
    .format(d)
    .toLowerCase();
  const dayMonth = new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'long',
  }).format(d);

  if (timeUnset) {
    return `${weekday} ${dayMonth}, время уточняется`;
  }
  return `${weekday} ${dayMonth}, ${formatEventTime(iso)}`;
}

export function filterEventsByMonthKey<T extends { startsAt: string }>(
  events: T[],
  monthKey: string,
): T[] {
  return events.filter((event) => eventMonthKey(event.startsAt) === monthKey);
}

export function groupEventsByDay<T extends { startsAt: string }>(events: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const event of sortEventsByStart(events)) {
    const key = dayKey(event.startsAt);
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }

  return groups;
}

export interface BelgradeDatetimeParts {
  date: string;
  time: string;
}

const BELGRADE_DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;
const BELGRADE_TIME_RE = /^(\d{2}):(\d{2})$/;

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

export function isoToBelgradeParts(iso: string, timeUnset = false): BelgradeDatetimeParts {
  const w = belgradeWallTimeParts(new Date(iso));
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${pad(w.day)}.${pad(w.month)}.${w.year}`,
    time: timeUnset ? '' : `${pad(w.hour)}:${pad(w.minute)}`,
  };
}

function belgradeLocalToIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): string {
  const rough = Date.UTC(year, month - 1, day, hour - 2, minute);
  for (let offsetMs = -6 * 3600000; offsetMs <= 6 * 3600000; offsetMs += 60000) {
    const candidate = new Date(rough + offsetMs);
    const w = belgradeWallTimeParts(candidate);
    if (w.year === year && w.month === month && w.day === day && w.hour === hour && w.minute === minute) {
      return candidate.toISOString();
    }
  }
  throw new Error('Некорректная дата или время');
}

/** Конец календарного дня в Белграде (exclusive), для фильтра «предстоящие» */
export function belgradeEndOfDayIso(iso: string): string {
  const { date } = isoToBelgradeParts(iso, true);
  const match = BELGRADE_DATE_RE.exec(date);
  if (!match) {
    return new Date(new Date(iso).getTime() + 86400000).toISOString();
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  return belgradeLocalToIso(year, month, day + 1, 0, 0);
}

export function belgradeDateToIso(date: string): string {
  const dateMatch = BELGRADE_DATE_RE.exec(date.trim());
  if (!dateMatch) {
    throw new Error('Укажите дату в формате дд.мм.гггг');
  }
  const day = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error('Некорректная дата');
  }
  return belgradeLocalToIso(year, month, day, 0, 0);
}

export function belgradePartsToIso(parts: BelgradeDatetimeParts): string {
  const timeTrimmed = parts.time.trim();
  if (!timeTrimmed) {
    return belgradeDateToIso(parts.date);
  }

  const dateMatch = BELGRADE_DATE_RE.exec(parts.date.trim());
  const timeMatch = BELGRADE_TIME_RE.exec(timeTrimmed);
  if (!dateMatch || !timeMatch) {
    throw new Error('Укажите дату в формате дд.мм.гггг и время в формате чч:мм');
  }

  const day = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    throw new Error('Некорректная дата или время');
  }

  return belgradeLocalToIso(year, month, day, hour, minute);
}

export function belgradePartsToPayload(parts: BelgradeDatetimeParts): { startsAt: string; timeUnset: boolean } {
  const timeUnset = !parts.time.trim();
  return {
    startsAt: timeUnset ? belgradeDateToIso(parts.date) : belgradePartsToIso(parts),
    timeUnset,
  };
}

export function defaultBelgradeDatetimeParts(): BelgradeDatetimeParts {
  const p = isoToBelgradeParts(new Date().toISOString());
  return { date: p.date, time: '' };
}

/** Значение для `<input type="date">` (yyyy-mm-dd) */
export function belgradeDateToNativeInputValue(date: string): string {
  const match = BELGRADE_DATE_RE.exec(date.trim());
  if (!match) return '';
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

/** Из `<input type="date">` в дд.мм.гггг */
export function nativeInputValueToBelgradeDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return '';
  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}

export function belgradeTodayYmd(): { year: number; month: number; day: number } {
  const key = belgradeDateKey(new Date());
  const [year, month, day] = key.split('-').map(Number);
  return { year, month, day };
}

export function parseBelgradeTimeParts(value: string): { hour: number; minute: number } {
  const match = BELGRADE_TIME_RE.exec(value.trim());
  if (!match) {
    return { hour: 12, minute: 0 };
  }
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

/**
 * Маска при вводе с цифровой клавиатуры: «1830» → «18:30», двоеточие не нужно набирать.
 */
export function formatBelgradeTimeWhileTyping(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** Нормализация ввода времени в чч:мм при потере фокуса */
export function normalizeBelgradeTimeInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const match = /^(\d{1,2})(?::(\d{1,2}))?$/.exec(trimmed);
  if (!match) return '';

  const hour = Number(match[1]);
  const minute = match[2] !== undefined ? Number(match[2]) : 0;
  if (hour > 23 || minute > 59) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hour)}:${pad(minute)}`;
}

export function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours} ч ${mins} мин`;
  if (hours) return `${hours} ч`;
  return `${mins} мин`;
}

