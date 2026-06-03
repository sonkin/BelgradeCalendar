import { useId, useState, type ReactNode } from 'react';
import { normalizeBelgradeTimeInput } from '../utils/dates';
import { CalendarPopover } from './CalendarPopover';
import { TimePopover } from './TimePopover';

type Props = {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  icon: ReactNode;
  iconLabel: string;
  onIconClick?: () => void;
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
        className="picker-field__input picker-field__input--picker"
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
  const [open, setOpen] = useState(false);
  const hasTime = Boolean(value.trim());

  return (
    <PickerFieldShell
      label={label}
      hint="Необязательно — введите чч:мм или выберите по иконке"
      icon={<ClockIcon />}
      iconLabel="Выбрать время"
      onIconClick={() => setOpen((v) => !v)}
      popover={
        open ? (
          <TimePopover value={value} onChange={onChange} onClose={() => setOpen(false)} />
        ) : null
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
        inputMode="numeric"
        autoComplete="off"
        className="picker-field__input picker-field__input--time picker-field__input--editable"
        placeholder="чч:мм"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(normalizeBelgradeTimeInput(e.target.value))}
      />
    </PickerFieldShell>
  );
}
