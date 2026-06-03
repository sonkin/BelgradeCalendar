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

export function getDateDisplay(iso: string): DateDisplay {
  return {
    weekdayDate: formatWeekdayDate(iso),
    relative: formatRelativeUntil(iso),
    time: formatEventTime(iso),
  };
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

export function localDatetimeToIso(localValue: string): string {
  return new Date(localValue).toISOString();
}

export function isoToLocalDatetime(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function defaultDatetimeLocal(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 60 - (now.getMinutes() % 30));
  now.setSeconds(0, 0);

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours} ч ${mins} мин`;
  if (hours) return `${hours} ч`;
  return `${mins} мин`;
}

