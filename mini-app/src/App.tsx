import WebApp from '@twa-dev/sdk';
import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { getAuthToken } from './api/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventsProvider } from './context/EventsContext';
import { CalendarSubscribePage } from './pages/CalendarSubscribePage';
import { CreateEventPage } from './pages/CreateEventPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { EventListPage } from './pages/EventListPage';
import { SettingsPage } from './pages/SettingsPage';
import { isStartParamDeepLinkDismissed } from './utils/startParam';
import './styles/app.css';

function StartParamRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const startParam = WebApp.initDataUnsafe.start_param;
    if (!startParam?.startsWith('event_')) return;
    if (isStartParamDeepLinkDismissed()) return;

    const eventId = startParam.slice('event_'.length);
    const targetPath = `/events/${eventId}`;

    if (location.pathname === targetPath) return;

    navigate(targetPath, { replace: true });
  }, [location.pathname, navigate]);

  return null;
}

function AppRoutes() {
  const { loading, error, retry, user } = useAuth();
  const hasToken = Boolean(getAuthToken());

  if (error && !hasToken && !user) {
    return (
      <div className="screen-center">
        <div className="error-box">{error}</div>
        <button type="button" className="btn btn--primary" onClick={retry}>
          Повторить
        </button>
      </div>
    );
  }

  if (loading && !hasToken && !user) {
    return (
      <div className="screen-center">
        <p className="muted">Загрузка…</p>
      </div>
    );
  }

  return (
    <EventsProvider enabled={Boolean(user) || hasToken}>
      <StartParamRedirect />
      <Routes>
        <Route path="/" element={<EventListPage />} />
        <Route path="/calendar/subscribe" element={<CalendarSubscribePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<Navigate to="/settings" replace />} />
        <Route path="/events/new" element={<CreateEventPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </EventsProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
