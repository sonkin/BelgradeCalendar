import { useEffect, useMemo, useRef, useState } from 'react';
import { belgradeTodayYmd } from '../utils/dates';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
] as const;

function parseBelgradeDate(date: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(date.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Понедельник = 0 */
function mondayBasedWeekday(year: number, month: number, day: number): number {
  const js = new Date(year, month - 1, day).getDay();
  return js === 0 ? 6 : js - 1;
}

type Props = {
  value: string;
  onChange: (belgradeDate: string) => void;
  onClose: () => void;
};

export function CalendarPopover({ value, onChange, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const parsed = parseBelgradeDate(value);
  const today = belgradeTodayYmd();

  const [viewYear, setViewYear] = useState(parsed?.year ?? today.year);
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.month);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);

  const cells = useMemo(() => {
    const firstWeekday = mondayBasedWeekday(viewYear, viewMonth, 1);
    const total = daysInMonth(viewYear, viewMonth);
    const result: { day: number; inMonth: boolean }[] = [];

    const prevMonth = viewMonth === 1 ? 12 : viewMonth - 1;
    const prevYear = viewMonth === 1 ? viewYear - 1 : viewYear;
    const prevTotal = daysInMonth(prevYear, prevMonth);

    for (let i = firstWeekday - 1; i >= 0; i--) {
      result.push({ day: prevTotal - i, inMonth: false });
    }
    for (let d = 1; d <= total; d++) {
      result.push({ day: d, inMonth: true });
    }
    let nextDay = 1;
    while (result.length % 7 !== 0) {
      result.push({ day: nextDay++, inMonth: false });
    }
    return result;
  }, [viewMonth, viewYear]);

  const shiftMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const selectDay = (day: number) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    onChange(`${pad(day)}.${pad(viewMonth)}.${viewYear}`);
    onClose();
  };

  return (
    <div ref={rootRef} className="calendar-popover" role="dialog" aria-label="Выбор даты">
      <div className="calendar-popover__header">
        <button
          type="button"
          className="calendar-popover__nav"
          onClick={() => shiftMonth(-1)}
          aria-label="Предыдущий месяц"
        >
          ‹
        </button>
        <span className="calendar-popover__title">
          {MONTH_NAMES[viewMonth - 1]} {viewYear}
        </span>
        <button
          type="button"
          className="calendar-popover__nav"
          onClick={() => shiftMonth(1)}
          aria-label="Следующий месяц"
        >
          ›
        </button>
      </div>

      <div className="calendar-popover__weekdays">
        {WEEKDAYS.map((d) => (
          <span key={d} className="calendar-popover__weekday">
            {d}
          </span>
        ))}
      </div>

      <div className="calendar-popover__grid">
        {cells.map((cell, index) => {
          if (!cell.inMonth) {
            return (
              <span key={index} className="calendar-popover__day calendar-popover__day--outside" aria-hidden>
                {cell.day}
              </span>
            );
          }

          const isToday =
            cell.day === today.day && viewMonth === today.month && viewYear === today.year;
          const isSelected =
            parsed?.day === cell.day && parsed.month === viewMonth && parsed.year === viewYear;

          return (
            <button
              key={index}
              type="button"
              className={[
                'calendar-popover__day',
                isToday ? 'calendar-popover__day--today' : '',
                isSelected ? 'calendar-popover__day--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => selectDay(cell.day)}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
