import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppBrand } from '../components/AppBrand';
import { EventListByDay } from '../components/EventListByDay';
import { HomeHeaderActions } from '../components/HomeHeaderActions';
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
import { useListScrollRestoration } from '../utils/scrollRestoration';

export function EventListPage() {
  const location = useLocation();
  const { user } = useAuth();
  const { events, initialLoading, error, refresh, saveRsvp, toggleGoing } = useEvents();

  const monthKeys = useMemo(() => listSelectableMonthKeys(), []);
  const defaultMonthKey = useMemo(() => currentBelgradeMonthKey(), []);

  const [viewMode, setViewMode] = useState<ListViewMode>('full');
  const [selectedMonthKey, setSelectedMonthKey] = useState(defaultMonthKey);

  useEffect(() => {
    if (!user) return;
    setViewMode(readListViewMode(user.id));
    setSelectedMonthKey(readSelectedMonthKey(user.id, defaultMonthKey));
  }, [user, defaultMonthKey]);

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

  const handleViewModeChange = useCallback(
    (mode: ListViewMode) => {
      setViewMode(mode);
      if (user) {
        writeListViewMode(user.id, mode);
      }
      if (mode === 'monthly' && monthKeys.indexOf(selectedMonthKey) < 0) {
        const current = defaultMonthKey;
        setSelectedMonthKey(current);
        if (user) {
          writeSelectedMonthKey(user.id, current);
        }
      }
    },
    [defaultMonthKey, monthKeys, selectedMonthKey, user],
  );

  const handleMonthKeyChange = useCallback(
    (monthKeyValue: string) => {
      setSelectedMonthKey(monthKeyValue);
      if (user) {
        writeSelectedMonthKey(user.id, monthKeyValue);
      }
    },
    [user],
  );

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

  const handleToggleGoing = useCallback(
    (eventId: string, myRsvp: RsvpStatus | null) => {
      if (!user) return;
      void toggleGoing(eventId, user, myRsvp);
    },
    [toggleGoing, user],
  );

  const showEmpty = !initialLoading && !error && events.length === 0;
  const showMonthEmpty =
    viewMode === 'monthly' && !showEmpty && events.length > 0 && visibleEvents.length === 0;

  return (
    <Layout brand={<AppBrand />} action={<HomeHeaderActions />}>
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
      <EventListByDay
        events={visibleEvents}
        viewMode={viewMode}
        onRsvpChange={handleRsvpChange}
        onToggleGoing={handleToggleGoing}
      />
    </Layout>
  );
}
