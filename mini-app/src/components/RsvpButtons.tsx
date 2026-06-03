import type { RsvpStatus } from '../types';

const LABELS: Record<RsvpStatus, string> = {
  going: 'Иду',
  maybe: 'Возможно',
  not_going: 'Не иду',
};

interface RsvpButtonsProps {
  value: RsvpStatus | null;
  onChange: (status: RsvpStatus) => void;
  disabled?: boolean;
}

export function RsvpButtons({ value, onChange, disabled }: RsvpButtonsProps) {
  const statuses: RsvpStatus[] = ['going', 'maybe', 'not_going'];

  return (
    <div className="rsvp-buttons">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          className={`rsvp-btn ${value === status ? 'rsvp-btn--active' : ''}`}
          disabled={disabled}
          onClick={() => {
            if (value !== status) {
              onChange(status);
            }
          }}
        >
          {LABELS[status]}
        </button>
      ))}
    </div>
  );
}
