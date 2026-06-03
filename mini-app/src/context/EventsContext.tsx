import WebApp from '@twa-dev/sdk';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, fetchEvents, updateRsvp } from '../api/client';
import type { EventDetail, EventListItem, RsvpStatus, User } from '../types';
import { detailToListItem, isUpcomingEvent } from '../utils/eventMappers';
import { sortEventsByStart } from '../utils/dates';
import { applyDetailRsvp, applyListRsvp, userAsParticipant } from '../utils/rsvp';

function isEventDetail(event: EventListItem | EventDetail): event is EventDetail {
  return 'notGoing' in event.participants;
}

export type RsvpSavePhase = 'idle' | 'saving' | 'saved' | 'error';

export interface RsvpSaveState {
  phase: RsvpSavePhase;
  message?: string;
}

const CACHE_KEY = 'belca_events_cache';
const RSVP_SAVED_MESSAGE_MS = 2500;

function readCache(): EventListItem[] {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    return sortEventsByStart(JSON.parse(raw) as EventListItem[]);
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
  saveRsvp: (
    eventId: string,
    status: RsvpStatus,
    user: User,
    previousStatus: RsvpStatus | null,
  ) => Promise<EventDetail | null>;
  getRsvpSaveState: (eventId: string) => RsvpSaveState;
  waitForEventRsvp: (eventId: string) => Promise<void>;
  mergeFetchedEventDetail: (fetched: EventDetail, user: User) => EventDetail;
  takeSavedEventDetail: (eventId: string) => EventDetail | undefined;
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
  const [rsvpStates, setRsvpStates] = useState<Record<string, RsvpSaveState>>({});

  const inFlightRsvpRef = useRef<Map<string, Promise<EventDetail>>>(new Map());
  const savedDetailRef = useRef<Map<string, EventDetail>>(new Map());
  const rsvpSeqRef = useRef<Map<string, number>>(new Map());
  const refreshSeqRef = useRef(0);
  const savedMessageTimersRef = useRef<Map<string, number>>(new Map());

  const invalidateRefresh = useCallback(() => {
    refreshSeqRef.current += 1;
  }, []);

  const setRsvpState = useCallback((eventId: string, state: RsvpSaveState) => {
    setRsvpStates((prev) => ({ ...prev, [eventId]: state }));
  }, []);

  const clearSavedMessageTimer = useCallback((eventId: string) => {
    const timerId = savedMessageTimersRef.current.get(eventId);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      savedMessageTimersRef.current.delete(eventId);
    }
  }, []);

  const scheduleSavedMessageReset = useCallback(
    (eventId: string) => {
      clearSavedMessageTimer(eventId);
      const timerId = window.setTimeout(() => {
        setRsvpState(eventId, { phase: 'idle' });
        savedMessageTimersRef.current.delete(eventId);
      }, RSVP_SAVED_MESSAGE_MS);
      savedMessageTimersRef.current.set(eventId, timerId);
    },
    [clearSavedMessageTimer, setRsvpState],
  );

  const persist = useCallback((next: EventListItem[]) => {
    const sorted = sortEventsByStart(next);
    setEvents(sorted);
    writeCache(sorted);
  }, []);

  const waitForPendingRsvps = useCallback(async () => {
    const pending = [...inFlightRsvpRef.current.values()];
    if (pending.length > 0) {
      await Promise.allSettled(pending);
    }
  }, []);

  const refresh = useCallback(async () => {
    const seq = ++refreshSeqRef.current;
    setError(null);
    try {
      await waitForPendingRsvps();
      const data = await fetchEvents(listFromDate());
      if (refreshSeqRef.current !== seq) {
        return;
      }
      persist(data);
    } catch (err) {
      if (refreshSeqRef.current !== seq) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Не удалось загрузить события');
    } finally {
      if (refreshSeqRef.current === seq) {
        setInitialLoading(false);
      }
    }
  }, [persist, waitForPendingRsvps]);

  useEffect(() => {
    if (enabled) {
      void refresh();
    }
  }, [enabled, refresh]);

  useEffect(() => {
    const timers = savedMessageTimersRef.current;
    return () => {
      for (const timerId of timers.values()) {
        window.clearTimeout(timerId);
      }
      timers.clear();
    };
  }, []);

  const getEventById = useCallback(
    (id: string) => events.find((event) => event.id === id),
    [events],
  );

  const upsertEvent = useCallback((event: EventListItem | EventDetail) => {
    const item = isEventDetail(event) ? detailToListItem(event) : event;

    invalidateRefresh();
    setEvents((prev) => {
      const next = sortEventsByStart(
        [...prev.filter((existing) => existing.id !== item.id), item].filter(isUpcomingEvent),
      );
      writeCache(next);
      return next;
    });
  }, [invalidateRefresh]);

  const removeEvent = useCallback((id: string) => {
    invalidateRefresh();
    setEvents((prev) => {
      const next = prev.filter((event) => event.id !== id);
      writeCache(next);
      return next;
    });
  }, [invalidateRefresh]);

  const replaceEvents = useCallback((updater: (events: EventListItem[]) => EventListItem[]) => {
    setEvents((prev) => {
      const next = updater(prev);
      writeCache(next);
      return next;
    });
  }, []);

  const waitForEventRsvp = useCallback(async (eventId: string) => {
    const pending = inFlightRsvpRef.current.get(eventId);
    if (pending) {
      await pending;
    }
  }, []);

  const takeSavedEventDetail = useCallback((eventId: string) => {
    const saved = savedDetailRef.current.get(eventId);
    if (saved) {
      savedDetailRef.current.delete(eventId);
    }
    return saved;
  }, []);

  const mergeFetchedEventDetail = useCallback(
    (fetched: EventDetail, user: User): EventDetail => {
      const inFlight = inFlightRsvpRef.current.has(fetched.id);
      const phase = rsvpStates[fetched.id]?.phase;
      if (!inFlight && phase !== 'saving' && phase !== 'saved') {
        return fetched;
      }

      const local = events.find((event) => event.id === fetched.id);
      if (!local?.myRsvp || local.myRsvp === fetched.myRsvp) {
        return fetched;
      }

      return applyDetailRsvp(fetched, userAsParticipant(user), local.myRsvp);
    },
    [events, rsvpStates],
  );

  const saveRsvp = useCallback(
    async (
      eventId: string,
      status: RsvpStatus,
      user: User,
      previousStatus: RsvpStatus | null,
    ): Promise<EventDetail | null> => {
      if (previousStatus === status) {
        return null;
      }

      let snapshot: EventListItem | null = null;

      replaceEvents((prev) => {
        const current = prev.find((event) => event.id === eventId);
        if (!current) {
          return prev;
        }

        snapshot = {
          ...current,
          participants: {
            going: [...current.participants.going],
            maybe: [...current.participants.maybe],
          },
        };

        return prev.map((event) =>
          event.id === eventId ? applyListRsvp(current, userAsParticipant(user), status) : event,
        );
      });

      const seq = (rsvpSeqRef.current.get(eventId) ?? 0) + 1;
      rsvpSeqRef.current.set(eventId, seq);

      invalidateRefresh();
      clearSavedMessageTimer(eventId);
      setRsvpState(eventId, { phase: 'saving', message: 'Записывается в БД…' });

      const promise = updateRsvp(eventId, status);
      inFlightRsvpRef.current.set(eventId, promise);

      try {
        const detail = await promise;

        if (rsvpSeqRef.current.get(eventId) !== seq) {
          return null;
        }

        if (detail.myRsvp !== status) {
          throw new Error(
            `Сервер вернул статус «${detail.myRsvp ?? 'нет'}», ожидался «${status}»`,
          );
        }

        savedDetailRef.current.set(eventId, detail);
        upsertEvent(detail);
        setRsvpState(eventId, { phase: 'saved', message: 'Сохранено в БД' });
        scheduleSavedMessageReset(eventId);
        return detail;
      } catch (err) {
        if (rsvpSeqRef.current.get(eventId) !== seq) {
          return null;
        }

        const message =
          err instanceof ApiError
            ? `Ошибка ${err.status}: ${err.message}`
            : err instanceof Error
              ? err.message
              : 'Не удалось сохранить ответ';

        if (snapshot) {
          const rollback = snapshot;
          replaceEvents((prev) => prev.map((event) => (event.id === eventId ? rollback : event)));
        } else {
          void refresh();
        }
        setRsvpState(eventId, { phase: 'error', message });
        WebApp.showAlert(message);
        return null;
      } finally {
        if (inFlightRsvpRef.current.get(eventId) === promise) {
          inFlightRsvpRef.current.delete(eventId);
        }
      }
    },
    [
      clearSavedMessageTimer,
      invalidateRefresh,
      refresh,
      replaceEvents,
      scheduleSavedMessageReset,
      setRsvpState,
      upsertEvent,
    ],
  );

  const getRsvpSaveState = useCallback(
    (eventId: string): RsvpSaveState => rsvpStates[eventId] ?? { phase: 'idle' },
    [rsvpStates],
  );

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
      saveRsvp,
      getRsvpSaveState,
      waitForEventRsvp,
      mergeFetchedEventDetail,
      takeSavedEventDetail,
    }),
    [
      events,
      initialLoading,
      error,
      refresh,
      getEventById,
      upsertEvent,
      removeEvent,
      replaceEvents,
      saveRsvp,
      getRsvpSaveState,
      waitForEventRsvp,
      mergeFetchedEventDetail,
      takeSavedEventDetail,
    ],
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
