import { Router } from 'express';
import { getCalendarFeedByToken, parseCalendarFeedFilter } from '../services/calendarService.js';

export const calendarRouter = Router();

calendarRouter.get('/:token/:filter', async (req, res, next) => {
  try {
    const filter = parseCalendarFeedFilter(req.params.filter);
    const ics = await getCalendarFeedByToken(req.params.token, filter);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.send(ics);
  } catch (error) {
    next(error);
  }
});
