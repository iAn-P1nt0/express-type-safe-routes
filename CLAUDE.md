# CLAUDE.md - Express Type-Safe Routes

## Project Overview

**express-type-safe-routes** is a TypeScript utility package providing full type inference for Express.js routes via Zod schemas. It addresses a critical gap: Express has **NO TypeScript type inference for routes** (affecting 4M+ developers).

### Problem Statement

- Express routes lack TypeScript type inference for `req.params`, `req.body`, `req.query`
- Response types (`res.json()`) are completely untyped
- Middleware chains lose type information between handlers
- Developers resort to manual type assertions or `any` casts
- No seamless integration between validation and type inference

### Target Weekly Downloads: 80,000

### Core Value Proposition

- **Zero runtime overhead** - Types erased at compile time
- **Full type inference** - Params, body, query, and response from Zod schemas
- **Seamless integration** - Works directly with `express-middleware-chain`
- **Developer experience** - Autocomplete and type errors for route handlers

---

## Target API

### Basic Usage

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

// Full type inference for handler
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

### With express-middleware-chain Integration

```typescript
import { createTypedRouter, route } from 'express-type-safe-routes';
import { chain } from 'express-middleware-chain';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const router = createTypedRouter();

router.get(
  '/users/:id',
  route({ params: paramsSchema, query: querySchema }),
  ...chain().rateLimit({ limit: 100, window: '15m' }).build(),
  (req, res) => {
    // ✅ req.params.id is string (UUID validated)
    // ✅ req.query.page is number, req.query.limit is number
    const { id } = req.params;
    const { page, limit } = req.query;
  }
);
```

### Alternative: Fluent Route Builder

```typescript
import { typedRoute } from 'express-type-safe-routes';

const getUserRoute = typedRoute()
  .params(paramsSchema)
  .query(querySchema)
  .response(200, userResponseSchema)
  .handler((req, res) => {
    // Fully typed req and res
  });

router.get('/users/:id', ...getUserRoute.build());
```

---

## Architecture

### Directory Structure

```
express-type-safe-routes/
├── src/
│   ├── index.ts                  # Public API exports
│   ├── types.ts                  # Core type definitions
│   ├── route/
│   │   ├── route.ts              # route() schema helper
│   │   ├── RouteBuilder.ts       # Fluent route builder (alternative API)
│   │   └── index.ts
│   ├── router/
│   │   ├── TypedRouter.ts        # Express Router wrapper
│   │   ├── methods.ts            # HTTP method overloads
│   │   └── index.ts
│   ├── response/
│   │   ├── TypedResponse.ts      # Response type wrapper
│   │   └── index.ts
│   ├── validation/
│   │   ├── middleware.ts         # Runtime validation middleware
│   │   ├── inference.ts          # Type inference utilities
│   │   └── index.ts
│   └── utils/
│       ├── types.ts              # Utility types
│       └── index.ts
├── test/
│   ├── route/
│   ├── router/
│   ├── response/
│   ├── integration/
│   └── types/                    # Type-level tests (tsd)
├── examples/
│   ├── basic-crud/
│   ├── with-middleware-chain/
│   └── full-api/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── CLAUDE.md
├── AGENTS.md
└── README.md
```

### Core Components

#### 1. `route()` Schema Helper

The primary API for defining typed routes:

```typescript
function route<
  TBody extends z.ZodSchema = z.ZodUnknown,
  TQuery extends z.ZodSchema = z.ZodUnknown,
  TParams extends z.ZodSchema = z.ZodUnknown,
  TResponse extends ResponseSchemas = {}
>(schemas: RouteSchemas<TBody, TQuery, TParams, TResponse>): RouteDefinition<...>;
```

Returns middleware array + type marker for handler inference.

#### 2. `createTypedRouter()` Router Wrapper

Wraps `express.Router()` with overloaded method signatures:

```typescript
interface TypedRouter extends Router {
  get<TRoute extends RouteDefinition>(
    path: string,
    route: TRoute,
    ...handlers: TypedHandler<TRoute>[]
  ): this;

  post<TRoute extends RouteDefinition>(
    path: string,
    route: TRoute,
    ...handlers: TypedHandler<TRoute>[]
  ): this;

  // ... put, patch, delete, etc.
}
```

