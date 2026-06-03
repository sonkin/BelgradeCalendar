import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchEvents } from '../api/client';
import type { EventDetail, EventListItem } from '../types';
import { detailToListItem, isUpcomingEvent } from '../utils/eventMappers';

function isEventDetail(event: EventListItem | EventDetail): event is EventDetail {
  return 'notGoing' in event.participants;
}

const CACHE_KEY = 'belca_events_cache';

function readCache(): EventListItem[] {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EventListItem[];
  } catch {
    return [];
  }
}

function writeCache(events: EventListItem[]): void {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(events));
}

function listFromDate(): string {
  return new Date().toISOString();
}

interface EventsContextValue {
  events: EventListItem[];
  initialLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getEventById: (id: string) => EventListItem | undefined;
  upsertEvent: (event: EventListItem | EventDetail) => void;
  removeEvent: (id: string) => void;
  replaceEvents: (updater: (events: EventListItem[]) => EventListItem[]) => void;
}

const EventsContext = createContext<EventsContextValue | null>(null);

export function EventsProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const [events, setEvents] = useState<EventListItem[]>(() => readCache());
  const [initialLoading, setInitialLoading] = useState(() => readCache().length === 0);
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback((next: EventListItem[]) => {
    setEvents(next);
    writeCache(next);
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchEvents(listFromDate());
      persist(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить события');
    } finally {
      setInitialLoading(false);
    }
  }, [persist]);

  useEffect(() => {
    if (enabled) {
      void refresh();
    }
  }, [enabled, refresh]);

  const getEventById = useCallback(
    (id: string) => events.find((event) => event.id === id),
    [events],
  );

  const upsertEvent = useCallback((event: EventListItem | EventDetail) => {
    const item = isEventDetail(event) ? detailToListItem(event) : event;

    setEvents((prev) => {
      const next = [...prev.filter((existing) => existing.id !== item.id), item]
        .filter(isUpcomingEvent)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      writeCache(next);
      return next;
    });
  }, []);

  const removeEvent = useCallback((id: string) => {
    setEvents((prev) => {
      const next = prev.filter((event) => event.id !== id);
      writeCache(next);
      return next;
    });
  }, []);

  const replaceEvents = useCallback((updater: (events: EventListItem[]) => EventListItem[]) => {
    setEvents((prev) => {
      const next = updater(prev);
      writeCache(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      events,
      initialLoading,
      error,
      refresh,
      getEventById,
      upsertEvent,
      removeEvent,
      replaceEvents,
    }),
    [events, initialLoading, error, refresh, getEventById, upsertEvent, removeEvent, replaceEvents],
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents(): EventsContextValue {
  const ctx = useContext(EventsContext);
  if (!ctx) {
    throw new Error('useEvents must be used within EventsProvider');
  }
  return ctx;
}
