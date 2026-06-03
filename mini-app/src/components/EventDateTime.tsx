import { getDateDisplay } from '../utils/dates';

interface EventDateTimeProps {
  startsAt: string;
  timeUnset?: boolean;
  className?: string;
  compact?: boolean;
}

export function EventDateTime({
  startsAt,
  timeUnset = false,
  className = '',
  compact = false,
}: EventDateTimeProps) {
  const { weekdayDate, relative, time } = getDateDisplay(startsAt, timeUnset);

  return (
    <div
      className={`event-datetime ${compact ? 'event-datetime--compact' : ''} ${className}`.trim()}
    >
      <span className="event-datetime__weekday-date">{weekdayDate}</span>
      <span className="event-datetime__relative">{relative}</span>
      {time ? (
        <span className="event-datetime__time">{time}</span>
      ) : (
        <span className="event-datetime__time event-datetime__time--unset">время уточняется</span>
      )}
    </div>
  );
}
