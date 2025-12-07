import { expectType, expectError, expectAssignable } from 'tsd';
import { z } from 'zod';
import { route, TypedRequest, TypedResponse, createTypedRouter } from '../../src';

const userSchema = z.object({ email: z.string().email(), name: z.string() });
const responseSchemas = { 201: z.object({ id: z.string(), email: z.string() }) } as const;

const userRoute = route({ body: userSchema, response: responseSchemas });

// Verify route definition structure
expectType<'RouteDefinition'>(userRoute.__brand);

const router = createTypedRouter();
router.post('/users', userRoute, (req, res) => {
  // Verify request types
  expectAssignable<TypedRequest<{ email: string; name: string }, unknown, unknown>>(req);

  // Verify req.body has correct type
  expectType<{ email: string; name: string }>(req.body);

  // Verify response type
  expectAssignable<TypedResponse<typeof responseSchemas>>(res);

  // Should error if wrong response shape (id should be string not number)
  expectError(
    res.status(201).json({ id: 123, email: 'x@example.com' })
  );

  // Should work with correct response shape
  res.status(201).json({ id: 'abc', email: req.body.email });
});
