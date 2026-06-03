import type { EventDetail, EventListItem } from '../types';
import { belgradeEndOfDayIso } from './dates';

const DEFAULT_DURATION_MINUTES = 120;

export function isUpcomingEvent(
  event: Pick<EventListItem, 'startsAt' | 'durationMinutes' | 'timeUnset'>,
  now = Date.now(),
): boolean {
  if (event.timeUnset) {
    return new Date(belgradeEndOfDayIso(event.startsAt)).getTime() > now;
  }
  const durationMs = (event.durationMinutes ?? DEFAULT_DURATION_MINUTES) * 60 * 1000;
  return new Date(event.startsAt).getTime() + durationMs > now;
}

export function listItemToDetail(item: EventListItem): EventDetail {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    startsAt: item.startsAt,
    timeUnset: item.timeUnset ?? false,
    durationMinutes: item.durationMinutes,
    location: item.location,
    createdBy: item.createdBy,
    participants: {
      going: [...item.participants.going],
      maybe: [...item.participants.maybe],
      notGoing: [],
    },
    myRsvp: item.myRsvp,
  };
}

export function detailToListItem(detail: EventDetail): EventListItem {
  return {
    id: detail.id,
    title: detail.title,
    description: detail.description,
    startsAt: detail.startsAt,
    timeUnset: detail.timeUnset ?? false,
    durationMinutes: detail.durationMinutes,
    location: detail.location,
    createdBy: detail.createdBy,
    participants: {
      going: [...detail.participants.going],
      maybe: [...detail.participants.maybe],
    },
    myRsvp: detail.myRsvp,
  };
}
