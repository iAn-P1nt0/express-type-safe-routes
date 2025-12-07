import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { createTypedRouter, route } from '../../src';
import type { TypedRequest, TypedResponse } from '../../src';

describe('validation middleware via route()', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  it('validates body schema and returns 400 on failure', async () => {
    const router = createTypedRouter();
    const userSchema = z.object({ email: z.string().email() });

    router.post('/users', route({ body: userSchema }), (req: TypedRequest<z.infer<typeof userSchema>>, res: TypedResponse<{ email: string }>) => {
      res.json({ email: req.body.email });
    });

    app.use(router);

    const bad = await request(app)
      .post('/users')
      .send({ email: 'not-an-email' });

    expect(bad.status).toBe(400);
    expect(bad.body).toHaveProperty('error');
    expect(bad.body).toHaveProperty('details');

    const good = await request(app)
      .post('/users')
      .send({ email: 'user@example.com' });

    expect(good.status).toBe(200);
    expect(good.body).toEqual({ email: 'user@example.com' });
  });

  it('validates params and query schemas', async () => {
    const router = createTypedRouter();
    const paramsSchema = z.object({ id: z.string().uuid() });
    const querySchema = z.object({ page: z.coerce.number().int().min(1).default(1) });

    router.get(
      '/items/:id',
      route({ params: paramsSchema, query: querySchema }),
      (
        req: TypedRequest<unknown, z.infer<typeof querySchema>, z.infer<typeof paramsSchema>>,
        res: TypedResponse<{ id: string; page: number }>
      ) => {
      res.json({ id: req.params.id, page: req.query.page });
      }
    );

    app.use(router);

    const badParams = await request(app).get('/items/not-a-uuid');
    expect(badParams.status).toBe(400);

    const good = await request(app).get('/items/00000000-0000-0000-0000-000000000000?page=2');
    expect(good.status).toBe(200);
    expect(good.body).toEqual({ id: '00000000-0000-0000-0000-000000000000', page: 2 });
  });
});
