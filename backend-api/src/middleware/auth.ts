import type { NextFunction, Request, Response } from 'express';
import { findUserById, verifyAccessToken } from '../services/userService.js';
import type { IUser } from '../models/User.js';
import { AppError } from '../utils/errors.js';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'Требуется авторизация');
    }

    const token = header.slice('Bearer '.length);
    const { userId } = verifyAccessToken(token);
    const user = await findUserById(userId);

    if (!user) {
      throw new AppError(401, 'Пользователь не найден');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, 'Недействительный токен'));
  }
}
