export const REMINDER_OFFSETS = [
  '1m',
  '1d',
  '2d',
  '3d',
  '7d',
  '14d',
  '30d',
] as const;

export type ReminderOffset = (typeof REMINDER_OFFSETS)[number];

const OFFSET_MINUTES: Record<ReminderOffset, number> = {
  '1m': 1,
  '1d': 24 * 60,
  '2d': 2 * 24 * 60,
  '3d': 3 * 24 * 60,
  '7d': 7 * 24 * 60,
  '14d': 14 * 24 * 60,
  '30d': 30 * 24 * 60,
};

export const REMINDER_OFFSET_LABELS: Record<ReminderOffset, string> = {
  '1m': 'За 1 минуту',
  '1d': 'За сутки',
  '2d': 'За 2 суток',
  '3d': 'За 3 суток',
  '7d': 'За неделю',
  '14d': 'За 2 недели',
  '30d': 'За месяц',
};

export function isReminderOffset(value: string): value is ReminderOffset {
  return (REMINDER_OFFSETS as readonly string[]).includes(value);
}

export function offsetToMinutes(offset: ReminderOffset): number {
  return OFFSET_MINUTES[offset];
}

export function remindAtTime(startsAt: Date, offset: ReminderOffset): Date {
  return new Date(startsAt.getTime() - offsetToMinutes(offset) * 60_000);
}

export function reminderLeadPhrase(offset: ReminderOffset): string {
  return REMINDER_OFFSET_LABELS[offset].toLowerCase();
}

export function validateEventReminders(
  reminders: unknown,
  startsAt: Date,
  now = new Date(),
): ReminderOffset[] {
  if (reminders == null) {
    return [];
  }
  if (!Array.isArray(reminders)) {
    throw new Error('reminders должен быть массивом');
  }
  if (reminders.length > 2) {
    throw new Error('Можно указать не больше 2 напоминаний');
  }

  const seen = new Set<ReminderOffset>();
  const result: ReminderOffset[] = [];

  for (const item of reminders) {
    const offset = typeof item === 'string' ? item : null;
    if (!offset || !isReminderOffset(offset)) {
      throw new Error('Некорректный интервал напоминания');
    }
    if (seen.has(offset)) {
      throw new Error('Интервалы напоминаний не должны повторяться');
    }
    seen.add(offset);
    result.push(offset);

    if (remindAtTime(startsAt, offset) <= now) {
      throw new Error(`Напоминание «${REMINDER_OFFSET_LABELS[offset]}» уже в прошлом для этой даты`);
    }
  }

  return result;
}
