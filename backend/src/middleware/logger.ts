import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

// Mounted first so it wraps every request, including auth/validation failures.
export function loggerMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    const logEntry = {
      ts: new Date().toISOString(),
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query,
      userId: req.user?.sub ?? null,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    };

    console.log(JSON.stringify(logEntry));
  });

  next();
}
