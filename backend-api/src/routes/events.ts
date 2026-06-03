import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createEvent,
  deleteEvent,
  getEventById,
  listEvents,
  updateEvent,
  clearRsvp,
  upsertRsvp,
} from '../services/eventService.js';
import type { CreateEventBody, RsvpBody, UpdateEventBody } from '../types/index.js';
import { AppError } from '../utils/errors.js';

export const eventsRouter = Router();

eventsRouter.use(requireAuth);

eventsRouter.get('/', async (req, res, next) => {
  try {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const events = await listEvents(from, to, req.user!._id.toString());
    res.json({ events });
  } catch (error) {
    next(error);
  }
});

eventsRouter.get('/:id', async (req, res, next) => {
  try {
    const event = await getEventById(req.params.id, req.user!._id.toString());
    res.json({ event });
  } catch (error) {
    next(error);
  }
});

eventsRouter.post('/', async (req, res, next) => {
  try {
    const body = req.body as CreateEventBody;
    if (!body?.title || !body?.startsAt) {
      throw new AppError(400, 'Поля title и startsAt обязательны');
    }

    const event = await createEvent(body, req.user!);
    res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
});

eventsRouter.patch('/:id', async (req, res, next) => {
  try {
    const event = await updateEvent(req.params.id, req.body as UpdateEventBody, req.user!);
    res.json({ event });
  } catch (error) {
    next(error);
  }
});

eventsRouter.delete('/:id', async (req, res, next) => {
  try {
    await deleteEvent(req.params.id, req.user!);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

eventsRouter.put('/:id/rsvp', async (req, res, next) => {
  try {
    const body = req.body as RsvpBody;
    if (body?.clear) {
      const event = await clearRsvp(req.params.id, req.user!);
      res.json({ event });
      return;
    }

    if (!body?.status) {
      throw new AppError(400, 'Укажите status или clear: true');
    }

    const event = await upsertRsvp(req.params.id, body.status, req.user!);
    res.json({ event });
  } catch (error) {
    next(error);
  }
});

eventsRouter.delete('/:id/rsvp', async (req, res, next) => {
  try {
    const event = await clearRsvp(req.params.id, req.user!);
    res.json({ event });
  } catch (error) {
    next(error);
  }
});
