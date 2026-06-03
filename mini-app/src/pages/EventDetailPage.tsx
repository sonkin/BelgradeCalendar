import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteEvent, fetchEvent, updateEvent } from '../api/client';
import { EventDateTime } from '../components/EventDateTime';
import { DatetimeField } from '../components/DatetimeField';
import { Layout } from '../components/Layout';
import { ParticipantNameLink } from '../components/ParticipantNameLink';
import { RsvpSection } from '../components/RsvpSection';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import type { EventDetail, RsvpStatus } from '../types';
import { belgradePartsToPayload, formatDuration, isoToBelgradeParts } from '../utils/dates';
import { listItemToDetail } from '../utils/eventMappers';
import { applyDetailRsvp, userAsParticipant } from '../utils/rsvp';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getEventById,
    upsertEvent,
    removeEvent,
    saveRsvp,
    waitForEventRsvp,
    mergeFetchedEventDetail,
    takeSavedEventDetail,
  } = useEvents();

  const cached = id ? getEventById(id) : undefined;
  const [event, setEvent] = useState<EventDetail | null>(() =>
    cached ? listItemToDetail(cached) : null,
  );
  const [syncError, setSyncError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editStartsAt, setEditStartsAt] = useState({ date: '', time: '' });
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const cachedItem = getEventById(id);
    setEvent(cachedItem ? listItemToDetail(cachedItem) : null);
    setSyncError(null);

    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchEvent(id);
        if (cancelled) return;

        await waitForEventRsvp(id);
        if (cancelled) return;

        const saved = takeSavedEventDetail(id);
        const next = saved ?? (user ? mergeFetchedEventDetail(data, user) : data);

        setEvent(next);
        upsertEvent(next);
      } catch (err) {
        if (cancelled) return;
        setEvent((current) => {
          if (!current) {
            setSyncError(err instanceof Error ? err.message : 'Событие не найдено');
          }
          return current;
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, mergeFetchedEventDetail, takeSavedEventDetail, upsertEvent, user, waitForEventRsvp]);

  const canModify =
    user && event && (user.role === 'admin' || user.id === event.createdBy.id);

  const startEditing = () => {
    if (!event) return;
    setEditTitle(event.title);
    setEditStartsAt(isoToBelgradeParts(event.startsAt, event.timeUnset));
    setEditDescription(event.description ?? '');
    setEditError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditError(null);
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !event) return;

    const title = editTitle.trim();
    if (!title) {
      setEditError('Укажите название');
      return;
    }

    setSaving(true);
    setEditError(null);

    try {
      const updated = await updateEvent(id, {
        title,
        ...belgradePartsToPayload(editStartsAt),
        description: editDescription.trim() || null,
      });
      setEvent(updated);
      upsertEvent(updated);
      setEditing(false);

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const handleRsvp = async (status: RsvpStatus) => {
    if (!id || !event || !user || event.myRsvp === status) return;

    setEvent((current) =>
      current ? applyDetailRsvp(current, userAsParticipant(user), status) : current,
    );

    const updated = await saveRsvp(id, status, user, event.myRsvp);
    if (updated) {
      setEvent(updated);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Удалить это событие?')) return;
    setDeleting(true);
    try {
      await deleteEvent(id);
      removeEvent(id);
      navigate('/');
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Не удалось удалить');
      setDeleting(false);
    }
  };

  if (!event) {
    return (
      <Layout title="Событие" backTo="/">
        {syncError ? (
          <div className="error-box">{syncError}</div>
        ) : (
          <p className="muted">Загрузка…</p>
        )}
      </Layout>
    );
  }

  const duration = formatDuration(event.durationMinutes);

  return (
    <Layout title={editing ? 'Редактирование' : event.title} backTo="/">
      <div className="event-detail">
        {editing ? (
          <form className="event-form event-detail__edit-form" onSubmit={handleSaveEdit}>
            <label className="field">
              <span>Название *</span>
              <input
                type="text"
                required
                maxLength={200}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </label>

            <DatetimeField value={editStartsAt} onChange={setEditStartsAt} />

            <label className="field">
              <span>Описание</span>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Дополнительные детали"
              />
            </label>

            {editError && <div className="error-box">{editError}</div>}

            <div className="event-detail__edit-actions">
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
              <button type="button" className="btn btn--ghost" disabled={saving} onClick={cancelEditing}>
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <>
            <EventDateTime
              startsAt={event.startsAt}
              timeUnset={event.timeUnset}
              className="event-detail__datetime"
            />
            {duration && <p className="event-detail__duration">⏱ {duration}</p>}
            {event.location && <p className="event-detail__location">📍 {event.location}</p>}
            {event.description && <p className="event-detail__description">{event.description}</p>}
            <p className="event-detail__author">
              Организатор: <ParticipantNameLink user={event.createdBy} />
            </p>
          </>
        )}

        <section className="participants-section">
          <h3>Ваш ответ</h3>
          <RsvpSection eventId={event.id} value={event.myRsvp} onChange={handleRsvp} />
        </section>

        {event.participants.going.length > 0 && (
          <section className="participants-section">
            <h3>Идут ({event.participants.going.length})</h3>
            <ul className="participants-list">
              {event.participants.going.map((p) => (
                <li key={p.id}>
                  <ParticipantNameLink user={p} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {event.participants.maybe.length > 0 && (
          <section className="participants-section">
            <h3>Возможно ({event.participants.maybe.length})</h3>
            <ul className="participants-list">
              {event.participants.maybe.map((p) => (
                <li key={p.id}>
                  <ParticipantNameLink user={p} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {canModify && !editing && (
          <div className="event-detail__owner-actions">
            <button type="button" className="btn btn--secondary" onClick={startEditing}>
              Редактировать
            </button>
            <button
              type="button"
              className="btn btn--danger"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? 'Удаление…' : 'Удалить событие'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
