import mongoose from 'mongoose';
import { Event, type IEvent } from '../models/Event.js';
import { EventReminderSent } from '../models/EventReminderSent.js';
import {
  isReminderOffset,
  offsetToMinutes,
  remindAtTime,
  reminderLeadPhrase,
  type ReminderOffset,
} from '../utils/reminderOffsets.js';
import { postEventReminderToGroup } from './telegramBot.js';

/** Окно после наступления времени напоминания (cron раз в 5 мин) */
const SEND_WINDOW_MS = 12 * 60_000;

function eventReminders(event: IEvent): ReminderOffset[] {
  return (event.reminders ?? []).filter(isReminderOffset);
}

export async function clearReminderSentForEvent(eventId: string): Promise<void> {
  await EventReminderSent.deleteMany({
    eventId: new mongoose.Types.ObjectId(eventId),
  });
}

export async function runReminderJob(now = new Date()): Promise<void> {
  // Не фильтруем startsAt > now: cron раз в N минут может пропустить узкое окно
  // (например «за 1 мин»). Просрочку отсекают dueAt и SEND_WINDOW_MS ниже.
  const events = await Event.find({
    deletedAt: null,
    reminders: { $exists: true, $ne: [] },
  });

  for (const event of events) {
    const offsets = eventReminders(event);
    if (offsets.length === 0) continue;

    for (const offset of offsets) {
      const dueAt = remindAtTime(event.startsAt, offset);
      if (dueAt > now) continue;
      if (now.getTime() - dueAt.getTime() > SEND_WINDOW_MS) continue;

      const already = await EventReminderSent.findOne({
        eventId: event._id,
        offset,
      });
      if (already) continue;

      try {
        await postEventReminderToGroup(event, reminderLeadPhrase(offset));
        await EventReminderSent.create({
          eventId: event._id,
          offset,
          sentAt: now,
        });
        console.log(`Reminder sent: event=${event._id.toString()} offset=${offset}`);
      } catch (error) {
        console.error(
          `Failed reminder for event=${event._id.toString()} offset=${offset}:`,
          error,
        );
      }
    }
  }
}

/** Для тестов / отладки */
export function minutesUntilReminder(startsAt: Date, offset: ReminderOffset): number {
  return offsetToMinutes(offset);
}
