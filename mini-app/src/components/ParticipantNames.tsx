import type { ParticipantUser } from '../types';
import { ParticipantNameLink } from './ParticipantNameLink';

interface ParticipantNamesProps {
  users: ParticipantUser[];
}

export function ParticipantNames({ users }: ParticipantNamesProps) {
  if (users.length === 0) {
    return null;
  }

  return (
    <>
      {users.map((user, index) => (
        <span key={user.id}>
          {index > 0 && ', '}
          <ParticipantNameLink user={user} />
        </span>
      ))}
    </>
  );
}
