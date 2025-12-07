import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { RequestHandler } from 'express';
import type { RouteDefinition, TypedHandler } from '../types';
import type { InferBody, InferParams, InferQuery, InferResponses } from '../validation/inference';

export type TypedRouter = Router & {
  get<TRoute extends RouteDefinition>(
    path: string,
    routeDef: TRoute,
    ...handlers: Array<
      RequestHandler | TypedHandler<
        InferBody<TRoute>,
        InferQuery<TRoute>,
        InferParams<TRoute>,
        InferResponses<TRoute>
      >
    >
  ): TypedRouter;

  post<TRoute extends RouteDefinition>(
    path: string,
    routeDef: TRoute,
    ...handlers: Array<
      RequestHandler | TypedHandler<
        InferBody<TRoute>,
        InferQuery<TRoute>,
        InferParams<TRoute>,
        InferResponses<TRoute>
      >
    >
  ): TypedRouter;

  put<TRoute extends RouteDefinition>(
    path: string,
    routeDef: TRoute,
    ...handlers: Array<
      RequestHandler | TypedHandler<
        InferBody<TRoute>,
        InferQuery<TRoute>,
        InferParams<TRoute>,
        InferResponses<TRoute>
      >
    >
  ): TypedRouter;

  patch<TRoute extends RouteDefinition>(
    path: string,
    routeDef: TRoute,
    ...handlers: Array<
      RequestHandler | TypedHandler<
        InferBody<TRoute>,
        InferQuery<TRoute>,
        InferParams<TRoute>,
        InferResponses<TRoute>
      >
    >
  ): TypedRouter;

  delete<TRoute extends RouteDefinition>(
    path: string,
    routeDef: TRoute,
    ...handlers: Array<
      RequestHandler | TypedHandler<
        InferBody<TRoute>,
        InferQuery<TRoute>,
        InferParams<TRoute>,
        InferResponses<TRoute>
      >
    >
  ): TypedRouter;
};

export function createTypedRouter(): TypedRouter {
  const router = ExpressRouter();

  const wrap = (
    method: (path: string, ...handlers: RequestHandler[]) => Router
  ) => {
    return (path: string, ...handlers: unknown[]) => {
      const flattened: RequestHandler[] = [];

      handlers.forEach((handler) => {
        if (isRouteDefinition(handler)) {
          flattened.push(...handler.middleware);
        } else if (typeof handler === 'function') {
          flattened.push(handler as RequestHandler);
        }
      });

      return method.call(router, path, ...flattened) as unknown as TypedRouter;
    };
  };

  const typed = {
    get: wrap(router.get),
    post: wrap(router.post),
    put: wrap(router.put),
    patch: wrap(router.patch),
    delete: wrap(router.delete),
  };

  return Object.assign(router, typed) as TypedRouter;
}

function isRouteDefinition(value: unknown): value is RouteDefinition {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__brand' in value &&
    (value as RouteDefinition).__brand === 'RouteDefinition'
  );
}
