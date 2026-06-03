import type {
  CalendarFeeds,
  CreateEventPayload,
  EventDetail,
  EventListItem,
  RsvpStatus,
  UpdateEventPayload,
  User,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

let authToken: string | null = sessionStorage.getItem('belca_token');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (token) {
    sessionStorage.setItem('belca_token', token);
  } else {
    sessionStorage.removeItem('belca_token');
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const raw = await response.text();

  if (response.status === 204 || raw.length === 0) {
    return undefined as T;
  }

  let data: T & { error?: string };
  try {
    data = JSON.parse(raw) as T & { error?: string };
  } catch {
    throw new ApiError(
      response.status,
      response.ok
        ? 'Некорректный ответ сервера'
        : 'Сервер вернул не JSON (проверьте, что API обновлён)',
    );
  }

  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? 'Ошибка запроса');
  }

  return data;
}

export async function loginWithTelegram(initData: string): Promise<{ token: string; user: User }> {
  const data = await request<{ token: string; user: User }>('/auth/telegram', {
    method: 'POST',
    body: JSON.stringify({ initData }),
  });
  setAuthToken(data.token);
  return data;
}

export async function fetchMe(): Promise<User> {
  const data = await request<{ user: User }>('/me');
  return data.user;
}

export async function updateMe(payload: { displayName?: string | null }): Promise<User> {
  const data = await request<{ user: User }>('/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return data.user;
}

export async function fetchEvents(from?: string, to?: string): Promise<EventListItem[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  const data = await request<{ events: EventListItem[] }>(`/events${query ? `?${query}` : ''}`);
  return data.events;
}

export async function fetchEvent(id: string): Promise<EventDetail> {
  const data = await request<{ event: EventDetail }>(`/events/${id}`);
  return data.event;
}

export async function createEvent(payload: CreateEventPayload): Promise<EventDetail> {
  const data = await request<{ event: EventDetail }>('/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.event;
}

export async function updateEvent(eventId: string, payload: UpdateEventPayload): Promise<EventDetail> {
  const data = await request<{ event: EventDetail }>(`/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return data.event;
}

export async function updateRsvp(eventId: string, status: RsvpStatus): Promise<EventDetail> {
  const data = await request<{ event: EventDetail }>(`/events/${eventId}/rsvp`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  if (!data?.event) {
    throw new Error('Сервер не вернул обновлённое событие');
  }
  return data.event;
}

export async function clearRsvp(eventId: string): Promise<EventDetail> {
  const data = await request<{ event: EventDetail }>(`/events/${eventId}/rsvp`, {
    method: 'PUT',
    body: JSON.stringify({ clear: true }),
  });
  if (!data?.event) {
    throw new Error('Сервер не вернул обновлённое событие');
  }
  return data.event;
}

export async function deleteEvent(eventId: string): Promise<void> {
  await request<void>(`/events/${eventId}`, { method: 'DELETE' });
}

export async function fetchCalendarFeeds(): Promise<CalendarFeeds> {
  return request<CalendarFeeds>('/me/calendar-feeds');
}

export async function resetCalendarFeeds(): Promise<CalendarFeeds> {
  return request<CalendarFeeds>('/me/calendar-feeds/reset', { method: 'POST' });
}
