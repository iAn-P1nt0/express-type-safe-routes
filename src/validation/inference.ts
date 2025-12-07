import type { z } from 'zod';
import type { RouteDefinition, ResponseSchemas } from '../types';

export type InferBody<T extends RouteDefinition> = T extends RouteDefinition<infer TBody, any, any, any>
  ? TBody
  : unknown;

export type InferQuery<T extends RouteDefinition> = T extends RouteDefinition<any, infer TQuery, any, any>
  ? TQuery
  : unknown;

export type InferParams<T extends RouteDefinition> = T extends RouteDefinition<any, any, infer TParams, any>
  ? TParams
  : unknown;

export type InferResponses<T extends RouteDefinition> = T extends RouteDefinition<any, any, any, infer TResponse>
  ? TResponse
  : unknown;

export type InferResponseForStatus<
  T extends ResponseSchemas,
  TStatus extends keyof T
> = T[TStatus] extends z.ZodTypeAny ? z.infer<T[TStatus]> : never;
