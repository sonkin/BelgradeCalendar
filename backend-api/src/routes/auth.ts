import { Router } from 'express';
import { authenticateWithTelegram } from '../services/userService.js';
import { AppError } from '../utils/errors.js';

export const authRouter = Router();

authRouter.post('/telegram', async (req, res, next) => {
  try {
    const initData = req.body?.initData;
    if (typeof initData !== 'string' || !initData.trim()) {
      throw new AppError(400, 'Поле initData обязательно');
    }

    const result = await authenticateWithTelegram(initData);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
