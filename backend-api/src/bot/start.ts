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
  console.log('Telegram bot: webhook →', config.botWebhookUrl);
  if (info.last_error_message) {
    console.warn('Webhook last error:', info.last_error_message);
  }

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
