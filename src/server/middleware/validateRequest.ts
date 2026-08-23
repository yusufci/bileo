// Universal Zod Request Validation Middleware for Bileo Platform
// Validates params, query, and body asynchronously against typed Zod schemas.
// Returns standardized 400 Bad Request JSON envelopes on validation failures.

import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodType } from 'zod';

export interface ValidationSchemas<P = any, Q = any, B = any> {
  params?: ZodType<P>;
  query?: ZodType<Q>;
  body?: ZodType<B>;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

export interface ValidationErrorResponse {
  success: false;
  error: string;
  code: 'VALIDATION_ERROR';
  details: ValidationErrorDetail[];
}

/**
 * Universal Request Validation Middleware
 * Enforces Zod schema contracts on req.params, req.query, and req.body.
 * Coerces and strips invalid inputs, returning structured 400 envelopes on error.
 */
export function validateRequest<P = any, Q = any, B = any>(schemas: ValidationSchemas<P, Q, B>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as any;
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as any;
      }
      if (schemas.body) {
        req.body = (await schemas.body.parseAsync(req.body)) as any;
      }
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        const details: ValidationErrorDetail[] = error.issues.map((issue) => ({
          field: issue.path.length > 0 ? issue.path.join('.') : 'body',
          message: issue.message,
          code: String(issue.code),
        }));

        res.status(400).json({
          success: false,
          error: 'Validation Error',
          code: 'VALIDATION_ERROR',
          details,
        });
        return;
      }

      next(error);
    }
  };
}
