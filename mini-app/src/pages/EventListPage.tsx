import { useCallback, useMemo } from 'react';
import WebApp from '@twa-dev/sdk';
import { Link, useLocation } from 'react-router-dom';
import { updateRsvp } from '../api/client';
import { DaySectionHeader } from '../components/DaySectionHeader';
import { EventCard } from '../components/EventCard';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import type { EventListItem, RsvpStatus } from '../types';
import { groupEventsByDay } from '../utils/dates';
import { applyListRsvp, userAsParticipant } from '../utils/rsvp';
import { useListScrollRestoration, saveListScrollPosition } from '../utils/scrollRestoration';

export function EventListPage() {
  const location = useLocation();
  const { user } = useAuth();
  const { events, initialLoading, error, refresh, replaceEvents } = useEvents();

  const grouped = useMemo(() => groupEventsByDay(events), [events]);
  const contentReady = events.length > 0 || (!initialLoading && !error);

  useListScrollRestoration(contentReady, location.key);

  const handleRsvpChange = useCallback(
    async (eventId: string, status: RsvpStatus) => {
      if (!user) return;

      let snapshot: EventListItem | null = null;

      replaceEvents((prev) => {
        const current = prev.find((event) => event.id === eventId);
        if (!current || current.myRsvp === status) return prev;

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

      if (!snapshot) return;

      try {
        await updateRsvp(eventId, status);
      } catch {
        const rollback = snapshot;
        replaceEvents((prev) => prev.map((event) => (event.id === eventId ? rollback : event)));
        WebApp.showAlert('Не удалось сохранить ответ');
      }
    },
    [replaceEvents, user],
  );

  const sortedGroups = useMemo(() => {
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [grouped]);

  const showEmpty = !initialLoading && !error && events.length === 0;

  return (
    <Layout
      action={
        <div className="layout__header-actions">
          <Link
            to="/events/new"
            className="btn btn--primary btn--small btn--create"
            onClick={saveListScrollPosition}
          >
            + Создать новое событие
          </Link>
          <Link
            to="/settings"
            className="btn btn--secondary btn--small btn--settings"
            onClick={saveListScrollPosition}
          >
            ⚙ Настройки
          </Link>
        </div>
      }
    >
      {initialLoading && events.length === 0 && <p className="muted">Загрузка…</p>}
      {error && events.length === 0 && (
        <div className="error-box">
          {error}
          <button type="button" className="btn btn--ghost" onClick={() => void refresh()}>
            Повторить
          </button>
        </div>
      )}
      {showEmpty && (
        <div className="empty-state">
          <p>Пока нет событий</p>
          <Link to="/events/new" className="btn btn--primary">
            Создать первое событие
          </Link>
        </div>
      )}
      {sortedGroups.map(([key, dayEvents]) => (
        <section key={key} className="day-section">
          <DaySectionHeader startsAt={dayEvents[0].startsAt} />
          {dayEvents.map((event) => (
            <EventCard key={event.id} event={event} onRsvpChange={handleRsvpChange} />
          ))}
        </section>
      ))}
    </Layout>
  );
}
