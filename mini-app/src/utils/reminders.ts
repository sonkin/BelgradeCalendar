export type ReminderOffset = '1m' | '1h' | '1d' | '2d' | '3d' | '7d' | '14d' | '30d';

export const REMINDER_OFFSET_OPTIONS: { value: ReminderOffset; label: string }[] = [
  { value: '1m', label: 'За 1 минуту' },
  { value: '1h', label: 'За 1 час' },
  { value: '1d', label: 'За сутки' },
  { value: '2d', label: 'За 2 суток' },
  { value: '3d', label: 'За 3 суток' },
  { value: '7d', label: 'За неделю' },
  { value: '14d', label: 'За 2 недели' },
  { value: '30d', label: 'За месяц' },
];

const LABELS = Object.fromEntries(
  REMINDER_OFFSET_OPTIONS.map((o) => [o.value, o.label]),
) as Record<ReminderOffset, string>;

export function reminderOffsetLabel(offset: ReminderOffset): string {
  return LABELS[offset];
}

export function formatRemindersList(reminders: ReminderOffset[]): string {
  if (reminders.length === 0) return 'Без напоминаний в группу';
  return reminders.map(reminderOffsetLabel).join(', ');
}

export type ReminderSlot = ReminderOffset | '';

export function slotsFromReminders(reminders: ReminderOffset[]): [ReminderSlot, ReminderSlot] {
  return [reminders[0] ?? '', reminders[1] ?? ''];
}

export function remindersFromSlots(slots: [ReminderSlot, ReminderSlot]): ReminderOffset[] {
  const result: ReminderOffset[] = [];
  for (const slot of slots) {
    if (slot && !result.includes(slot)) {
      result.push(slot);
    }
  }
  return result;
}
