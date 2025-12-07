import type { z } from 'zod';
import type { RequestHandler } from 'express';
import type { RouteSchemas, RouteDefinition, ResponseSchemas } from '../types';
import { createValidationMiddleware } from '../validation/middleware';

export function route<
  TBody extends z.ZodTypeAny = z.ZodUnknown,
  TQuery extends z.ZodTypeAny = z.ZodUnknown,
  TParams extends z.ZodTypeAny = z.ZodUnknown,
  TResponse extends ResponseSchemas = {}
>(
  schemas: RouteSchemas<TBody, TQuery, TParams, TResponse>
): RouteDefinition<
  z.infer<TBody>,
  z.infer<TQuery>,
  z.infer<TParams>,
  TResponse
> {
  const middleware: RequestHandler[] = [];

  if (schemas.body || schemas.query || schemas.params) {
    const validationSchemas: Record<string, z.ZodTypeAny> = {};
    if (schemas.body) validationSchemas.body = schemas.body;
    if (schemas.query) validationSchemas.query = schemas.query;
    if (schemas.params) validationSchemas.params = schemas.params;

    middleware.push(createValidationMiddleware(validationSchemas));
  }

  return {
    schemas,
    middleware,
    __brand: 'RouteDefinition' as const,
    __types: {
      body: undefined as unknown as z.infer<TBody>,
      query: undefined as unknown as z.infer<TQuery>,
      params: undefined as unknown as z.infer<TParams>,
      responses: undefined as unknown as TResponse,
    },
  };
}
