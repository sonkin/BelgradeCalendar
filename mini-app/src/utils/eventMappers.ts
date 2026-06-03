import type { EventDetail, EventListItem } from '../types';

export function listItemToDetail(item: EventListItem): EventDetail {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    startsAt: item.startsAt,
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
