import { useEffect, useRef, useState } from 'react';
import { parseBelgradeTimeParts } from '../utils/dates';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

type Props = {
  value: string;
  onChange: (time: string) => void;
  onClose: () => void;
};

export function TimePopover({ value, onChange, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = parseBelgradeTimeParts(value);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);

  const apply = () => {
    const pad = (n: number) => String(n).padStart(2, '0');
    onChange(`${pad(hour)}:${pad(minute)}`);
    onClose();
  };

  return (
    <div ref={rootRef} className="time-popover" role="dialog" aria-label="Выбор времени">
      <div className="time-popover__row">
        <label className="time-popover__label">
          <span>Часы</span>
          <select
            className="time-popover__select"
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}
              </option>
            ))}
          </select>
        </label>
        <label className="time-popover__label">
          <span>Минуты</span>
          <select
            className="time-popover__select"
            value={minute}
            onChange={(e) => setMinute(Number(e.target.value))}
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, '0')}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button type="button" className="btn btn--primary btn--block time-popover__apply" onClick={apply}>
        Готово
      </button>
    </div>
  );
}
