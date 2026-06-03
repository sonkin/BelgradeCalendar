import { useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DaySectionHeader } from '../components/DaySectionHeader';
import { EventCard } from '../components/EventCard';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import type { RsvpStatus } from '../types';
import { groupEventsByDay } from '../utils/dates';
import { useListScrollRestoration, saveListScrollPosition } from '../utils/scrollRestoration';

export function EventListPage() {
  const location = useLocation();
  const { user } = useAuth();
  const { events, initialLoading, error, refresh, saveRsvp } = useEvents();

  const grouped = useMemo(() => groupEventsByDay(events), [events]);
  const contentReady = events.length > 0 || (!initialLoading && !error);

  useListScrollRestoration(contentReady, location.key);

  const handleRsvpChange = useCallback(
    (eventId: string, status: RsvpStatus) => {
      if (!user) return;
      void saveRsvp(eventId, status, user);
    },
    [saveRsvp, user],
  );

  const sortedGroups = useMemo(() => {
    return [...grouped.entries()].sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
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
