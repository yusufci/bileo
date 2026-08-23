// Production Error Redaction & Handling Middleware for Bileo Platform
// Catches unhandled exceptions, sanitizes logging against PII/credential leaks,
// and returns clean generic 500 responses without exposing technical stack traces.

import { Request, Response, NextFunction } from 'express';
import { maskSensitiveFields } from './privacyMasking';

export interface AppError extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
  details?: any;
}

/**
 * Global Express Error Redaction Handler
 * Enforces CWE-209 mitigation: never leaks database errors, filesystem paths, or stack traces.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response has already started streaming, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Sanitize error metadata before server-side logging
  const sanitizedLog = {
    message: err.message || 'Internal Server Error',
    code: err.code || 'UNKNOWN_ERROR',
    statusCode: err.statusCode || err.status || 500,
    path: req.originalUrl || req.url,
    method: req.method,
    ip: req.ip || req.socket?.remoteAddress,
    params: maskSensitiveFields(req.params),
    query: maskSensitiveFields(req.query),
    body: maskSensitiveFields(req.body),
    timestamp: new Date().toISOString(),
  };

  // Log sanitized error internally for telemetry / APM
  if (process.env.NODE_ENV !== 'test') {
    console.error('⚠️ [SERVER_ERROR]', JSON.stringify(sanitizedLog));
  }

  // 2. Determine HTTP Status Code
  let statusCode = err.statusCode || err.status || 500;
  let errorCode = err.code || 'INTERNAL_ERROR';
  let clientMessage = 'An unexpected internal error occurred. Please try again later.';

  // Handle known client status codes
  if (statusCode >= 400 && statusCode < 500) {
    clientMessage = err.message || 'Bad Request';
    errorCode = err.code || (statusCode === 404 ? 'NOT_FOUND' : statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 409 ? 'CONFLICT' : 'CLIENT_ERROR');
  }

  // Handle Payload Too Large (e.g. from body-parser limit)
  if (err.type === 'entity.too.large' || statusCode === 413) {
    statusCode = 413;
    errorCode = 'PAYLOAD_TOO_LARGE';
    clientMessage = 'Request body size limit exceeded (max 10kb).';
  }

  // Handle JSON syntax parse error
  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    clientMessage = 'Malformed JSON payload in request body.';
  }

  res.status(statusCode).json({
    success: false,
    error: clientMessage,
    code: errorCode,
    ...(err.details && statusCode < 500 ? { details: err.details } : {}),
  });
}

/**
 * 404 Not Found Handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
  });
}
