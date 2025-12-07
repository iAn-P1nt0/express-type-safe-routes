import type { RequestHandler } from 'express';
import type { z } from 'zod';
import type { ResponseSchemas, TypedHandler } from '../types';
import { createValidationMiddleware } from '../validation/middleware';

export class RouteBuilder<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
  TResponse extends ResponseSchemas = {}
> {
  private bodySchema?: z.ZodTypeAny;
  private querySchema?: z.ZodTypeAny;
  private paramsSchema?: z.ZodTypeAny;
  private responseSchemas: ResponseSchemas = {};
  private middlewares: RequestHandler[] = [];

  body<TSchema extends z.ZodTypeAny>(schema: TSchema): RouteBuilder<z.infer<TSchema>, TQuery, TParams, TResponse> {
    this.bodySchema = schema;
    return this as unknown as RouteBuilder<z.infer<TSchema>, TQuery, TParams, TResponse>;
  }

  query<TSchema extends z.ZodTypeAny>(schema: TSchema): RouteBuilder<TBody, z.infer<TSchema>, TParams, TResponse> {
    this.querySchema = schema;
    return this as unknown as RouteBuilder<TBody, z.infer<TSchema>, TParams, TResponse>;
  }

  params<TSchema extends z.ZodTypeAny>(schema: TSchema): RouteBuilder<TBody, TQuery, z.infer<TSchema>, TResponse> {
    this.paramsSchema = schema;
    return this as unknown as RouteBuilder<TBody, TQuery, z.infer<TSchema>, TResponse>;
  }

  response<TStatus extends number, TSchema extends z.ZodTypeAny>(
    status: TStatus,
    schema: TSchema
  ): RouteBuilder<TBody, TQuery, TParams, TResponse & { [K in TStatus]: TSchema }> {
    this.responseSchemas = { ...this.responseSchemas, [status]: schema };
    return this as unknown as RouteBuilder<
      TBody,
      TQuery,
      TParams,
      TResponse & { [K in TStatus]: TSchema }
    >;
  }

  use(middleware: RequestHandler): this {
    this.middlewares.push(middleware);
    return this;
  }

  handler(fn: TypedHandler<TBody, TQuery, TParams, TResponse>): RequestHandler[] {
    const result: RequestHandler[] = [];

    if (this.bodySchema || this.querySchema || this.paramsSchema) {
      const schemas: Record<string, z.ZodTypeAny> = {};
      if (this.bodySchema) schemas.body = this.bodySchema;
      if (this.querySchema) schemas.query = this.querySchema;
      if (this.paramsSchema) schemas.params = this.paramsSchema;

      result.push(createValidationMiddleware(schemas));
    }

    result.push(...this.middlewares);
    result.push(fn as RequestHandler);

    return result;
  }
}

export function typedRoute(): RouteBuilder {
  return new RouteBuilder();
}
