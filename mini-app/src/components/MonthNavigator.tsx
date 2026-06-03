import { formatMonthLabel } from '../utils/dates';

interface MonthNavigatorProps {
  monthKey: string;
  monthKeys: string[];
  onMonthKeyChange: (monthKey: string) => void;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export function MonthNavigator({
  monthKey,
  monthKeys,
  onMonthKeyChange,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
}: MonthNavigatorProps) {
  return (
    <div className="month-nav">
      <button
        type="button"
        className="month-nav__arrow"
        aria-label="Предыдущий месяц"
        disabled={!canGoPrev}
        onClick={onPrev}
      >
        ←
      </button>

      <select
        className="month-nav__select"
        value={monthKey}
        aria-label="Выбор месяца"
        onChange={(e) => onMonthKeyChange(e.target.value)}
      >
        {monthKeys.map((key) => (
          <option key={key} value={key}>
            {formatMonthLabel(key)}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="month-nav__arrow"
        aria-label="Следующий месяц"
        disabled={!canGoNext}
        onClick={onNext}
      >
        →
      </button>
    </div>
  );
}