#### 3. `TypedRequest<T>` Interface

Extends Express Request with inferred types:

```typescript
interface TypedRequest<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown
> extends Request {
  body: TBody;
  query: TQuery;
  params: TParams;
}
```

#### 4. `TypedResponse<T>` Interface

Constrains response methods to schema:

```typescript
interface TypedResponse<TResponseSchemas extends ResponseSchemas>
  extends Response {
  json<TStatus extends keyof TResponseSchemas>(
    body: z.infer<TResponseSchemas[TStatus]>
  ): this;

  status<TStatus extends keyof TResponseSchemas>(
    code: TStatus
  ): TypedResponse<Pick<TResponseSchemas, TStatus>>;
}
```

---

## Design Decisions

### Response Type Enforcement: Compile-Time Only (Option A)

**Decision**: Wrapper type only, no runtime validation of responses.

**Rationale**:
- **Zero runtime overhead** - Types erased at compile, no performance impact
- **No double validation** - Response data already constructed by developer
- **Simpler mental model** - Validation on input, typing on output
- **Ecosystem alignment** - Matches TypeScript's design philosophy

**Implementation**:
```typescript
// TypedResponse is purely a type wrapper
type TypedResponse<T> = Omit<Response, 'json' | 'status'> & {
  json(body: T): this;
  status<S extends number>(code: S): TypedResponse<T>;
};
```

**Trade-off**: Runtime response mismatches won't be caught, but this is acceptable because:
1. Response data is developer-controlled (not external input)
2. Type errors caught at compile time in most cases
3. Integration tests should verify response shapes

### express-middleware-chain: Optional Peer Dependency

**Decision**: `peerDependenciesMeta.optional: true`

**Rationale**:
- Allow standalone use for pure type-safe routing
- Enable seamless integration when both packages installed
- No forced dependency for users who don't need middleware chaining

**Implementation**:
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

**Integration Pattern**:
```typescript
// Works standalone
router.post('/users', route({ body: userSchema }), handler);

// Works with middleware-chain
router.post(
  '/users',
  route({ body: userSchema }),
  ...chain().rateLimit({ limit: 100, window: '15m' }).build(),
  handler
);
```

### OpenAPI Generation: Phase 2 Scope

**Decision**: Defer OpenAPI metadata extraction to Phase 2.

**Rationale**:
- Core value is type safety, not documentation generation
- `express-swagger-auto` already handles OpenAPI generation
- Phase 1 focus: Perfect the type inference story

**Future Integration**:
```typescript
// Phase 2: Route metadata extraction for OpenAPI
const routeMeta = extractRouteMetadata(router);
// Returns schema definitions compatible with express-swagger-auto
```

---

## Implementation Guidelines

### TypeScript Patterns

#### 1. Generic Type Flow

```typescript
// Schemas flow through generics to infer handler types
type RouteSchemas<TBody, TQuery, TParams, TResponse> = {
  body?: TBody;
  query?: TQuery;
  params?: TParams;
  response?: TResponse;
};

type InferBody<T> = T extends { body: infer B extends z.ZodSchema }
  ? z.infer<B>
  : unknown;

type InferQuery<T> = T extends { query: infer Q extends z.ZodSchema }
  ? z.infer<Q>
  : ParsedQs;

type InferParams<T> = T extends { params: infer P extends z.ZodSchema }
  ? z.infer<P>
  : ParamsDictionary;
```

#### 2. Response Schema Inference

```typescript
type ResponseSchemas = {
  [statusCode: number]: z.ZodSchema;
};

type InferResponses<T> = T extends { response: infer R extends ResponseSchemas }
  ? { [K in keyof R]: z.infer<R[K]> }
  : unknown;
```

#### 3. Handler Type Construction

```typescript
type TypedHandler<TRoute extends RouteDefinition> = (
  req: TypedRequest<
    InferBody<TRoute>,
    InferQuery<TRoute>,
    InferParams<TRoute>
  >,
  res: TypedResponse<InferResponses<TRoute>>,
  next: NextFunction
) => void | Promise<void>;
```

### Strict TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### Zero Runtime Overhead Principle

The package should add **minimal to zero** runtime code. Core philosophy:

