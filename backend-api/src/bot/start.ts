import type { Express } from 'express';
import type { Bot } from 'grammy';
import { webhookCallback } from 'grammy';
import { config } from '../config.js';
import { createInteractiveBot, registerBotCommands, setupMenuButton } from './interactiveBot.js';

let activeBot: Bot | null = null;

function isPollingConflict(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'error_code' in error &&
    (error as { error_code: number }).error_code === 409
  );
}

function logPollingConflict(): void {
  console.error(
    'Telegram bot: конфликт polling (409). Запущен второй экземпляр бота.\n' +
      '  → Остановите лишний терминал с npm run dev (backend-api)\n' +
      '  → Или отключите polling на prod: BOT_USE_POLLING=false и только webhook',
  );
}

export async function stopTelegramBot(): Promise<void> {
  if (!activeBot) return;

  try {
    if (activeBot.isRunning()) {
      await activeBot.stop();
      console.log('Telegram bot stopped');
    }
  } catch (error) {
    console.error('Failed to stop Telegram bot:', error);
  } finally {
    activeBot = null;
  }
}

export async function startTelegramBot(app: Express): Promise<void> {
  await stopTelegramBot();

  const bot = createInteractiveBot();
  activeBot = bot;

  await registerBotCommands(bot);
  await setupMenuButton(bot);
  console.log('Menu button configured →', config.webappUrl);
  console.log(
    `Telegram bot mode: ${config.botUsePolling ? 'polling' : 'webhook'} (BOT_USE_POLLING=${process.env.BOT_USE_POLLING ?? 'unset'}, BOT_WEBHOOK_URL=${config.botWebhookUrl || 'unset'})`,
  );

  if (config.botUsePolling) {
    await bot.api.deleteWebhook({ drop_pending_updates: true });

    const webhook = await bot.api.getWebhookInfo();
    if (webhook.url) {
      console.warn(`Webhook был сброшен (был: ${webhook.url})`);
    }

    console.log('Telegram bot: polling mode');
    void bot
      .start({
        onStart: () => console.log('Telegram bot is polling for updates'),
      })
      .catch((error) => {
        if (isPollingConflict(error)) {
          logPollingConflict();
          return;
        }
        console.error('Telegram bot polling failed:', error);
      });
    return;
  }

  if (!config.botWebhookUrl.startsWith('https://')) {
    console.warn('BOT_WEBHOOK_URL is not HTTPS — bot commands disabled');
    return;
  }

  await bot.api.setWebhook(config.botWebhookUrl, {
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: false,
  });

  const info = await bot.api.getWebhookInfo();
  console.log('Telegram bot: webhook registered →', info.url || config.botWebhookUrl);
  console.log('Express route: POST /bot/webhook (public: /api/bot/webhook)');
  if (!info.url) {
    console.error('setWebhook did not stick — check BOT_TOKEN and pm2 logs');
  }
  if (info.last_error_message) {
    console.warn('Webhook last error:', info.last_error_message);
  }
  if (info.pending_update_count > 0) {
    console.log(`Webhook pending updates: ${info.pending_update_count}`);
  }

  app.get('/bot/webhook', (_req, res) => {
    res.json({
      ok: true,
      hint: 'Telegram sends POST here. Public URL should be https://<domain>/api/bot/webhook',
    });
  });

  app.use('/bot/webhook', (req, res, next) => {
    if (req.method === 'POST') {
      const updateId =
        typeof req.body === 'object' && req.body && 'update_id' in req.body
          ? String((req.body as { update_id: number }).update_id)
          : '?';
      console.log('Telegram webhook update', updateId);
    }
    next();
  });
  app.use('/bot/webhook', webhookCallback(bot, 'express'));
}
