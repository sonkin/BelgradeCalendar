import type { BelgradeDatetimeParts } from '../utils/dates';

type Props = {
  value: BelgradeDatetimeParts;
  onChange: (value: BelgradeDatetimeParts) => void;
};

export function DatetimeField({ value, onChange }: Props) {
  return (
    <>
      <label className="field">
        <span>Дата *</span>
        <input
          type="text"
          required
          inputMode="numeric"
          autoComplete="off"
          placeholder="дд.мм.гггг"
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
        />
      </label>
      <label className="field">
        <span>Время</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="не указано"
          aria-label="Время (необязательно)"
          value={value.time}
          onChange={(e) => onChange({ ...value, time: e.target.value })}
        />
      </label>
    </>
  );
}
