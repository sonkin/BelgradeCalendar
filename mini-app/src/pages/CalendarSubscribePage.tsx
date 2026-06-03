import { useCallback, useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { fetchCalendarFeeds, resetCalendarFeeds } from '../api/client';
import { Layout } from '../components/Layout';
import type { CalendarFeeds } from '../types';
import {
  copyForGoogleCalendar,
  getAppleCalendarButtonLabel,
  getGoogleCalendarButtonLabel,
  isDesktopTelegramPlatform,
  isIosPlatform,
  subscribeAppleCalendar,
} from '../utils/calendarSubscribe';

function FeedSection({
  title,
  description,
  httpsUrl,
  webcalUrl,
}: {
  title: string;
  description: string;
  httpsUrl: string;
  webcalUrl: string;
}) {
  return (
    <section className="calendar-feed">
      <h2 className="calendar-feed__title">{title}</h2>
      <p className="calendar-feed__description">{description}</p>
      <div className="calendar-feed__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void subscribeAppleCalendar(webcalUrl, httpsUrl)}
        >
          {getAppleCalendarButtonLabel()}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => void copyForGoogleCalendar(httpsUrl)}
        >
          {getGoogleCalendarButtonLabel()}
        </button>
      </div>
    </section>
  );
}

export function CalendarSubscribePage() {
  const [feeds, setFeeds] = useState<CalendarFeeds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const loadFeeds = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchCalendarFeeds();
      setFeeds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить ссылки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeeds();
  }, [loadFeeds]);

  const handleReset = async () => {
    if (!window.confirm('Сбросить ссылки? Старые перестанут работать в Apple/Google Calendar.')) {
      return;
    }

    setResetting(true);
    setError(null);
    try {
      const data = await resetCalendarFeeds();
      setFeeds(data);
      WebApp.showAlert('Ссылки обновлены. Добавьте календарь заново.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сбросить ссылки');
    } finally {
      setResetting(false);
    }
  };

  return (
    <Layout title="Синхронизация с календарём" backTo="/settings">
      <div className="calendar-subscribe">
        <p className="calendar-subscribe__intro">
          Добавьте персональную подписку в Apple Calendar или Google Calendar. События
          обновляются автоматически (обычно раз в несколько часов).
        </p>

        {loading && <p className="muted">Загрузка…</p>}
        {error && (
          <div className="error-box">
            {error}
            <button type="button" className="btn btn--ghost" onClick={() => void loadFeeds()}>
              Повторить
            </button>
          </div>
        )}

        {feeds && (
          <>
            <FeedSection
              title="Подписаться на все события"
              description="Все будущие события Belgrade Friends Calendar."
              httpsUrl={feeds.allUrl}
              webcalUrl={feeds.webcalAllUrl}
            />

            <FeedSection
              title="Подписаться на события «Иду»"
              description="Только события, на которые вы отметили «Иду»."
              httpsUrl={feeds.goingUrl}
              webcalUrl={feeds.webcalGoingUrl}
            />

            <section className="calendar-subscribe__help">
              <h3>Apple Calendar</h3>
              {isIosPlatform() ? (
                <p>
                  Нажмите «Подписаться в Apple Calendar» — откроется Safari или ссылка скопируется для
                  ручной вставки в Calendar.
                </p>
              ) : isDesktopTelegramPlatform() ? (
                <p>
                  Нажмите «Скопировать для Apple Calendar», затем Calendar → Файл → Новая подписка на
                  календарь → вставьте ссылку.
                </p>
              ) : (
                <p>Используйте кнопку для Apple Calendar на вашем устройстве.</p>
              )}

              <h3>Google Calendar</h3>
              <p>
                {WebApp.platform === 'android' || WebApp.platform === 'android_x'
                  ? 'Нажмите «Открыть в Google Calendar» или скопируйте ссылку в настройках календаря.'
                  : 'Нажмите «Скопировать для Google Calendar», затем Настройки → Добавить календарь → Из URL.'}
              </p>
            </section>

            <button
              type="button"
              className="btn btn--ghost calendar-subscribe__reset"
              disabled={resetting}
              onClick={handleReset}
            >
              {resetting ? 'Сброс…' : 'Сбросить мои ссылки'}
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
