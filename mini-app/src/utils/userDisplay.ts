import WebApp from '@twa-dev/sdk';
import type { ParticipantUser, User } from '../types';

type NameSource = Pick<ParticipantUser, 'displayName' | 'firstName' | 'lastName'>;
type ProfileSource = Pick<ParticipantUser, 'username' | 'telegramId'>;

export function getDisplayName(user: NameSource): string {
  const custom = user.displayName?.trim();
  if (custom) {
    return custom;
  }

  return [user.firstName, user.lastName].filter(Boolean).join(' ');
}

export function getTelegramName(user: User): string {
  return [user.firstName, user.lastName].filter(Boolean).join(' ');
}

export function getTelegramProfileUrl(user: ProfileSource): string {
  if (user.username) {
    return `https://t.me/${user.username.replace(/^@/, '')}`;
  }

  return `https://t.me/user?id=${user.telegramId}`;
}

export function openTelegramProfile(user: ProfileSource): void {
  WebApp.openTelegramLink(getTelegramProfileUrl(user));
}
