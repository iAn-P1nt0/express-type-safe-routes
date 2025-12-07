import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { z } from 'zod';

export type ResponseSchemas = Readonly<Record<number, z.ZodTypeAny>>;

export interface RouteSchemas<
  TBody extends z.ZodTypeAny = z.ZodUnknown,
  TQuery extends z.ZodTypeAny = z.ZodUnknown,
  TParams extends z.ZodTypeAny = z.ZodUnknown,
  TResponse extends ResponseSchemas = ResponseSchemas
> {
  readonly body?: TBody;
  readonly query?: TQuery;
  readonly params?: TParams;
  readonly response?: TResponse;
}

export interface TypedRequest<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown
> extends Request {
  body: TBody;
  query: TQuery & Request['query'];
  params: TParams & Request['params'];
}

export type JsonBodyFor<TSchemas> = TSchemas extends ResponseSchemas
  ? { [S in keyof TSchemas]: TSchemas[S] extends z.ZodTypeAny ? z.infer<TSchemas[S]> : never }[keyof TSchemas]
  : TSchemas;

export type NarrowResponseSchemas<TSchemas, TStatus extends number> = TSchemas extends ResponseSchemas
  ? Pick<TSchemas, Extract<keyof TSchemas, TStatus>>
  : TSchemas;

export type TypedResponse<TSchemas = unknown> = Omit<Response, 'status' | 'json'> & {
  status<TStatus extends number>(code: TStatus): TypedResponse<NarrowResponseSchemas<TSchemas, TStatus>>;
  json(body: JsonBodyFor<TSchemas>): TypedResponse<TSchemas>;
};

export interface RouteDefinition<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
  TResponse = unknown
> {
  readonly schemas: RouteSchemas<any, any, any, any>;
  readonly middleware: readonly RequestHandler[];
  readonly __brand: 'RouteDefinition';
  readonly __types?: {
    readonly body: TBody;
    readonly query: TQuery;
    readonly params: TParams;
    readonly responses: TResponse;
  };
}

export type TypedHandler<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
  TResponse = unknown
> = (
  req: TypedRequest<TBody, TQuery, TParams>,
  res: TypedResponse<TResponse>,
  next: NextFunction
) => void | Promise<void>;
