import crypto from 'node:crypto';
import ical, { ICalCalendarMethod } from 'ical-generator';
import { config } from '../config.js';
import { Event, type IEvent } from '../models/Event.js';
import { EventParticipant } from '../models/EventParticipant.js';
import { User, type IUser } from '../models/User.js';
import type { CalendarFeedFilter, CalendarFeedsDto } from '../types/index.js';
import { AppError } from '../utils/errors.js';

const DEFAULT_DURATION_MINUTES = 120;
const FEED_CALENDAR_NAME = 'Belgrade Friends Calendar';
const FEED_GOING_CALENDAR_NAME = 'Belgrade Friends — Иду';

function startOfToday(): Date {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  return from;
}

function toWebcalUrl(httpsUrl: string): string {
  return httpsUrl.replace(/^http:\/\//i, 'webcal://').replace(/^https:\/\//i, 'webcal://');
}

export function buildCalendarFeedUrls(token: string): CalendarFeedsDto {
  const base = `${config.apiPublicUrl}/calendar/${token}`;
  const allUrl = `${base}/all.ics`;
  const goingUrl = `${base}/going.ics`;

  return {
    allUrl,
    goingUrl,
    webcalAllUrl: toWebcalUrl(allUrl),
    webcalGoingUrl: toWebcalUrl(goingUrl),
  };
}

export async function ensureCalendarFeedToken(user: IUser): Promise<string> {
  if (user.calendarFeedToken) {
    return user.calendarFeedToken;
  }

  user.calendarFeedToken = crypto.randomBytes(24).toString('hex');
  await user.save();
  return user.calendarFeedToken;
}

export async function regenerateCalendarFeedToken(user: IUser): Promise<string> {
  user.calendarFeedToken = crypto.randomBytes(24).toString('hex');
  await user.save();
  return user.calendarFeedToken;
}

export async function getCalendarFeedsForUser(user: IUser): Promise<CalendarFeedsDto> {
  const token = await ensureCalendarFeedToken(user);
  return buildCalendarFeedUrls(token);
}

export async function findUserByFeedToken(token: string): Promise<IUser | null> {
  return User.findOne({ calendarFeedToken: token });
}

async function loadFeedEvents(filter: CalendarFeedFilter, userId: string): Promise<IEvent[]> {
  const from = startOfToday();
  const baseFilter = {
    deletedAt: null,
    startsAt: { $gte: from },
  };

  if (filter === 'all') {
    return Event.find(baseFilter).sort({ startsAt: 1 });
  }

  const participations = await EventParticipant.find({
    userId,
    status: 'going',
  }).select('eventId');

  const eventIds = participations.map((row) => row.eventId);
  if (eventIds.length === 0) {
    return [];
  }

  return Event.find({
    ...baseFilter,
    _id: { $in: eventIds },
  }).sort({ startsAt: 1 });
}

function eventEndTime(event: IEvent): Date {
  const durationMinutes = event.durationMinutes ?? DEFAULT_DURATION_MINUTES;
  return new Date(event.startsAt.getTime() + durationMinutes * 60 * 1000);
}

function eventSequence(event: IEvent): number {
  const updatedAt = event.updatedAt ?? event.createdAt;
  return Math.max(0, Math.floor(updatedAt.getTime() / 1000));
}

export async function buildCalendarFeedIcs(
  filter: CalendarFeedFilter,
  user: IUser,
): Promise<string> {
  const events = await loadFeedEvents(filter, user._id);
  const calendarName = filter === 'all' ? FEED_CALENDAR_NAME : FEED_GOING_CALENDAR_NAME;

  const calendar = ical({
    name: calendarName,
    prodId: { company: 'Belgrade Friends', product: 'Calendar' },
    method: ICalCalendarMethod.PUBLISH,
    timezone: config.timezone,
  });

  for (const event of events) {
    calendar.createEvent({
      id: `event-${event._id.toString()}@belca.jtutor.app`,
      start: event.startsAt,
      end: eventEndTime(event),
      summary: event.title,
      location: event.location ?? undefined,
      description: event.description ?? undefined,
      sequence: eventSequence(event),
    });
  }

  return calendar.toString();
}

export async function getCalendarFeedByToken(
  token: string,
  filter: CalendarFeedFilter,
): Promise<string> {
  const user = await findUserByFeedToken(token);
  if (!user) {
    throw new AppError(404, 'Календарная подписка не найдена');
  }

  return buildCalendarFeedIcs(filter, user);
}

export function parseCalendarFeedFilter(raw: string): CalendarFeedFilter {
  const normalized = raw.endsWith('.ics') ? raw.slice(0, -4) : raw;
  if (normalized === 'all' || normalized === 'going') {
    return normalized;
  }
  throw new AppError(404, 'Календарная подписка не найдена');
}
