import type { BelgradeDatetimeParts } from '../utils/dates';
import { DatePickerField, TimePickerField } from './PickerField';

type Props = {
  value: BelgradeDatetimeParts;
  onChange: (value: BelgradeDatetimeParts) => void;
};

export function DatetimeField({ value, onChange }: Props) {
  return (
    <>
      <DatePickerField
        value={value.date}
        onChange={(date) => onChange({ ...value, date })}
      />
      <TimePickerField
        value={value.time}
        onChange={(time) => onChange({ ...value, time })}
      />
    </>
  );
}
