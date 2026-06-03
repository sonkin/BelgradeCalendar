import { config } from '../config.js';
import type { IEvent } from '../models/Event.js';
import type { IUser } from '../models/User.js';

function formatEventDate(startsAt: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: config.timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(startsAt);
}

function formatEventTime(startsAt: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: config.timezone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(startsAt);
}

export function formatEventAnnouncementText(event: IEvent): string {
  const lines = [
    `Новое событие: ${event.title}`,
    `${formatEventDate(event.startsAt)}, ${formatEventTime(event.startsAt)} (Белград)`,
  ];

  if (event.location) {
    lines.push(`📍 ${event.location}`);
  }

  if (event.description) {
    lines.push(event.description);
  }

  return lines.join('\n');
}

export function formatEventUpdateText(event: IEvent): string {
  const lines = [
    `Событие изменено: ${event.title}`,
    `${formatEventDate(event.startsAt)}, ${formatEventTime(event.startsAt)} (Белград)`,
  ];

  if (event.location) {
    lines.push(`📍 ${event.location}`);
  }

  if (event.description) {
    lines.push(event.description);
  }

  return lines.join('\n');
}

export function buildEventWebAppUrl(eventId: string): string {
  const base = config.webappUrl.replace(/\/$/, '');
  return `${base}/events/${eventId}`;
}

function miniAppDirectLink(startParam?: string): string {
  const base = `https://t.me/${config.botUsername}?startapp`;
  return startParam ? `${base}=${encodeURIComponent(startParam)}` : base;
}

function buildOpenCalendarButton(eventId: string) {
  // web_app-кнопки не работают в группах — только t.me/?startapp
  if (config.webappUrl.startsWith('https://')) {
    return { text: 'Открыть календарь', url: miniAppDirectLink(`event_${eventId}`) };
  }
  return { text: 'Открыть календарь', url: buildEventWebAppUrl(eventId) };
}

interface TelegramSendMessageResponse {
  ok: boolean;
  result?: { message_id: number };
  description?: string;
}

export async function postEventAnnouncement(event: IEvent, _creator: IUser): Promise<number | null> {
  if (!config.telegramChatId) {
    console.warn('TELEGRAM_CHAT_ID not set — skipping Telegram announcement');
    return null;
  }

  const eventId = event._id.toString();
  const payload: Record<string, unknown> = {
    chat_id: config.telegramChatId,
    text: formatEventAnnouncementText(event),
  };

  if (config.webappUrl.startsWith('https://')) {
    payload.reply_markup = {
      inline_keyboard: [[buildOpenCalendarButton(eventId)]],
    };
  }

  const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as TelegramSendMessageResponse;

  if (!data.ok || !data.result) {
    throw new Error(data.description ?? 'Telegram sendMessage failed');
  }

  return data.result.message_id;
}

export async function postEventUpdateNotification(event: IEvent): Promise<void> {
  if (!config.telegramChatId) {
    console.warn('TELEGRAM_CHAT_ID not set — skipping Telegram update notification');
    return;
  }

  const eventId = event._id.toString();
  const payload: Record<string, unknown> = {
    chat_id: config.telegramChatId,
    text: formatEventUpdateText(event),
  };

  if (config.webappUrl.startsWith('https://')) {
    payload.reply_markup = {
      inline_keyboard: [[buildOpenCalendarButton(eventId)]],
    };
  }

  const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as TelegramSendMessageResponse;

  if (!data.ok) {
    throw new Error(data.description ?? 'Telegram sendMessage failed');
  }
}
