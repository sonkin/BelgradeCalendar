import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { calendarRouter } from './routes/calendar.js';
import { eventsRouter } from './routes/events.js';
import { meRouter } from './routes/me.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/auth', authRouter);
  app.use('/me', meRouter);
  app.use('/events', eventsRouter);
  app.use('/calendar', calendarRouter);

  app.use(errorHandler);

  return app;
}
