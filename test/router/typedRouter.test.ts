import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { createTypedRouter, route } from '../../src';

describe('createTypedRouter', () => {
  let app: express.Express;

  beforeEach(() => 
    {
    app = express();
    app.use(express.json());
  });

  it('composes route middleware and handler', async () => {
    const router = createTypedRouter();
    const bodySchema = z.object({ name: z.string().min(2) });

    router.post(
      '/hello',
      route({ body: bodySchema }),
      (req, res) => {
        res.status(201).json({ message: `Hello ${req.body.name}` });
      }
    );

    app.use(router);

    const res = await request(app).post('/hello').send({ name: 'Ada' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: 'Hello Ada' });
  });
});
