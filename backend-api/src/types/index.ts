export type UserRole = 'member' | 'admin';

export type RsvpStatus = 'going' | 'maybe' | 'not_going';

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export interface JwtPayload {
  userId: string;
}

export interface UserDto {
  id: string;
  telegramId: number;
  username: string | null;
  firstName: string;
  lastName: string | null;
  displayName: string | null;
  photoUrl: string | null;
  role: UserRole;
}

export interface UpdateMeBody {
  displayName?: string | null;
}

export interface ParticipantUserDto {
  id: string;
  telegramId: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  displayName: string | null;
  photoUrl: string | null;
}

export interface ParticipantCounts {
  going: number;
  maybe: number;
  notGoing: number;
}

export interface EventListParticipants {
  going: ParticipantUserDto[];
  maybe: ParticipantUserDto[];
}

export interface EventListItemDto {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  timeUnset: boolean;
  durationMinutes: number | null;
  location: string | null;
  createdBy: ParticipantUserDto;
  participants: EventListParticipants;
  myRsvp: RsvpStatus | null;
}

export interface EventDetailDto extends Omit<EventListItemDto, 'participants' | 'myRsvp'> {
  participants: {
    going: ParticipantUserDto[];
    maybe: ParticipantUserDto[];
    notGoing: ParticipantUserDto[];
  };
  myRsvp: RsvpStatus | null;
}

export interface CreateEventBody {
  title: string;
  startsAt: string;
  timeUnset?: boolean;
  durationMinutes?: number | null;
  location?: string | null;
  description?: string | null;
}

export interface UpdateEventBody {
  title?: string;
  startsAt?: string;
  timeUnset?: boolean;
  durationMinutes?: number | null;
  location?: string | null;
  description?: string | null;
}

export interface RsvpBody {
  status?: RsvpStatus;
  /** Снять свой RSVP (без DELETE — совместимость с nginx) */
  clear?: boolean;
}

export type CalendarFeedFilter = 'all' | 'going';

export interface CalendarFeedsDto {
  allUrl: string;
  goingUrl: string;
  webcalAllUrl: string;
  webcalGoingUrl: string;
}
