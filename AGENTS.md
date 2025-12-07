# AGENTS.md - AI Agent Guidelines for Express Type-Safe Routes

## Project Context

This is **express-type-safe-routes**, a TypeScript npm package providing full type inference for Express.js routes via Zod schemas. When working on this codebase, follow these guidelines to maintain consistency and quality.

---

## Quick Reference

| Aspect | Standard |
|--------|----------|
| Language | TypeScript (strict mode) |
| Runtime | Node.js 18+ |
| Build | tsup (ESM + CJS dual output) |
| Test | Vitest + tsd (type tests) |
| Package Manager | pnpm |
| Linting | ESLint + Prettier |
| Commit Style | Conventional Commits |

---

## Implementation Status

### 📋 Phase 1: Core Type Safety (v0.1.0)

| Task | Status | File(s) |
|------|--------|---------|
| Core type definitions | 📋 TODO | `src/types.ts` |
| `route()` schema helper | 📋 TODO | `src/route/route.ts` |
| `RouteBuilder` fluent API | 📋 TODO | `src/route/RouteBuilder.ts` |
| `createTypedRouter()` | 📋 TODO | `src/router/TypedRouter.ts` |
| Validation middleware | 📋 TODO | `src/validation/middleware.ts` |
| Type inference utilities | 📋 TODO | `src/validation/inference.ts` |
| Unit tests | 📋 TODO | `test/` |
| Type tests (tsd) | 📋 TODO | `test/types/` |
| Integration tests | 📋 TODO | `test/integration/` |
| Examples | 📋 TODO | `examples/` |
| Documentation | 📋 TODO | `README.md` |

**Progress**: 0% complete (0/11 tasks)

---

## Architecture Overview

```
src/
├── index.ts              # Public API exports
├── types.ts              # Core type definitions
├── route/
│   ├── route.ts          # route() helper function
│   ├── RouteBuilder.ts   # Fluent builder (alternative API)
│   └── index.ts
├── router/
│   ├── TypedRouter.ts    # Express Router wrapper
│   ├── methods.ts        # HTTP method type overloads
│   └── index.ts
├── response/
│   ├── TypedResponse.ts  # Response type wrapper
│   └── index.ts
├── validation/
│   ├── middleware.ts     # Zod validation middleware
│   ├── inference.ts      # Type inference utilities
│   └── index.ts
└── utils/
    ├── types.ts          # Utility types
    └── index.ts
```

---

## Implementation Tasks

### Task 1: Core Type Definitions

**File**: `src/types.ts`

**Status**: 📋 TODO

**Requirements**:
- Define `RouteSchemas` interface for body, query, params, response
- Define `TypedRequest` extending Express Request
- Define `TypedResponse` extending Express Response
- Define `RouteDefinition` type for route() output
- Define `TypedHandler` type for handler functions

**Pattern**:
```typescript
import type { Request, Response, NextFunction } from 'express';
import type { z } from 'zod';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

/**
 * Response schemas mapped by status code
 */
export type ResponseSchemas = {
  [statusCode: number]: z.ZodSchema;
};

/**
 * Route schema definition
 */
export interface RouteSchemas<
  TBody extends z.ZodSchema = z.ZodUnknown,
  TQuery extends z.ZodSchema = z.ZodUnknown,
  TParams extends z.ZodSchema = z.ZodUnknown,
  TResponse extends ResponseSchemas = ResponseSchemas
> {
  readonly body?: TBody;
  readonly query?: TQuery;
  readonly params?: TParams;
  readonly response?: TResponse;
}

/**
 * Express Request with inferred types from Zod schemas
 */
export interface TypedRequest<
  TBody = unknown,
  TQuery extends ParsedQs = ParsedQs,
  TParams extends ParamsDictionary = ParamsDictionary
> extends Request<TParams, unknown, TBody, TQuery> {
  body: TBody;
  query: TQuery;
  params: TParams;
}

/**
 * Express Response with typed json() method
 */
export interface TypedResponse<TData = unknown> extends Response {
  json(body: TData): this;
}

/**
 * Route definition returned by route()
 */
export interface RouteDefinition<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
  TResponse = unknown
> {
  readonly schemas: RouteSchemas;
  readonly middleware: RequestHandler[];
  readonly __brand: 'RouteDefinition';
}

/**
 * Type-safe request handler
 */
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
```

