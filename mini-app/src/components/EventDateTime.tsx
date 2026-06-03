import { getDateDisplay } from '../utils/dates';

interface EventDateTimeProps {
  startsAt: string;
  className?: string;
  compact?: boolean;
}

export function EventDateTime({ startsAt, className = '', compact = false }: EventDateTimeProps) {
  const { weekdayDate, relative, time } = getDateDisplay(startsAt);

  return (
    <div
      className={`event-datetime ${compact ? 'event-datetime--compact' : ''} ${className}`.trim()}
    >
      <span className="event-datetime__weekday-date">{weekdayDate}</span>
      <span className="event-datetime__relative">{relative}</span>
      <span className="event-datetime__time">{time}</span>
    </div>
  );
}
