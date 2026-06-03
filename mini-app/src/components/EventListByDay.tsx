import { useMemo } from 'react';
import type { EventListItem, RsvpStatus } from '../types';
import type { ListViewMode } from '../utils/listView';
import { groupEventsByDay } from '../utils/dates';
import { DaySectionHeader } from './DaySectionHeader';
import { EventCard } from './EventCard';
import { EventCardCompact } from './EventCardCompact';

interface EventListByDayProps {
  events: EventListItem[];
  viewMode: ListViewMode;
  onRsvpChange: (eventId: string, status: RsvpStatus, previousStatus: RsvpStatus | null) => void;
}

export function EventListByDay({ events, viewMode, onRsvpChange }: EventListByDayProps) {
  const sortedGroups = useMemo(() => {
    const grouped = groupEventsByDay(events);
    return [...grouped.entries()].sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
  }, [events]);

  if (sortedGroups.length === 0) {
    return null;
  }

  return (
    <>
      {sortedGroups.map(([key, dayEvents]) => (
        <section key={key} className="day-section">
          <DaySectionHeader startsAt={dayEvents[0].startsAt} />
          {dayEvents.map((event) =>
            viewMode === 'compact' ? (
              <EventCardCompact key={event.id} event={event} />
            ) : (
              <EventCard
                key={event.id}
                event={event}
                onRsvpChange={onRsvpChange}
              />
            ),
          )}
        </section>
      ))}
    </>
  );
}
