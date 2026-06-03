import type { NextFunction, Request, Response } from 'express';
import { isAppError } from '../utils/errors.js';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (isAppError(error)) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}
