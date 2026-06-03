import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseAdminIds(raw: string | undefined): number[] {
  if (!raw?.trim()) {
    return [];
  }

  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => {
      const parsed = Number(id);
      if (!Number.isInteger(parsed)) {
        throw new Error(`Invalid TELEGRAM_ADMIN_IDS entry: ${id}`);
      }
      return parsed;
    });
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
  mongodbUri: requireEnv('MONGODB_URI'),
  botToken: requireEnv('BOT_TOKEN'),
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? '',
  telegramAdminIds: parseAdminIds(process.env.TELEGRAM_ADMIN_IDS),
  webappUrl: process.env.WEBAPP_URL ?? 'https://belca.jtutor.app',
  apiPublicUrl: (process.env.API_PUBLIC_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  botUsername: process.env.BOT_USERNAME ?? 'BelgradeCalendarBot',
  timezone: process.env.TZ ?? 'Europe/Belgrade',
};
