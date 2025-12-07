# GitHub Copilot Instructions for express-type-safe-routes

## Project Overview

This is **express-type-safe-routes**, a TypeScript npm package providing full type inference for Express.js routes via Zod schemas. The package enables developers to get autocomplete and type safety for `req.params`, `req.body`, `req.query`, and `res.json()`.

## Key Concepts

### Core APIs

1. **`route()`** - Schema helper that returns typed middleware
2. **`createTypedRouter()`** - Express Router wrapper with type inference
3. **`typedRoute()`** - Fluent builder alternative to `route()`

### Type Flow

```typescript
// Zod schema → TypeScript type → Request/Response typing
const schema = z.object({ email: z.string().email() });
// z.infer<typeof schema> = { email: string }
// TypedRequest<...> uses this inferred type
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - No implicit any, strict null checks
- **No `any`** - Use `unknown` with type guards instead
- **Descriptive generics** - Use `TBody`, `TQuery`, `TParams`, `TResponse`
- **Readonly by default** - Mark properties as `readonly` when possible
- **Explicit return types** - All public functions must have return types

### Naming Conventions

```typescript
// Types/Interfaces: PascalCase
interface TypedRequest<TBody> { }
type InferBody<T> = ...;

// Functions: camelCase
function createTypedRouter() { }
function route<T>() { }

// Constants: UPPER_SNAKE_CASE for true constants
const DEFAULT_STATUS_CODES = [200, 201];

// Files: camelCase.ts
// route.ts, TypedRouter.ts, inference.ts
```

### Preferred Patterns

```typescript
// ✅ Use conditional types for inference
type InferBody<T> = T extends { body: infer B extends z.ZodSchema }
  ? z.infer<B>
  : unknown;

// ✅ Use readonly for immutable config
interface RouteSchemas {
  readonly body?: z.ZodSchema;
  readonly query?: z.ZodSchema;
}

// ✅ Use branded types for type safety
interface RouteDefinition {
  readonly __brand: 'RouteDefinition';
}

// ✅ Use safeParse for validation
const result = schema.safeParse(input);
if (!result.success) {
  return res.status(400).json({ errors: result.error.issues });
}
req.body = result.data;

// ✅ Type guards for runtime checks
function isRouteDefinition(value: unknown): value is RouteDefinition {
  return typeof value === 'object' && value !== null && '__brand' in value;
}
```

### Avoid These Patterns

```typescript
// ❌ Don't use any
function bad(input: any) { }

// ❌ Don't use non-null assertion without reason
const value = maybeNull!;

// ❌ Don't mutate imported types
declare module 'express' { } // Avoid this

// ❌ Don't add runtime overhead for compile-time features
// Types should be erased at compile time

// ❌ Don't require express-middleware-chain
// Keep it as optional peer dependency
```

## Project Structure

```
src/
├── index.ts              # Public exports only
├── types.ts              # Core type definitions
├── route/                # route() and RouteBuilder
├── router/               # TypedRouter
├── response/             # TypedResponse
├── validation/           # Zod validation middleware
└── utils/                # Helper utilities
```

## Common Tasks

### Adding a New Feature

1. Create types in `src/types.ts` or feature-specific types file
2. Implement in appropriate directory (`src/feature/`)
3. Export from `src/index.ts`
4. Add unit tests in `test/feature/`
5. Add type tests in `test/types/`
6. Update JSDoc with `@example`

### Writing Tests

```typescript
// Use Vitest for unit/integration tests
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

// Use tsd for type tests
import { expectType, expectError } from 'tsd';
```

### Zod Schema Patterns

```typescript
// Body schemas - regular objects
z.object({ email: z.string().email() })

// Query schemas - use coerce for string parsing
z.object({ page: z.coerce.number().default(1) })

// Params schemas - usually strings
z.object({ id: z.string().uuid() })

// Response schemas - by status code
{ 200: successSchema, 400: errorSchema }
```

## Dependencies

- **Peer**: `express`, `zod`, `express-middleware-chain` (optional)
- **Dev**: `typescript`, `tsup`, `vitest`, `tsd`, `supertest`

## Testing

```bash
pnpm test           # Run all tests
pnpm test:types     # Run type tests only
pnpm test:cov       # With coverage
```

## Key Integration: express-middleware-chain

When used with express-middleware-chain, spread the chain result:

```typescript
router.post(
  '/users',
  route({ body: schema }),
  ...chain().rateLimit({ limit: 100 }).build(),
  handler
);
```

## Response Type Strategy

Response types are **compile-time only** (no runtime validation):

```typescript
// TypedResponse constrains json() at compile time
interface TypedResponse<T> extends Response {
  json(body: T): this;
}
// No runtime check - trust TypeScript
```

## Remember

1. Zero runtime overhead for type features
2. Zod handles all runtime validation
3. express-middleware-chain is optional
4. Types erase at compile time
5. 85% test coverage minimum
