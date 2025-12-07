import express from 'express';
import { createTypedRouter, route } from 'express-type-safe-routes';
import { z } from 'zod';

const app = express();
app.use(express.json());

const router = createTypedRouter();

// User schemas
const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  age: z.number().int().min(18).optional(),
});

const userResponseSchema = userSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const userIdSchema = z.object({
  id: z.string().uuid(),
});

const updateUserSchema = userSchema.partial();

// In-memory storage (use a real database in production)
const users = new Map<string, z.infer<typeof userResponseSchema>>();

// CREATE - POST /users
router.post(
  '/users',
  route({
    body: userSchema,
    response: { 201: userResponseSchema },
  }),
  (req, res) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const user = {
      id,
      ...req.body,
      createdAt: now,
      updatedAt: now,
    };

    users.set(id, user);

    res.status(201).json(user);
  }
);

// READ - GET /users/:id
router.get(
  '/users/:id',
  route({
    params: userIdSchema,
    response: {
      200: userResponseSchema,
      404: z.object({ error: z.string() }),
    },
  }),
  (req, res) => {
    const { id } = req.params;
    const user = users.get(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json(user);
  }
);

// READ ALL - GET /users
router.get(
  '/users',
  route({
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
    response: {
      200: z.object({
        users: z.array(userResponseSchema),
        page: z.number(),
        limit: z.number(),
        total: z.number(),
      }),
    },
  }),
  (req, res) => {
    const { page, limit } = req.query;
    const allUsers = Array.from(users.values());

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedUsers = allUsers.slice(start, end);

    res.status(200).json({
      users: paginatedUsers,
      page,
      limit,
      total: allUsers.length,
    });
  }
);

// UPDATE - PUT /users/:id
router.put(
  '/users/:id',
  route({
    params: userIdSchema,
    body: updateUserSchema,
    response: {
      200: userResponseSchema,
      404: z.object({ error: z.string() }),
    },
  }),
  (req, res) => {
    const { id } = req.params;
    const user = users.get(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updatedUser = {
      ...user,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    users.set(id, updatedUser);

    res.status(200).json(updatedUser);
  }
);

// DELETE - DELETE /users/:id
router.delete(
  '/users/:id',
  route({
    params: userIdSchema,
    response: {
      204: z.object({}),
      404: z.object({ error: z.string() }),
    },
  }),
  (req, res) => {
    const { id } = req.params;

    if (!users.has(id)) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    users.delete(id);
    res.status(204).json({});
  }
);

app.use('/api', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/api/users`);
});
