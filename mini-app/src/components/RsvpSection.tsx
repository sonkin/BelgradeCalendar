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
  const { phase, message } = getRsvpSaveState(eventId);
  const saving = phase === 'saving';

  return (
    <div className="rsvp-section">
      <RsvpButtons
        value={value}
        onChange={onChange}
        disabled={disabled || saving}
      />
      {phase !== 'idle' && message && (
        <p
          className={`rsvp-status rsvp-status--${phase}`}
          role="status"
          aria-live="polite"
        >
          {phase === 'saved' && (
            <span className="rsvp-status__check" aria-hidden="true">
              ✓
            </span>
          )}
          {message}
        </p>
      )}
    </div>
  );
}
