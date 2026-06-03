import express from 'express';
import { webhookCallback } from 'grammy';
import { createBot, setupMenuButton } from './bot.js';
import { config } from './config.js';

async function main() {
  const bot = createBot();

  await setupMenuButton(bot);
  console.log('Menu button configured →', config.webappUrl);

  if (config.usePolling) {
    await bot.api.deleteWebhook({ drop_pending_updates: false });
    console.log('Starting bot in polling mode…');
    bot.start({
      onStart: () => console.log('Bot is polling for updates'),
    });
    return;
  }

  await bot.api.setWebhook(config.webhookUrl);
  console.log('Webhook set →', config.webhookUrl);

  const app = express();
  app.use(express.json());
  app.use(webhookCallback(bot, 'express'));
  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.listen(config.botPort, () => {
    console.log(`Bot webhook listening on port ${config.botPort}`);
  });
}

main().catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
