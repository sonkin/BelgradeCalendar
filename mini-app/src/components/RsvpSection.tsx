import { useEvents } from '../context/EventsContext';
import type { RsvpStatus } from '../types';
import { RsvpButtons } from './RsvpButtons';

interface RsvpSectionProps {
  eventId: string;
  value: RsvpStatus | null;
  onChange: (status: RsvpStatus) => void;
  disabled?: boolean;
}

export function RsvpSection({ eventId, value, onChange, disabled }: RsvpSectionProps) {
  const { getRsvpSaveState } = useEvents();
  const { phase } = getRsvpSaveState(eventId);
  const saving = phase === 'saving';

  return (
    <div className="rsvp-section">
      <RsvpButtons
        value={value}
        onChange={onChange}
        disabled={disabled || saving}
      />
      {phase === 'saving' && (
        <p className="rsvp-status rsvp-status--saving" role="status" aria-live="polite">
          Статус сохраняется в базе данных…
        </p>
      )}
      {phase === 'saved' && (
        <p className="rsvp-status rsvp-status--saved" role="status" aria-live="polite">
          <span className="rsvp-status__check" aria-hidden="true">
            ✓
          </span>
          Статус сохранён
        </p>
      )}
    </div>
  );
}