---

### Task 2: Type Inference Utilities

**File**: `src/validation/inference.ts`

**Status**: 📋 TODO

**Requirements**:
- Infer body type from schema
- Infer query type from schema (handle ParsedQs compatibility)
- Infer params type from schema
- Infer response type from status-mapped schemas

**Pattern**:
```typescript
import type { z } from 'zod';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { RouteSchemas, ResponseSchemas } from '../types';

/**
 * Infer body type from route schemas
 */
export type InferBody<T extends RouteSchemas> = 
  T extends { body: infer B extends z.ZodSchema }
    ? z.infer<B>
    : unknown;

/**
 * Infer query type from route schemas
 */
export type InferQuery<T extends RouteSchemas> = 
  T extends { query: infer Q extends z.ZodSchema }
    ? z.infer<Q> & ParsedQs
    : ParsedQs;

/**
 * Infer params type from route schemas
 */
export type InferParams<T extends RouteSchemas> = 
  T extends { params: infer P extends z.ZodSchema }
    ? z.infer<P> & ParamsDictionary
    : ParamsDictionary;

/**
 * Infer response types from status-mapped schemas
 */
export type InferResponses<T extends RouteSchemas> = 
  T extends { response: infer R extends ResponseSchemas }
    ? { [K in keyof R]: R[K] extends z.ZodSchema ? z.infer<R[K]> : never }
    : unknown;

/**
 * Extract response type for a specific status code
 */
export type InferResponseForStatus<
  T extends ResponseSchemas,
  TStatus extends keyof T
> = T[TStatus] extends z.ZodSchema ? z.infer<T[TStatus]> : never;
```

---

### Task 3: route() Schema Helper

**File**: `src/route/route.ts`

**Status**: 📋 TODO

**Requirements**:
- Accept body, query, params, response schemas
- Return RouteDefinition with middleware array
- Infer all types from schemas
- Generate validation middleware automatically

**Pattern**:
```typescript
import type { z } from 'zod';
import type { RequestHandler } from 'express';
import type { RouteSchemas, RouteDefinition, ResponseSchemas } from '../types';
import { createValidationMiddleware } from '../validation/middleware';

/**
 * Create a typed route definition with validation
 * 
 * @example
 * ```typescript
 * const userRoute = route({
 *   body: z.object({ email: z.string().email() }),
 *   response: { 201: userResponseSchema }
 * });
 * 
 * router.post('/users', userRoute, (req, res) => {
 *   // req.body is { email: string }
 *   res.status(201).json({ ... });
 * });
 * ```
 */
export function route<
  TBody extends z.ZodSchema = z.ZodUnknown,
  TQuery extends z.ZodSchema = z.ZodUnknown,
  TParams extends z.ZodSchema = z.ZodUnknown,
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

  // Add validation middleware if any input schemas provided
  if (schemas.body || schemas.query || schemas.params) {
    middleware.push(createValidationMiddleware({
      body: schemas.body,
      query: schemas.query,
      params: schemas.params,
    }));
  }

  return {
    schemas,
    middleware,
    __brand: 'RouteDefinition',
  } as RouteDefinition<z.infer<TBody>, z.infer<TQuery>, z.infer<TParams>, TResponse>;
}
```

---

### Task 4: Validation Middleware

**File**: `src/validation/middleware.ts`

**Status**: 📋 TODO

**Requirements**:
- Validate body, query, params using Zod
- Return 400 with structured errors on failure
- Use safeParse() for non-throwing validation
- Replace request properties with parsed data

**Pattern**:
```typescript
import type { RequestHandler } from 'express';
import type { z } from 'zod';

export interface ValidationSchemas {
  readonly body?: z.ZodSchema;
  readonly query?: z.ZodSchema;
  readonly params?: z.ZodSchema;
}

export interface ValidationError {
  readonly location: 'body' | 'query' | 'params';
  readonly issues: readonly z.ZodIssue[];
}

/**
 * Create validation middleware from Zod schemas
 */
export function createValidationMiddleware(
  schemas: ValidationSchemas
): RequestHandler {
  return (req, res, next) => {
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
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    next();
  };
}
```

