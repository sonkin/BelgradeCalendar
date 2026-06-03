import { createApp } from './app.js';
import { startTelegramBot, stopTelegramBot } from './bot/start.js';
import { config } from './config.js';
import { connectDb } from './db.js';
import { startScheduler } from './scheduler.js';

async function main() {
  await connectDb();

  const app = createApp();
  await startTelegramBot(app);
  startScheduler();

  const server = app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port} (API + Telegram bot)`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down…`);
    await stopTelegramBot();
    server.close(() => process.exit(0));
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
