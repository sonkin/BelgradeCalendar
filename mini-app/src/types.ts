export type RsvpStatus = 'going' | 'maybe' | 'not_going';

export type ReminderOffset = '1m' | '1d' | '2d' | '3d' | '7d' | '14d' | '30d';

export interface User {
  id: string;
  telegramId: number;
  username: string | null;
  firstName: string;
  lastName: string | null;
  displayName: string | null;
  photoUrl: string | null;
  role: 'member' | 'admin';
}

export interface ParticipantUser {
  id: string;
  telegramId: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  displayName: string | null;
  photoUrl: string | null;
}

export interface EventListParticipants {
  going: ParticipantUser[];
  maybe: ParticipantUser[];
}

export interface EventListItem {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  timeUnset: boolean;
  reminders: ReminderOffset[];
  durationMinutes: number | null;
  location: string | null;
  createdBy: ParticipantUser;
  participants: EventListParticipants;
  myRsvp: RsvpStatus | null;
}

export interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  timeUnset: boolean;
  reminders: ReminderOffset[];
  durationMinutes: number | null;
  location: string | null;
  createdBy: ParticipantUser;
  participants: {
    going: ParticipantUser[];
    maybe: ParticipantUser[];
    notGoing: ParticipantUser[];
  };
  myRsvp: RsvpStatus | null;
}

export interface CreateEventPayload {
  title: string;
  startsAt: string;
  timeUnset?: boolean;
  reminders?: ReminderOffset[];
  durationMinutes?: number | null;
  location?: string | null;
  description?: string | null;
}

export interface UpdateEventPayload {
  title?: string;
  startsAt?: string;
  timeUnset?: boolean;
  reminders?: ReminderOffset[];
  description?: string | null;
}

export interface CalendarFeeds {
  allUrl: string;
  goingUrl: string;
  webcalAllUrl: string;
  webcalGoingUrl: string;
}
