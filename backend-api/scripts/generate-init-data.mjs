#!/usr/bin/env node
/**
 * Generates valid Telegram initData for local API testing.
 * Usage: node scripts/generate-init-data.mjs [telegramId]
 */
import crypto from 'node:crypto';

const botToken = process.env.BOT_TOKEN;
if (!botToken) {
  console.error('Set BOT_TOKEN env var');
  process.exit(1);
}

const telegramId = Number(process.argv[2] ?? 123456789);
const user = JSON.stringify({
  id: telegramId,
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
});

const params = new URLSearchParams({
  user,
  auth_date: String(Math.floor(Date.now() / 1000)),
});

const dataCheckString = [...params.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

params.set('hash', hash);
console.log(params.toString());
