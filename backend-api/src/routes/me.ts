import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getCalendarFeedsForUser,
  regenerateCalendarFeedToken,
} from '../services/calendarService.js';
import { updateMeProfile } from '../services/profileService.js';
import type { UpdateMeBody } from '../types/index.js';
import { toUserDto } from '../utils/userDto.js';

export const meRouter = Router();

meRouter.get('/', requireAuth, (req, res) => {
  res.json({ user: toUserDto(req.user!) });
});

meRouter.patch('/', requireAuth, async (req, res, next) => {
  try {
    const user = await updateMeProfile(req.user!, req.body as UpdateMeBody);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

meRouter.get('/calendar-feeds', requireAuth, async (req, res, next) => {
  try {
    const feeds = await getCalendarFeedsForUser(req.user!);
    res.json(feeds);
  } catch (error) {
    next(error);
  }
});

meRouter.post('/calendar-feeds/reset', requireAuth, async (req, res, next) => {
  try {
    await regenerateCalendarFeedToken(req.user!);
    const feeds = await getCalendarFeedsForUser(req.user!);
    res.json(feeds);
  } catch (error) {
    next(error);
  }
});
