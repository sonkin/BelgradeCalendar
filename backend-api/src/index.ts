import { createApp } from './app.js';
import { config } from './config.js';
import { connectDb } from './db.js';

async function main() {
  await connectDb();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`API listening on port ${config.port}`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
