# express-type-safe-routes

> Type-safe Express routes with Zod-powered inference for params, query, body, and responses.

[![npm version](https://img.shields.io/npm/v/express-type-safe-routes.svg)](https://www.npmjs.com/package/express-type-safe-routes)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## The Problem

Express.js has **NO TypeScript type inference for routes**, affecting 4M+ developers:

- `req.params`, `req.body`, `req.query` are all typed as `any`
- Response types (`res.json()`) are completely untyped
- Middleware chains lose type information between handlers
- Developers resort to manual type assertions or `any` casts
- No seamless integration between validation and type inference

## The Solution

`express-type-safe-routes` provides **full type inference** from Zod schemas with **zero runtime overhead**:

```typescript
import { createTypedRouter, route } from 'express-type-safe-routes';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

const userResponseSchema = userSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
});

const router = createTypedRouter();

router.post(
  '/users',
  route({
    body: userSchema,
    response: { 201: userResponseSchema },
  }),
  (req, res) => {
    // ✅ req.body is { email: string; name: string }
    const { email, name } = req.body;

    // ✅ res.status(201).json() enforces { id, email, name, createdAt }
    res.status(201).json({
      id: crypto.randomUUID(),
      email,
      name,
      createdAt: new Date().toISOString(),
    });
  }
);
```

## Features

- **Zero runtime overhead** - Types erased at compile time
- **Full type inference** - Params, body, query, and response from Zod schemas
- **Runtime validation** - Automatic request validation with Zod
- **Seamless integration** - Works directly with `express-middleware-chain`
- **Developer experience** - Autocomplete and type errors for route handlers

## Installation

```bash
npm install express-type-safe-routes express zod
# or
pnpm add express-type-safe-routes express zod
# or
yarn add express-type-safe-routes express zod
```

## Quick Start

### Basic Usage

```typescript
import express from 'express';
import { createTypedRouter, route } from 'express-type-safe-routes';
import { z } from 'zod';

const app = express();
app.use(express.json());

const router = createTypedRouter();

// Define schemas
const getUserParams = z.object({
  id: z.string().uuid(),
});

const getUserResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
});

// Type-safe route
router.get(
  '/users/:id',
  route({
    params: getUserParams,
    response: { 200: getUserResponse },
  }),
  (req, res) => {
    // req.params.id is string (UUID validated)
    const { id } = req.params;

    // res.json() enforces the response schema
    res.status(200).json({
      id,
      name: 'John Doe',
      email: 'john@example.com',
    });
  }
);

app.use('/api', router);
app.listen(3000);
```

### With Query Parameters

```typescript
const searchSchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get(
  '/search',
  route({ query: searchSchema }),
  (req, res) => {
    // ✅ req.query.q is string
    // ✅ req.query.page is number (with default value)
    // ✅ req.query.limit is number (with default value)
    const { q, page, limit } = req.query;

    res.json({ results: [], page, limit, query: q });
  }
);
```

### With express-middleware-chain Integration

```typescript
import { chain } from 'express-middleware-chain';

router.post(
  '/users',
  route({ body: userSchema }),
  ...chain()
    .rateLimit({ limit: 100, window: '15m' })
    .authenticate()
    .build(),
  (req, res) => {
    // ✅ Fully typed req.body after middleware chain
    const user = req.body;
    // Handle user creation
  }
);
```

### Alternative: Fluent Route Builder

```typescript
import { typedRoute } from 'express-type-safe-routes';

const getUserRoute = typedRoute()
  .params(getUserParams)
  .query(searchSchema)
  .response(200, getUserResponse)
  .handler((req, res) => {
    // Fully typed req and res
    const { id } = req.params;
    const { page } = req.query;

    res.status(200).json({
      id,
      name: 'John',
      email: 'john@example.com',
    });
  });

router.get('/users/:id', ...getUserRoute.build());
```

## API Reference

### `route(schemas)`

Creates a route definition with type inference from Zod schemas.

```typescript
function route<TBody, TQuery, TParams, TResponse>(
  schemas: RouteSchemas<TBody, TQuery, TParams, TResponse>
): RouteDefinition
```

**Parameters:**
- `schemas.body?` - Zod schema for request body
- `schemas.query?` - Zod schema for query parameters
- `schemas.params?` - Zod schema for route parameters
- `schemas.response?` - Object mapping status codes to Zod response schemas

**Returns:** RouteDefinition that provides type inference to handlers

### `createTypedRouter()`

Creates an Express router with typed method overloads.

```typescript
function createTypedRouter(): TypedRouter
```

**Returns:** TypedRouter with type-safe `.get()`, `.post()`, `.put()`, `.patch()`, `.delete()` methods

### `typedRoute()`

Creates a fluent route builder for defining routes step-by-step.

```typescript
function typedRoute(): RouteBuilder
```

**Methods:**
- `.body(schema)` - Set body schema
- `.query(schema)` - Set query schema
- `.params(schema)` - Set params schema
- `.response(status, schema)` - Add response schema for status code
- `.use(middleware)` - Add middleware
- `.handler(fn)` - Set handler and build route

### Type Utilities

```typescript
import type {
  InferBody,
  InferQuery,
  InferParams,
  InferResponses,
  TypedRequest,
  TypedResponse,
  TypedHandler,
} from 'express-type-safe-routes';

// Extract types from route definition
type Body = InferBody<typeof myRoute>;
type Query = InferQuery<typeof myRoute>;
type Params = InferParams<typeof myRoute>;
type Responses = InferResponses<typeof myRoute>;

// Use in handler types
const handler: TypedHandler<Body, Query, Params, Responses> = (req, res) => {
  // Fully typed
};
```

## Validation Behavior

- **Automatic validation**: Requests are validated against schemas before reaching handlers
- **Validation errors**: Return 400 with detailed error information
- **Type coercion**: Query parameters are coerced using Zod's `z.coerce.*` helpers
- **Error format**:

```typescript
{
  "error": "Validation failed",
  "details": [
    {
      "location": "body" | "query" | "params",
      "issues": [ /* Zod error issues */ ]
    }
  ]
}
```

## Examples

See the [examples](./examples) directory for:
- Basic CRUD operations
- Pagination and filtering
- Integration with express-middleware-chain
- Full API implementation

## TypeScript Configuration

Recommended `tsconfig.json` settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## FAQ

### Why not use tRPC or GraphQL?

`express-type-safe-routes` is designed for existing Express applications. If you're building a new API from scratch, tRPC or GraphQL might be better choices. But if you have an existing Express app and want type safety without a complete rewrite, this library is perfect.

### Does this validate responses at runtime?

No. Response schemas are used **only for compile-time type checking**. This follows TypeScript's design philosophy and avoids unnecessary runtime overhead. If you need runtime response validation, you can manually call `schema.parse()` before sending responses.

### Can I use this with express-validator or joi?

You can, but you'll lose the automatic type inference. This library is designed specifically for Zod because Zod provides excellent TypeScript integration out of the box.

### Is this compatible with express-middleware-chain?

Yes! `express-middleware-chain` is an optional peer dependency. When both are installed, you can seamlessly compose middleware chains with typed routes.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT © [Your Name]

## Related Projects

- [express-middleware-chain](https://github.com/yourusername/express-middleware-chain) - Fluent middleware composition for Express
- [Zod](https://github.com/colinhacks/zod) - TypeScript-first schema validation
- [tRPC](https://trpc.io) - End-to-end typesafe APIs
