import type { IUser } from '../models/User.js';
import type { UserDto } from '../types/index.js';

export function toUserDto(user: IUser): UserDto {
  return {
    id: user._id.toString(),
    telegramId: user.telegramId,
    username: user.username ?? null,
    firstName: user.firstName,
    lastName: user.lastName ?? null,
    displayName: user.displayName ?? null,
    photoUrl: user.photoUrl ?? null,
    role: user.role,
  };
}