---

### Task 5: TypedRouter Wrapper

**File**: `src/router/TypedRouter.ts`

**Status**: 📋 TODO

**Requirements**:
- Wrap express.Router() with typed method signatures
- Overload get, post, put, patch, delete methods
- Accept RouteDefinition and infer handler types
- Maintain Express Router compatibility

**Pattern**:
```typescript
import { Router } from 'express';
import type { RequestHandler, IRouter } from 'express';
import type { RouteDefinition, TypedHandler } from '../types';
import type { InferBody, InferQuery, InferParams, InferResponses } from '../validation/inference';

export interface TypedRouter extends IRouter {
  /**
   * GET route with type-safe handler
   */
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
  ): this;

  /**
   * POST route with type-safe handler
   */
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
  ): this;

  // ... put, patch, delete follow same pattern
}

/**
 * Create a typed Express router
 * 
 * @example
 * ```typescript
 * const router = createTypedRouter();
 * 
 * router.post('/users', route({ body: userSchema }), (req, res) => {
 *   // req.body is fully typed
 * });
 * ```
 */
export function createTypedRouter(): TypedRouter {
  const router = Router();

  // Wrap each HTTP method to handle RouteDefinition
  const originalGet = router.get.bind(router);
  const originalPost = router.post.bind(router);
  const originalPut = router.put.bind(router);
  const originalPatch = router.patch.bind(router);
  const originalDelete = router.delete.bind(router);

  function wrapMethod(
    method: typeof originalGet
  ): TypedRouter['get'] {
    return function (path: string, ...args: unknown[]) {
      const handlers: RequestHandler[] = [];

      for (const arg of args) {
        if (isRouteDefinition(arg)) {
          handlers.push(...arg.middleware);
        } else if (typeof arg === 'function') {
          handlers.push(arg as RequestHandler);
        }
      }

      return method(path, ...handlers);
    } as TypedRouter['get'];
  }

  return Object.assign(router, {
    get: wrapMethod(originalGet),
    post: wrapMethod(originalPost),
    put: wrapMethod(originalPut),
    patch: wrapMethod(originalPatch),
    delete: wrapMethod(originalDelete),
  }) as TypedRouter;
}

function isRouteDefinition(value: unknown): value is RouteDefinition {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__brand' in value &&
    value.__brand === 'RouteDefinition'
  );
}
```

---

### Task 6: RouteBuilder (Fluent API Alternative)

**File**: `src/route/RouteBuilder.ts`

**Status**: 📋 TODO

**Requirements**:
- Fluent builder pattern: `.body().query().params().response().handler()`
- Type inference updates with each method call
- `.build()` returns middleware array + handler
- Compatible with express-middleware-chain

