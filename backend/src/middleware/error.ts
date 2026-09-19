import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

// Must be mounted last in the pipeline.
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      code: err.code,
      message: err.message,
    });
    return;
  }

  // Unexpected errors — log and hide details in production
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}
