import mongoose from 'mongoose';
import { Event, type IEvent } from '../models/Event.js';
import { EventParticipant } from '../models/EventParticipant.js';
import { User, type IUser } from '../models/User.js';
import type {
  CreateEventBody,
  EventDetailDto,
  EventListItemDto,
  RsvpStatus,
  UpdateEventBody,
} from '../types/index.js';
import { AppError } from '../utils/errors.js';
import { toParticipantUserDto } from '../utils/participantDto.js';
import { postEventAnnouncement } from './telegramBot.js';
import {
  belgradeMidnightOnSameDay,
  DEFAULT_DURATION_MINUTES,
  isUpcomingEvent,
} from '../utils/eventTiming.js';

function resolveStartsAt(startsAt: Date, timeUnset: boolean): Date {
  return timeUnset ? belgradeMidnightOnSameDay(startsAt) : startsAt;
}

async function getParticipantsForList(
  eventIds: mongoose.Types.ObjectId[],
): Promise<Map<string, { going: IUser[]; maybe: IUser[] }>> {
  const map = new Map<string, { going: IUser[]; maybe: IUser[] }>();
  for (const eventId of eventIds) {
    map.set(eventId.toString(), { going: [], maybe: [] });
  }
  if (eventIds.length === 0) {
    return map;
  }

  const rows = await EventParticipant.find({ eventId: { $in: eventIds } }).populate<{ userId: IUser }>(
    'userId',
  );

  for (const row of rows) {
    const group = map.get(row.eventId.toString());
    if (!group) continue;
    const user = row.userId as IUser;
    if (row.status === 'going') group.going.push(user);
    if (row.status === 'maybe') group.maybe.push(user);
  }

  return map;
}

async function getMyRsvpMap(
  eventIds: mongoose.Types.ObjectId[],
  userId: string,
): Promise<Map<string, RsvpStatus>> {
  const map = new Map<string, RsvpStatus>();
  if (eventIds.length === 0) {
    return map;
  }

  const rows = await EventParticipant.find({
    eventId: { $in: eventIds },
    userId: new mongoose.Types.ObjectId(userId),
  }).select('eventId status');

  for (const row of rows) {
    map.set(row.eventId.toString(), row.status as RsvpStatus);
  }

  return map;
}

function parseDate(value: string, fieldName: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `Некорректная дата в поле ${fieldName}`);
  }
  return date;
}

function validateDuration(durationMinutes: number | null | undefined): number | null {
  if (durationMinutes == null) {
    return null;
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1) {
    throw new AppError(400, 'durationMinutes должно быть целым числом >= 1');
  }
  return durationMinutes;
}

function validateTitle(title: string | undefined): string {
  const trimmed = title?.trim();
  if (!trimmed) {
    throw new AppError(400, 'Поле title обязательно');
  }
  if (trimmed.length > 200) {
    throw new AppError(400, 'title не может быть длиннее 200 символов');
  }
  return trimmed;
}

async function loadEventOrThrow(eventId: string): Promise<IEvent> {
  if (!mongoose.isValidObjectId(eventId)) {
    throw new AppError(404, 'Событие не найдено');
  }

  const event = await Event.findOne({ _id: eventId, deletedAt: null });
  if (!event) {
    throw new AppError(404, 'Событие не найдено');
  }

  return event;
}

function canModifyEvent(event: IEvent, user: IUser): boolean {
  return user.role === 'admin' || event.createdBy.toString() === user._id.toString();
}

async function populateCreatedBy(event: IEvent): Promise<IUser> {
  const creator = await User.findById(event.createdBy);
  if (!creator) {
    throw new AppError(500, 'Автор события не найден');
  }
  return creator;
}

export async function listEvents(
  from: string | undefined,
  to: string | undefined,
  currentUserId: string,
): Promise<EventListItemDto[]> {
  const now = new Date();
  const filter: Record<string, unknown> = { deletedAt: null };

  const startsAtFilter: Record<string, Date> = {
    // Включаем ещё идущие события, которые начались недавно
    $gte: new Date(now.getTime() - DEFAULT_DURATION_MINUTES * 60 * 1000),
  };

  if (from) {
    const fromDate = parseDate(from, 'from');
    if (fromDate > startsAtFilter.$gte) {
      startsAtFilter.$gte = fromDate;
    }
  }

  if (to) {
    startsAtFilter.$lte = parseDate(to, 'to');
  }

  filter.startsAt = startsAtFilter;

  const events = (await Event.find(filter).sort({ startsAt: 1 })).filter((event) =>
    isUpcomingEvent(event, now),
  );
  const eventIds = events.map((event) => event._id);

  const [participantsMap, myRsvpMap] = await Promise.all([
    getParticipantsForList(eventIds),
    getMyRsvpMap(eventIds, currentUserId),
  ]);

  const creatorIds = [...new Set(events.map((event) => event.createdBy.toString()))];
  const creators = await User.find({ _id: { $in: creatorIds } });
  const creatorsMap = new Map(creators.map((creator) => [creator._id.toString(), creator]));

  return events.map((event) => {
    const creator = creatorsMap.get(event.createdBy.toString());
    if (!creator) {
      throw new AppError(500, 'Автор события не найден');
    }

    const participants = participantsMap.get(event._id.toString()) ?? { going: [], maybe: [] };

    return {
      id: event._id.toString(),
      title: event.title,
      description: event.description ?? null,
      startsAt: event.startsAt.toISOString(),
      timeUnset: Boolean(event.timeUnset),
      durationMinutes: event.durationMinutes ?? null,
      location: event.location ?? null,
      createdBy: toParticipantUserDto(creator),
      participants: {
        going: participants.going.map(toParticipantUserDto),
        maybe: participants.maybe.map(toParticipantUserDto),
      },
      myRsvp: myRsvpMap.get(event._id.toString()) ?? null,
    };
  });
}

