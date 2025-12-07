import type { RequestHandler } from 'express';
import type { z } from 'zod';

export interface ValidationSchemas {
  readonly body?: z.ZodTypeAny;
  readonly query?: z.ZodTypeAny;
  readonly params?: z.ZodTypeAny;
}

export interface ValidationError {
  readonly location: 'body' | 'query' | 'params';
  readonly issues: readonly z.ZodIssue[];
}

export function createValidationMiddleware(schemas: ValidationSchemas): RequestHandler {
  return (req, res, next): void => {
    const errors: ValidationError[] = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push({ location: 'body', issues: result.error.issues });
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push({ location: 'query', issues: result.error.issues });
      } else {
        req.query = result.data;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push({ location: 'params', issues: result.error.issues });
      } else {
        req.params = result.data;
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    next();
  };
}
