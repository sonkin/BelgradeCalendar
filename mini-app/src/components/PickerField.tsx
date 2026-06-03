import { useId, useRef, type ReactNode } from 'react';
import {
  belgradeDateToNativeInputValue,
  nativeInputValueToBelgradeDate,
} from '../utils/dates';

type Props = {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  icon: ReactNode;
  iconLabel: string;
  onIconClick: () => void;
  trailing?: ReactNode;
};

export function PickerField({
  label,
  required,
  hint,
  children,
  icon,
  iconLabel,
  onIconClick,
  trailing,
}: Props) {
  const hintId = useId();

  return (
    <label className="field picker-field">
      <span>
        {label}
        {required ? ' *' : ''}
      </span>
      {hint ? (
        <span id={hintId} className="picker-field__hint muted">
          {hint}
        </span>
      ) : null}
      <div className="picker-field__control">
        {children}
        {trailing}
        <button
          type="button"
          className="picker-field__icon"
          aria-label={iconLabel}
          onClick={onIconClick}
        >
          {icon}
        </button>
      </div>
    </label>
  );
}

export function usePickerInputRef() {
  return useRef<HTMLInputElement>(null);
}

export function openNativePicker(input: HTMLInputElement | null): void {
  if (!input) return;
  try {
    input.showPicker?.();
  } catch {
    input.focus();
    input.click();
  }
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

type DatePickerFieldProps = {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (belgradeDate: string) => void;
};

export function DatePickerField({
  label = 'Дата',
  required,
  value,
  onChange,
}: DatePickerFieldProps) {
  const inputRef = usePickerInputRef();
  const nativeValue = belgradeDateToNativeInputValue(value);

  return (
    <PickerField
      label={label}
      required={required}
      icon={<CalendarIcon />}
      iconLabel="Выбрать дату"
      onIconClick={() => openNativePicker(inputRef.current)}
    >
      <input
        ref={inputRef}
        type="date"
        className="picker-field__input"
        required={required}
        value={nativeValue}
        onChange={(e) => onChange(nativeInputValueToBelgradeDate(e.target.value))}
      />
    </PickerField>
  );
}

type TimePickerFieldProps = {
  label?: string;
  value: string;
  onChange: (time: string) => void;
};

export function TimePickerField({ label = 'Время', value, onChange }: TimePickerFieldProps) {
  const inputRef = usePickerInputRef();
  const hasTime = Boolean(value.trim());

  return (
    <PickerField
      label={label}
      hint="Необязательно — оставьте пустым, если время уточняется позже"
      icon={<ClockIcon />}
      iconLabel="Выбрать время"
      onIconClick={() => openNativePicker(inputRef.current)}
      trailing={
        hasTime ? (
          <button
            type="button"
            className="picker-field__clear"
            aria-label="Очистить время"
            onClick={() => onChange('')}
          >
            <ClearIcon />
          </button>
        ) : null
      }
    >
      <input
        ref={inputRef}
        type="time"
        className={`picker-field__input picker-field__input--time${hasTime ? '' : ' picker-field__input--empty'}`}
        value={hasTime ? value : ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </PickerField>
  );
}