**Pattern**:
```typescript
import type { z } from 'zod';
import type { RequestHandler } from 'express';
import type { TypedHandler, ResponseSchemas } from '../types';
import { createValidationMiddleware } from '../validation/middleware';

export class RouteBuilder<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
  TResponse extends ResponseSchemas = {}
> {
  private bodySchema?: z.ZodSchema;
  private querySchema?: z.ZodSchema;
  private paramsSchema?: z.ZodSchema;
  private responseSchemas: ResponseSchemas = {};
  private middlewares: RequestHandler[] = [];

  /**
   * Set body schema with type inference
   */
  body<T extends z.ZodSchema>(
    schema: T
  ): RouteBuilder<z.infer<T>, TQuery, TParams, TResponse> {
    this.bodySchema = schema;
    return this as unknown as RouteBuilder<z.infer<T>, TQuery, TParams, TResponse>;
  }

  /**
   * Set query schema with type inference
   */
  query<T extends z.ZodSchema>(
    schema: T
  ): RouteBuilder<TBody, z.infer<T>, TParams, TResponse> {
    this.querySchema = schema;
    return this as unknown as RouteBuilder<TBody, z.infer<T>, TParams, TResponse>;
  }

  /**
   * Set params schema with type inference
   */
  params<T extends z.ZodSchema>(
    schema: T
  ): RouteBuilder<TBody, TQuery, z.infer<T>, TResponse> {
    this.paramsSchema = schema;
    return this as unknown as RouteBuilder<TBody, TQuery, z.infer<T>, TResponse>;
  }

  /**
   * Add response schema for a status code
   */
  response<TStatus extends number, T extends z.ZodSchema>(
    status: TStatus,
    schema: T
  ): RouteBuilder<TBody, TQuery, TParams, TResponse & { [K in TStatus]: T }> {
    this.responseSchemas[status] = schema;
    return this as unknown as RouteBuilder<
      TBody,
      TQuery,
      TParams,
      TResponse & { [K in TStatus]: T }
    >;
  }

  /**
   * Add middleware to the chain
   */
  use(middleware: RequestHandler): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Set the final handler and build the route
   */
  handler(
    fn: TypedHandler<TBody, TQuery, TParams, TResponse>
  ): RequestHandler[] {
    const result: RequestHandler[] = [];

    // Add validation middleware
    if (this.bodySchema || this.querySchema || this.paramsSchema) {
      result.push(createValidationMiddleware({
        body: this.bodySchema,
        query: this.querySchema,
        params: this.paramsSchema,
      }));
    }

    // Add custom middlewares
    result.push(...this.middlewares);

    // Add handler
    result.push(fn as RequestHandler);

    return result;
  }
}

/**
 * Create a fluent route builder
 * 
 * @example
 * ```typescript
 * const userRoute = typedRoute()
 *   .body(userSchema)
 *   .response(201, userResponseSchema)
 *   .handler((req, res) => {
 *     // Fully typed
 *   });
 * 
 * router.post('/users', ...userRoute);
 * ```
 */
export function typedRoute(): RouteBuilder {
  return new RouteBuilder();
}
```

---

### Task 7: Public API Exports

**File**: `src/index.ts`

**Status**: 📋 TODO

**Requirements**:
- Export all public APIs
- Re-export types for consumers
- Clean, minimal surface area

**Pattern**:
```typescript
// Core functions
export { route } from './route/route';
export { typedRoute, RouteBuilder } from './route/RouteBuilder';
export { createTypedRouter } from './router/TypedRouter';

// Validation
export { createValidationMiddleware } from './validation/middleware';

// Types
export type {
  RouteSchemas,
  RouteDefinition,
  ResponseSchemas,
  TypedRequest,
  TypedResponse,
  TypedHandler,
} from './types';

export type {
  ValidationSchemas,
  ValidationError,
} from './validation/middleware';

export type { TypedRouter } from './router/TypedRouter';

// Type inference utilities (for advanced users)
export type {
  InferBody,
  InferQuery,
  InferParams,
  InferResponses,
  InferResponseForStatus,
} from './validation/inference';
```

---

## Code Quality Standards

### TypeScript Rules

1. **No `any`** - Use `unknown` with type guards
2. **Explicit return types** on public functions
3. **Generic naming**: `TBody`, `TQuery`, `TParams`, `TResponse`
4. **Readonly where possible**: `readonly schemas: RouteSchemas`
5. **Use `satisfies`** for type validation without widening

### Testing Standards

1. **Unit tests** for each function
2. **Integration tests** with real Express app
3. **Type tests** using `tsd` for type inference validation
4. **Coverage**: Minimum 85%

**Test file location**: Mirror source structure in `test/`
```
src/route/route.ts → test/route/route.test.ts
```

**Type test location**: `test/types/`
```typescript
// test/types/route.test-d.ts
import { expectType } from 'tsd';
import { route, TypedRequest } from '../../src';
import { z } from 'zod';

const userRoute = route({
  body: z.object({ email: z.string() }),
});

// Type tests
expectType<{ email: string }>(userRoute.schemas.body);
```

### Documentation

1. **JSDoc** on all public exports
2. **@example** tags with working code
3. **README** with quick start and API reference

