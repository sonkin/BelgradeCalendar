import crypto from 'node:crypto';
import { config } from '../config.js';
import type { TelegramWebAppUser } from '../types/index.js';
import { AppError } from '../utils/errors.js';

const INIT_DATA_MAX_AGE_SECONDS = 86400;

export function validateTelegramInitData(initData: string): TelegramWebAppUser {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');

  if (!hash) {
    throw new AppError(401, 'Некорректные данные Telegram: отсутствует hash');
  }

  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(config.botToken).digest();
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculatedHash !== hash) {
    throw new AppError(401, 'Некорректная подпись Telegram initData');
  }

  const authDateRaw = params.get('auth_date');
  if (authDateRaw) {
    const authDate = Number(authDateRaw);
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(authDate) || now - authDate > INIT_DATA_MAX_AGE_SECONDS) {
      throw new AppError(401, 'Данные Telegram устарели, откройте приложение заново');
    }
  }

  const userRaw = params.get('user');
  if (!userRaw) {
    throw new AppError(401, 'Некорректные данные Telegram: отсутствует user');
  }

  let user: TelegramWebAppUser;
  try {
    user = JSON.parse(userRaw) as TelegramWebAppUser;
  } catch {
    throw new AppError(401, 'Некорректные данные Telegram: user не JSON');
  }

  if (!user.id || !user.first_name) {
    throw new AppError(401, 'Некорректные данные Telegram: неполный профиль user');
  }

  return user;
}
