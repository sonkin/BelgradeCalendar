import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User, type IUser } from '../models/User.js';
import type { TelegramWebAppUser } from '../types/index.js';
import { toUserDto } from '../utils/userDto.js';
import { validateTelegramInitData } from './telegramAuth.js';

function resolveRole(telegramId: number): 'member' | 'admin' {
  return config.telegramAdminIds.includes(telegramId) ? 'admin' : 'member';
}

export async function upsertUserFromTelegram(telegramUser: TelegramWebAppUser): Promise<IUser> {
  const role = resolveRole(telegramUser.id);

  const user = await User.findOneAndUpdate(
    { telegramId: telegramUser.id },
    {
      telegramId: telegramUser.id,
      username: telegramUser.username ?? null,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name ?? null,
      photoUrl: telegramUser.photo_url ?? null,
      role,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return user;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): { userId: string } {
  const payload = jwt.verify(token, config.jwtSecret) as { userId?: string };
  if (!payload.userId) {
    throw new Error('Invalid token payload');
  }
  return { userId: payload.userId };
}

export async function authenticateWithTelegram(initData: string) {
  const telegramUser = validateTelegramInitData(initData);
  const user = await upsertUserFromTelegram(telegramUser);
  const token = signAccessToken(user._id.toString());

  return {
    token,
    user: toUserDto(user),
  };
}

export async function findUserById(userId: string): Promise<IUser | null> {
  return User.findById(userId);
}
