import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { updateMe } from '../api/client';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getDisplayName, getTelegramName } from '../utils/userDisplay';

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? '');
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const updated = await updateMe({ displayName: displayName.trim() || null });
      refreshUser(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Layout title="Настройки" backTo="/">
        <p className="muted">Загрузка…</p>
      </Layout>
    );
  }

  const telegramName = getTelegramName(user);
  const currentName = getDisplayName(user);

  return (
    <Layout title="Настройки" backTo="/">
      <section className="settings-section">
        <h2 className="settings-section__title">Имя в календаре</h2>
        <p className="settings-section__hint">
          Так вас увидят другие в списках участников. Сейчас: {currentName}. Имя из Telegram:{' '}
          {telegramName}
          {user.username ? ` (@${user.username.replace(/^@/, '')})` : ''}.
        </p>

        <form className="event-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Отображаемое имя</span>
            <input
              type="text"
              maxLength={100}
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setSaved(false);
              }}
              placeholder={telegramName}
            />
          </label>

          {error && <div className="error-box">{error}</div>}
          {saved && !error && <p className="settings-section__saved">Сохранено</p>}

          <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить имя'}
          </button>
        </form>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">Календарь</h2>
        <p className="settings-section__hint">
          Подпишитесь на события в Apple Calendar или Google Calendar — они будут обновляться
          автоматически.
        </p>
        <Link to="/calendar/subscribe" className="btn btn--secondary btn--block settings-section__link">
          📅 Синхронизация с Apple / Google Calendar
        </Link>
      </section>
    </Layout>
  );
}
