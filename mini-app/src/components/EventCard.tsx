import { Link } from 'react-router-dom';
import type { EventListItem, RsvpStatus } from '../types';
import { formatEventTimeLabel } from '../utils/dates';
import { saveListScrollPosition } from '../utils/scrollRestoration';
import { ParticipantNames } from './ParticipantNames';
import { RsvpSection } from './RsvpSection';

interface EventCardProps {
  event: EventListItem;
  onRsvpChange: (eventId: string, status: RsvpStatus, previousStatus: RsvpStatus | null) => void;
}

export function EventCard({ event, onRsvpChange }: EventCardProps) {
  const going = event.participants.going;
  const maybe = event.participants.maybe;

  return (
    <article className="event-card">
      <Link
        to={`/events/${event.id}`}
        className="event-card__link"
        onClick={saveListScrollPosition}
      >
        <div
          className={`event-card__time${event.timeUnset ? ' event-card__time--unset' : ''}`}
        >
          {formatEventTimeLabel(event.startsAt, event.timeUnset)}
        </div>
        <div className="event-card__title">{event.title}</div>
        {event.location && <div className="event-card__location">📍 {event.location}</div>}
        {going.length > 0 && (
          <div className="event-card__participants">
            <span className="event-card__participants-label">Идут:</span>{' '}
            <ParticipantNames users={going} />
          </div>
        )}
        {maybe.length > 0 && (
          <div className="event-card__participants event-card__participants--maybe">
            <span className="event-card__participants-label">Возможно:</span>{' '}
            <ParticipantNames users={maybe} />
          </div>
        )}
      </Link>
      <RsvpSection
        eventId={event.id}
        value={event.myRsvp}
        onChange={(status) => onRsvpChange(event.id, status, event.myRsvp)}
      />
    </article>
  );
}
