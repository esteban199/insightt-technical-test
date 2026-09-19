import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

const REDACTED_HEADERS = new Set(['authorization', 'cookie']);

// Authorization/cookie carry the actual credentials — log that a header was
// present without leaking the token itself.
function redactHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    redacted[key] = REDACTED_HEADERS.has(key.toLowerCase()) ? '[REDACTED]' : value;
  }
  return redacted;
}

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
      headers: redactHeaders(req.headers),
      userId: req.user?.sub ?? null,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    };

    console.log(JSON.stringify(logEntry));
  });

  next();
}