export async function getEventById(eventId: string, currentUserId: string): Promise<EventDetailDto> {
  const event = await loadEventOrThrow(eventId);
  const creator = await populateCreatedBy(event);

  const participants = await EventParticipant.find({ eventId: event._id }).populate<{ userId: IUser }>('userId');

  const grouped: EventDetailDto['participants'] = {
    going: [],
    maybe: [],
    notGoing: [],
  };

  let myRsvp: RsvpStatus | null = null;

  for (const participant of participants) {
    const user = participant.userId as IUser;
    const dto = toParticipantUserDto(user);

    if (participant.status === 'going') grouped.going.push(dto);
    if (participant.status === 'maybe') grouped.maybe.push(dto);
    if (participant.status === 'not_going') grouped.notGoing.push(dto);

    if (user._id.toString() === currentUserId) {
      myRsvp = participant.status as RsvpStatus;
    }
  }

  return {
    id: event._id.toString(),
    title: event.title,
    description: event.description ?? null,
    startsAt: event.startsAt.toISOString(),
    timeUnset: Boolean(event.timeUnset),
    durationMinutes: event.durationMinutes ?? null,
    location: event.location ?? null,
    createdBy: toParticipantUserDto(creator),
    participants: grouped,
    myRsvp,
  };
}

export async function createEvent(body: CreateEventBody, user: IUser): Promise<EventDetailDto> {
  const title = validateTitle(body.title);
  const timeUnset = Boolean(body.timeUnset);
  const startsAt = resolveStartsAt(parseDate(body.startsAt, 'startsAt'), timeUnset);
  const durationMinutes = validateDuration(body.durationMinutes);

  const event = await Event.create({
    title,
    startsAt,
    timeUnset,
    durationMinutes,
    location: body.location?.trim() || null,
    description: body.description?.trim() || null,
    createdBy: user._id,
  });

  await EventParticipant.create({
    eventId: event._id,
    userId: user._id,
    status: 'going',
  });

  try {
    const messageId = await postEventAnnouncement(event, user);
    if (messageId !== null) {
      event.telegramMessageId = messageId;
      await event.save();
    }
  } catch (error) {
    console.error('Failed to post event announcement to Telegram:', error);
  }

  return getEventById(event._id.toString(), user._id.toString());
}

export async function updateEvent(
  eventId: string,
  body: UpdateEventBody,
  user: IUser,
): Promise<EventDetailDto> {
  const event = await loadEventOrThrow(eventId);

  if (!canModifyEvent(event, user)) {
    throw new AppError(403, 'Недостаточно прав для редактирования события');
  }

  if (body.title !== undefined) {
    event.title = validateTitle(body.title);
  }
  if (body.timeUnset !== undefined) {
    event.timeUnset = Boolean(body.timeUnset);
  }
  if (body.startsAt !== undefined) {
    event.startsAt = resolveStartsAt(parseDate(body.startsAt, 'startsAt'), Boolean(event.timeUnset));
  } else if (body.timeUnset !== undefined && event.timeUnset) {
    event.startsAt = belgradeMidnightOnSameDay(event.startsAt);
  }
  if (body.durationMinutes !== undefined) {
    event.durationMinutes = validateDuration(body.durationMinutes);
  }
  if (body.location !== undefined) {
    event.location = body.location?.trim() || null;
  }
  if (body.description !== undefined) {
    event.description = body.description?.trim() || null;
  }

  await event.save();

  return getEventById(event._id.toString(), user._id.toString());
}

export async function deleteEvent(eventId: string, user: IUser): Promise<void> {
  const event = await loadEventOrThrow(eventId);

  if (!canModifyEvent(event, user)) {
    throw new AppError(403, 'Недостаточно прав для удаления события');
  }

  event.deletedAt = new Date();
  await event.save();
}

export async function upsertRsvp(
  eventId: string,
  status: RsvpStatus,
  user: IUser,
): Promise<EventDetailDto> {
  if (!['going', 'maybe', 'not_going'].includes(status)) {
    throw new AppError(400, 'status должен быть going, maybe или not_going');
  }

  await loadEventOrThrow(eventId);

  await EventParticipant.findOneAndUpdate(
    { eventId: new mongoose.Types.ObjectId(eventId), userId: user._id },
    { $set: { status } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return getEventById(eventId, user._id.toString());
}
