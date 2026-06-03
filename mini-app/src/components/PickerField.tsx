import { useId, useRef, useState, type ReactNode } from 'react';
import { CalendarPopover } from './CalendarPopover';

type Props = {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  icon: ReactNode;
  iconLabel: string;
  onIconClick?: () => void;
  iconSlot?: ReactNode;
  trailing?: ReactNode;
  popover?: ReactNode;
};

function PickerFieldShell({
  label,
  required,
  hint,
  children,
  icon,
  iconLabel,
  onIconClick,
  iconSlot,
  trailing,
  popover,
}: Props) {
  const hintId = useId();

  return (
    <div className="field picker-field">
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
        {iconSlot ?? (
          <button
            type="button"
            className="picker-field__icon"
            aria-label={iconLabel}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onIconClick?.();
            }}
          >
            {icon}
          </button>
        )}
        {popover}
      </div>
    </div>
  );
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

function openNativeTimePicker(input: HTMLInputElement | null): void {
  if (!input) return;
  try {
    input.showPicker?.();
  } catch {
    input.focus();
  }
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
  const [open, setOpen] = useState(false);

  return (
    <PickerFieldShell
      label={label}
      required={required}
      icon={<CalendarIcon />}
      iconLabel="Открыть календарь"
      onIconClick={() => setOpen((v) => !v)}
      popover={
        open ? (
          <CalendarPopover
            value={value}
            onChange={onChange}
            onClose={() => setOpen(false)}
          />
        ) : null
      }
    >
      <input
        type="text"
        readOnly
        required={required}
        className="picker-field__input"
        placeholder="дд.мм.гггг"
        value={value}
        onClick={() => setOpen(true)}
      />
    </PickerFieldShell>
  );
}

type TimePickerFieldProps = {
  label?: string;
  value: string;
  onChange: (time: string) => void;
};

export function TimePickerField({ label = 'Время', value, onChange }: TimePickerFieldProps) {
  const nativeRef = useRef<HTMLInputElement>(null);
  const hasTime = Boolean(value.trim());

  const openPicker = () => openNativeTimePicker(nativeRef.current);

  return (
    <PickerFieldShell
      label={label}
      hint="Необязательно — оставьте пустым, если время уточняется позже"
      icon={<ClockIcon />}
      iconLabel="Выбрать время"
      iconSlot={
        <div className="picker-field__icon-slot" aria-label="Выбрать время">
          <span className="picker-field__icon-visual" aria-hidden>
            <ClockIcon />
          </span>
          <input
            ref={nativeRef}
            type="time"
            className="picker-field__native-overlay"
            aria-label="Выбрать время"
            value={hasTime ? value : '12:00'}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      }
      trailing={
        hasTime ? (
          <button
            type="button"
            className="picker-field__clear"
            aria-label="Очистить время"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
          >
            <ClearIcon />
          </button>
        ) : null
      }
    >
      <input
        type="text"
        readOnly
        className={`picker-field__input picker-field__input--time${hasTime ? '' : ' picker-field__input--empty'}`}
        placeholder="не указано"
        value={hasTime ? value : ''}
        onClick={openPicker}
      />
    </PickerFieldShell>
  );
}
