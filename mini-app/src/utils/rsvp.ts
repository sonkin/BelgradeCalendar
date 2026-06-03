import type { EventDetail, EventListItem, ParticipantUser, RsvpStatus } from '../types';

function participantFromUser(user: ParticipantUser): ParticipantUser {
  return { ...user };
}

export function applyListRsvp(
  event: EventListItem,
  user: ParticipantUser,
  status: RsvpStatus,
): EventListItem {
  const me = participantFromUser(user);
  const going = event.participants.going.filter((p) => p.id !== user.id);
  const maybe = event.participants.maybe.filter((p) => p.id !== user.id);

  if (status === 'going') going.push(me);
  if (status === 'maybe') maybe.push(me);

  return {
    ...event,
    myRsvp: status,
    participants: { going, maybe },
  };
}

export function applyDetailRsvp(
  event: EventDetail,
  user: ParticipantUser,
  status: RsvpStatus,
): EventDetail {
  const me = participantFromUser(user);
  const going = event.participants.going.filter((p) => p.id !== user.id);
  const maybe = event.participants.maybe.filter((p) => p.id !== user.id);
  const notGoing = event.participants.notGoing.filter((p) => p.id !== user.id);

  if (status === 'going') going.push(me);
  if (status === 'maybe') maybe.push(me);
  if (status === 'not_going') notGoing.push(me);

  return {
    ...event,
    myRsvp: status,
    participants: { going, maybe, notGoing },
  };
}

export function clearListRsvp(event: EventListItem, userId: string): EventListItem {
  return {
    ...event,
    myRsvp: null,
    participants: {
      going: event.participants.going.filter((p) => p.id !== userId),
      maybe: event.participants.maybe.filter((p) => p.id !== userId),
    },
  };
}

export function userAsParticipant(user: {
  id: string;
  telegramId: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  displayName: string | null;
  photoUrl: string | null;
}): ParticipantUser {
  return {
    id: user.id,
    telegramId: user.telegramId,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    displayName: user.displayName,
    photoUrl: user.photoUrl,
  };
}