1. **Types only where possible** - Wrapper types, not wrapper classes
2. **Thin validation layer** - Reuse Zod's safeParse, don't re-implement
3. **No runtime type checking** - Trust TypeScript at compile time
4. **Lazy middleware creation** - Don't create middleware until needed

---

## Key Technical Challenges

### 1. Response Type Inference with Status Codes

**Challenge**: TypeScript needs to know which response schema to use based on `res.status()` call.

**Solution**: Chained type narrowing:

```typescript
interface TypedResponse<TSchemas extends ResponseSchemas> {
  status<TStatus extends keyof TSchemas & number>(
    code: TStatus
  ): TypedResponse<Pick<TSchemas, TStatus>>;

  json<TStatus extends keyof TSchemas>(
    body: TSchemas[TStatus] extends z.ZodSchema
      ? z.infer<TSchemas[TStatus]>
      : never
  ): this;
}
```

### 2. Express Method Overloading

**Challenge**: Express Router has complex method overloads; adding typed versions without breaking compatibility.

**Solution**: Wrapper function with generics, not class extension:

```typescript
function createTypedRouter(): TypedRouter {
  const router = express.Router();

  // Create typed method wrappers
  const typedGet = createTypedMethod(router, 'get');
  const typedPost = createTypedMethod(router, 'post');
  // ...

  return Object.assign(router, {
    get: typedGet,
    post: typedPost,
    // ... other methods
  });
}
```

### 3. Middleware Composition Type Flow

**Challenge**: Types must flow through middleware arrays without losing inference.

**Solution**: Use tuple types and spread operators:

```typescript
type MiddlewareArray<TRoute> = [
  RouteDefinition<TRoute>,
  ...RequestHandler[],
  TypedHandler<TRoute>
];
```

### 4. Optional Query Parameters

**Challenge**: Query parameters may be undefined; Zod defaults should be reflected in types.

**Solution**: Use `z.coerce` for query params and let Zod's type inference handle defaults:

```typescript
const querySchema = z.object({
  page: z.coerce.number().default(1),        // Type: number (not number | undefined)
  search: z.string().optional(),              // Type: string | undefined
});
```

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test

# Test with coverage
pnpm test:coverage

# Type tests (tsd)
pnpm test:types

# Lint
pnpm lint

# Type check
pnpm typecheck

# Build docs
pnpm docs
```

---

## Code Style

- **Functional patterns** over classes where possible
- **Composition** over inheritance
- **Descriptive generics**: `TBody`, `TQuery`, `TParams`, `TResponse`
- **No `any`** - Use `unknown` with type guards
- **JSDoc** on all public exports with `@example`
- **Conventional commits** for git messages

---

## Dependencies

### Production (Peer)
- `express` (^4.18.0 || ^5.0.0) - Express framework
- `zod` (^3.20.0) - Schema validation
- `express-middleware-chain` (^0.1.0, optional) - Middleware composition

### Development
- `typescript` - Compilation
- `tsup` - Bundling (ESM + CJS)
- `vitest` - Testing
- `tsd` - Type testing
- `express` - Integration testing
- `supertest` - HTTP testing
- `@types/express` - Express types

---

## Release Process

1. Update `CHANGELOG.md`
2. Bump version in `package.json`
3. Run full test suite including type tests
4. Build and verify package
5. Publish to npm
6. Tag release in git

---

## Phase Roadmap

### Phase 1: Core Type Safety (v0.1.0)
- [ ] `route()` schema helper with type inference
- [ ] `createTypedRouter()` wrapper
- [ ] `TypedRequest` and `TypedResponse` interfaces
- [ ] Zod validation middleware
- [ ] Basic integration with express-middleware-chain
- [ ] Examples: user CRUD, pagination

### Phase 2: OpenAPI Integration (v0.2.0)
- [ ] Route metadata extraction
- [ ] Schema serialization for OpenAPI
- [ ] Integration with express-swagger-auto
- [ ] Auto-generated route documentation

### Phase 3: Advanced Features (v0.3.0)
- [ ] Nested routers with type inheritance
- [ ] Route path type inference (param extraction from string)
- [ ] Response streaming types
- [ ] File upload types
