import { Link } from 'react-router-dom';
import { useEvents } from '../context/EventsContext';
import type { EventListItem } from '../types';
import { formatCompactListSchedule } from '../utils/dates';
import { saveListScrollPosition } from '../utils/scrollRestoration';

interface EventCardCompactProps {
  event: EventListItem;
  onToggleGoing: () => void;
}

export function EventCardCompact({ event, onToggleGoing }: EventCardCompactProps) {
  const { getRsvpSaveState } = useEvents();
  const { phase } = getRsvpSaveState(event.id);
  const isGoing = event.myRsvp === 'going';
  const saving = phase === 'saving';

  return (
    <article className="event-card event-card--compact">
      <div className="event-card--compact__row">
        <Link
          to={`/events/${event.id}`}
          className="event-card--compact__link"
          onClick={saveListScrollPosition}
        >
          <div className="event-card--compact__title">{event.title}</div>
          <div className="event-card--compact__schedule">
            {formatCompactListSchedule(event.startsAt, event.timeUnset)}
          </div>
        </Link>
        <button
          type="button"
          className={`event-card--compact__going${isGoing ? ' event-card--compact__going--active' : ''}`}
          disabled={saving}
          aria-pressed={isGoing}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleGoing();
          }}
        >
          Иду
        </button>
      </div>
    </article>
  );
}
