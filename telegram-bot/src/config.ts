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
  if (!raw?.trim()) return [];
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
  botToken: requireEnv('BOT_TOKEN'),
  botPort: Number(process.env.BOT_PORT ?? 3001),
  webappUrl: process.env.WEBAPP_URL ?? 'https://belca.jtutor.app',
  webhookUrl: process.env.BOT_WEBHOOK_URL ?? '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? '',
  telegramAdminIds: parseAdminIds(process.env.TELEGRAM_ADMIN_IDS),
  botUsername: process.env.BOT_USERNAME ?? 'BelgradeCalendarBot',
  usePolling: process.env.BOT_USE_POLLING === 'true' || !process.env.BOT_WEBHOOK_URL?.startsWith('https://'),
};

export function miniAppDirectLink(startParam?: string): string {
  const base = `https://t.me/${config.botUsername}?startapp`;
  return startParam ? `${base}=${encodeURIComponent(startParam)}` : base;
}
