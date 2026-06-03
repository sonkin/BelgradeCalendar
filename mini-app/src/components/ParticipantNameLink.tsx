import type { ParticipantUser } from '../types';
import { getDisplayName, openTelegramProfile } from '../utils/userDisplay';

interface ParticipantNameLinkProps {
  user: ParticipantUser;
}

export function ParticipantNameLink({ user }: ParticipantNameLinkProps) {
  return (
    <button
      type="button"
      className="participant-name-link"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openTelegramProfile(user);
      }}
    >
      {getDisplayName(user)}
    </button>
  );
}
