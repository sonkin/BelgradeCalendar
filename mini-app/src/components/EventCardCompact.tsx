import { Link } from 'react-router-dom';
import type { EventListItem } from '../types';
import { formatCompactEventSchedule } from '../utils/dates';
import { saveListScrollPosition } from '../utils/scrollRestoration';

interface EventCardCompactProps {
  event: EventListItem;
}

export function EventCardCompact({ event }: EventCardCompactProps) {
  return (
    <article className="event-card event-card--compact">
      <Link
        to={`/events/${event.id}`}
        className="event-card--compact__link"
        onClick={saveListScrollPosition}
      >
        <div className="event-card--compact__title">{event.title}</div>
        <div className="event-card--compact__schedule">
          {formatCompactEventSchedule(event.startsAt, event.timeUnset)}
        </div>
      </Link>
    </article>
  );
}