---

## Express Compatibility

### Express 4 (Primary Target)
- Middleware signature: `(req, res, next)`
- Error handler: 4-param signature `(err, req, res, next)`
- Router via `express.Router()`

### Express 5 Differences
- Native Promise support in middleware
- Different router mounting behavior

**Strategy**: Feature detection, not version sniffing.

---

## Common Patterns

### Zod Schema Examples

```typescript
// Body with email validation
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['user', 'admin']).default('user'),
});

// Query with pagination (use coerce for string → number)
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['asc', 'desc']).optional(),
});

// Params with UUID validation
const userParamsSchema = z.object({
  id: z.string().uuid(),
});

// Response schemas by status code
const responseSchemas = {
  200: z.object({ user: userSchema }),
  404: z.object({ error: z.string() }),
};
```

### Integration with express-middleware-chain

```typescript
import { createTypedRouter, route } from 'express-type-safe-routes';
import { chain } from 'express-middleware-chain';

const router = createTypedRouter();

router.post(
  '/users',
  route({
    body: createUserSchema,
    response: { 201: userResponseSchema },
  }),
  // Spread middleware chain into route
  ...chain()
    .rateLimit({ limit: 100, window: '15m' })
    .errorBoundary()
    .build(),
  (req, res) => {
    // Both type-safe and rate-limited!
  }
);
```

---

## Avoid These Patterns

❌ **Don't use `any`** - Use proper types or `unknown`
❌ **Don't mutate request types** - Use proper type extensions
❌ **Don't add runtime overhead for types** - Types should erase
❌ **Don't require express-middleware-chain** - Keep it optional
❌ **Don't validate responses at runtime** - Compile-time only

---

## File Templates

### New Source File Template

```typescript
// src/feature/myFeature.ts
import type { z } from 'zod';
import type { RequestHandler } from 'express';

/**
 * Description of what this does
 * 
 * @example
 * ```typescript
 * const result = myFeature({ ... });
 * ```
 */
export function myFeature<T extends z.ZodSchema>(
  config: MyFeatureConfig<T>
): RequestHandler {
  // Implementation
}

export interface MyFeatureConfig<T> {
  readonly schema: T;
}
```

### New Test File Template

```typescript
// test/feature/myFeature.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { myFeature } from '../../src/feature/myFeature';

describe('myFeature', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  it('should validate input correctly', async () => {
    const schema = z.object({ name: z.string() });
    app.post('/test', myFeature({ schema }), (req, res) => {
      res.json({ received: req.body });
    });

    const response = await request(app)
      .post('/test')
      .send({ name: 'test' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: { name: 'test' } });
  });

  it('should return 400 for invalid input', async () => {
    const schema = z.object({ name: z.string() });
    app.post('/test', myFeature({ schema }), (req, res) => {
      res.json({ received: req.body });
    });

    const response = await request(app)
      .post('/test')
      .send({ name: 123 });

    expect(response.status).toBe(400);
  });
});
```

### Type Test Template

```typescript
// test/types/myFeature.test-d.ts
import { expectType, expectError } from 'tsd';
import { z } from 'zod';
import { myFeature, TypedRequest } from '../../src';

const schema = z.object({ email: z.string().email() });

// Should infer correct type
const handler = myFeature({ schema });
expectType<RequestHandler>(handler);

// Should error on invalid input
expectError(myFeature({ schema: 'invalid' }));
```

---

## Build & Release

### Build Commands
```bash
pnpm build        # Build with tsup
pnpm test         # Run tests
pnpm test:types   # Run type tests with tsd
pnpm test:cov     # Tests with coverage
pnpm lint         # ESLint check
pnpm typecheck    # TypeScript check
```

### Package Exports

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
}
```

### Peer Dependencies

```json
{
  "peerDependencies": {
    "express": "^4.18.0 || ^5.0.0",
    "zod": "^3.20.0",
    "express-middleware-chain": "^0.1.0"
  },
  "peerDependenciesMeta": {
    "express-middleware-chain": {
      "optional": true
    }
  }
}
```
