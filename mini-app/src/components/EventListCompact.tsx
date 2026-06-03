import { useMemo } from 'react';
import type { EventListItem, RsvpStatus } from '../types';
import { sortEventsByStart } from '../utils/dates';
import { EventCardCompact } from './EventCardCompact';

interface EventListCompactProps {
  events: EventListItem[];
  onToggleGoing: (eventId: string, myRsvp: RsvpStatus | null) => void;
}

export function EventListCompact({ events, onToggleGoing }: EventListCompactProps) {
  const sorted = useMemo(() => sortEventsByStart(events), [events]);

  if (sorted.length === 0) {
    return null;
  }

  return (
    <div className="event-list-compact">
      {sorted.map((event) => (
        <EventCardCompact
          key={event.id}
          event={event}
          onToggleGoing={() => onToggleGoing(event.id, event.myRsvp)}
        />
      ))}
    </div>
  );
}
