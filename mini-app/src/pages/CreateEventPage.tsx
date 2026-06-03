import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../api/client';
import { DatetimeField } from '../components/DatetimeField';
import { Layout } from '../components/Layout';
import { useEvents } from '../context/EventsContext';
import { belgradePartsToPayload, defaultBelgradeDatetimeParts } from '../utils/dates';

export function CreateEventPage() {
  const navigate = useNavigate();
  const { upsertEvent } = useEvents();
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState(defaultBelgradeDatetimeParts());
  const [location, setLocation] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const event = await createEvent({
        title: title.trim(),
        ...belgradePartsToPayload(startsAt),
        location: location.trim() || null,
        description: description.trim() || null,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      });

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      window.scrollTo(0, 0);

      upsertEvent(event);
      navigate(`/events/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать событие');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Новое событие" backTo="/">
      <form className="event-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Название *</span>
          <input
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Пицца у Иры"
          />
        </label>

        <DatetimeField value={startsAt} onChange={setStartsAt} />

        <label className="field">
          <span>Место</span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Адрес или название места"
          />
        </label>

        <label className="field">
          <span>Длительность (мин)</span>
          <input
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="120"
          />
        </label>

        <label className="field">
          <span>Описание</span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Дополнительные детали"
          />
        </label>

        {error && <div className="error-box">{error}</div>}

        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Сохранение…' : 'Создать событие'}
        </button>
      </form>
    </Layout>
  );
}
