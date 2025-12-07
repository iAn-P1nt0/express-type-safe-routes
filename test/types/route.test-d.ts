import { expectType, expectError, expectAssignable } from 'tsd';
import { z } from 'zod';
import { route, TypedRequest, TypedResponse, TypedHandler, createTypedRouter, InferBody, InferQuery, InferParams, InferResponses } from '../../src';

const userSchema = z.object({ email: z.string().email(), name: z.string() });
const responseSchemas = { 201: z.object({ id: z.string(), email: z.string() }) } as const;

const userRoute = route({ body: userSchema, response: responseSchemas });

// Verify route definition structure
expectType<'RouteDefinition'>(userRoute.__brand);

// Verify inferred types from route definition
expectType<{ email: string; name: string }>(null as any as InferBody<typeof userRoute>);
expectType<unknown>(null as any as InferQuery<typeof userRoute>);
expectType<unknown>(null as any as InferParams<typeof userRoute>);
expectType<typeof responseSchemas>(null as any as InferResponses<typeof userRoute>);

const router = createTypedRouter();

// Explicitly typed handler
const handler: TypedHandler<
  InferBody<typeof userRoute>,
  InferQuery<typeof userRoute>,
  InferParams<typeof userRoute>,
  InferResponses<typeof userRoute>
> = (req, res) => {
  // Verify request types
  expectType<{ email: string; name: string }>(req.body);

  // Should error if wrong response shape (id should be string not number)
  expectError(
    res.status(201).json({ id: 123, email: 'x@example.com' })
  );

  // Should work with correct response shape
  res.status(201).json({ id: 'abc', email: req.body.email });
};

router.post('/users', userRoute, handler);
