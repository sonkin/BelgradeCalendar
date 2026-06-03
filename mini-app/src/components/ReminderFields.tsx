import {
  REMINDER_OFFSET_OPTIONS,
  remindersFromSlots,
  slotsFromReminders,
  type ReminderOffset,
  type ReminderSlot,
} from '../utils/reminders';

type Props = {
  value: ReminderOffset[];
  onChange: (value: ReminderOffset[]) => void;
};

export function ReminderFields({ value, onChange }: Props) {
  const [first, second] = slotsFromReminders(value);

  const updateSlot = (index: 0 | 1, slot: ReminderSlot) => {
    const slots: [ReminderSlot, ReminderSlot] = index === 0 ? [slot, second] : [first, slot];
    onChange(remindersFromSlots(slots));
  };

  const used = new Set(value);

  const optionsFor = (current: ReminderSlot) =>
    REMINDER_OFFSET_OPTIONS.filter((o) => o.value === current || !used.has(o.value));

  return (
    <fieldset className="reminder-fields">
      <legend className="reminder-fields__legend">Напоминания в группу (до 2)</legend>
      <p className="reminder-fields__hint muted">
        Бот отправит сообщение в общий чат Telegram в выбранное время до события.
      </p>
      <label className="field">
        <span>Напоминание 1</span>
        <select
          value={first}
          onChange={(e) => updateSlot(0, e.target.value as ReminderSlot)}
        >
          <option value="">Не напоминать</option>
          {optionsFor(first).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Напоминание 2</span>
        <select
          value={second}
          onChange={(e) => updateSlot(1, e.target.value as ReminderSlot)}
        >
          <option value="">Не напоминать</option>
          {optionsFor(second).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}
