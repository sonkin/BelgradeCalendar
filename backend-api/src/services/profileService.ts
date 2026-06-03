import type { IUser } from '../models/User.js';
import type { UpdateMeBody, UserDto } from '../types/index.js';
import { AppError } from '../utils/errors.js';
import { toUserDto } from '../utils/userDto.js';

function normalizeDisplayName(value: string | null | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return null;
  }

  if (trimmed.length > 100) {
    throw new AppError(400, 'Имя не может быть длиннее 100 символов');
  }

  return trimmed;
}

export async function updateMeProfile(user: IUser, body: UpdateMeBody): Promise<UserDto> {
  if (body.displayName !== undefined) {
    user.displayName = normalizeDisplayName(body.displayName);
  }

  await user.save();
  return toUserDto(user);
}
