import type { IUser } from '../models/User.js';
import type { ParticipantUserDto } from '../types/index.js';

export function toParticipantUserDto(user: IUser): ParticipantUserDto {
  return {
    id: user._id.toString(),
    telegramId: user.telegramId,
    firstName: user.firstName,
    lastName: user.lastName ?? null,
    username: user.username ?? null,
    displayName: user.displayName ?? null,
    photoUrl: user.photoUrl ?? null,
  };
}
