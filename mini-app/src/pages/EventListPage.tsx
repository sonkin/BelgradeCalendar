import { useCallback, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { EventListByDay } from '../components/EventListByDay';
import { Layout } from '../components/Layout';
import { ListViewTabs } from '../components/ListViewTabs';
import { MonthNavigator } from '../components/MonthNavigator';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import type { RsvpStatus } from '../types';
import {
  currentBelgradeMonthKey,
  filterEventsByMonthKey,
  formatMonthLabel,
  listSelectableMonthKeys,
} from '../utils/dates';
import {
  readListViewMode,
  readSelectedMonthKey,
  writeListViewMode,
  writeSelectedMonthKey,
  type ListViewMode,
} from '../utils/listView';
import { useListScrollRestoration, saveListScrollPosition } from '../utils/scrollRestoration';

export function EventListPage() {
  const location = useLocation();
  const { user } = useAuth();
  const { events, initialLoading, error, refresh, saveRsvp } = useEvents();

  const monthKeys = useMemo(() => listSelectableMonthKeys(), []);
  const defaultMonthKey = useMemo(() => currentBelgradeMonthKey(), []);

  const [viewMode, setViewMode] = useState<ListViewMode>(() => readListViewMode());
  const [selectedMonthKey, setSelectedMonthKey] = useState(() =>
    readSelectedMonthKey(defaultMonthKey),
  );

  const monthIndex = monthKeys.indexOf(selectedMonthKey);
  const safeMonthIndex = monthIndex >= 0 ? monthIndex : 0;
  const activeMonthKey = monthKeys[safeMonthIndex] ?? defaultMonthKey;

  const visibleEvents = useMemo(() => {
    if (viewMode !== 'monthly') {
      return events;
    }
    return filterEventsByMonthKey(events, activeMonthKey);
  }, [events, viewMode, activeMonthKey]);

  const contentReady = events.length > 0 || (!initialLoading && !error);

  useListScrollRestoration(contentReady, location.key);

  const handleViewModeChange = useCallback((mode: ListViewMode) => {
    setViewMode(mode);
    writeListViewMode(mode);
    if (mode === 'monthly' && monthKeys.indexOf(selectedMonthKey) < 0) {
      const current = defaultMonthKey;
      setSelectedMonthKey(current);
      writeSelectedMonthKey(current);
    }
  }, [defaultMonthKey, monthKeys, selectedMonthKey]);

  const handleMonthKeyChange = useCallback((monthKey: string) => {
    setSelectedMonthKey(monthKey);
    writeSelectedMonthKey(monthKey);
  }, []);

  const handleMonthPrev = useCallback(() => {
    if (safeMonthIndex <= 0) return;
    handleMonthKeyChange(monthKeys[safeMonthIndex - 1]);
  }, [handleMonthKeyChange, monthKeys, safeMonthIndex]);

  const handleMonthNext = useCallback(() => {
    if (safeMonthIndex >= monthKeys.length - 1) return;
    handleMonthKeyChange(monthKeys[safeMonthIndex + 1]);
  }, [handleMonthKeyChange, monthKeys, safeMonthIndex]);

  const handleRsvpChange = useCallback(
    (eventId: string, status: RsvpStatus, previousStatus: RsvpStatus | null) => {
      if (!user) return;
      void saveRsvp(eventId, status, user, previousStatus);
    },
    [saveRsvp, user],
  );

  const showEmpty = !initialLoading && !error && events.length === 0;
  const showMonthEmpty =
    viewMode === 'monthly' && !showEmpty && events.length > 0 && visibleEvents.length === 0;

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
      <ListViewTabs mode={viewMode} onChange={handleViewModeChange} />

      {viewMode === 'monthly' && (
        <MonthNavigator
          monthKey={activeMonthKey}
          monthKeys={monthKeys}
          onMonthKeyChange={handleMonthKeyChange}
          onPrev={handleMonthPrev}
          onNext={handleMonthNext}
          canGoPrev={safeMonthIndex > 0}
          canGoNext={safeMonthIndex < monthKeys.length - 1}
        />
      )}

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
      {showMonthEmpty && (
        <div className="empty-state empty-state--inline">
          <p>Нет событий в {formatMonthLabel(activeMonthKey)}</p>
        </div>
      )}
      <EventListByDay events={visibleEvents} viewMode={viewMode} onRsvpChange={handleRsvpChange} />
    </Layout>
  );
}
