import express from 'express';
import { createTypedRouter, typedRoute } from 'express-type-safe-routes';
import { z } from 'zod';

const app = express();
app.use(express.json());

const router = createTypedRouter();

// Product schemas
const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.enum(['electronics', 'clothing', 'food', 'other']),
  inStock: z.boolean().default(true),
});

const productIdSchema = z.object({
  id: z.string().uuid(),
});

const searchQuerySchema = z.object({
  q: z.string().optional(),
  category: z.enum(['electronics', 'clothing', 'food', 'other']).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const productResponseSchema = productSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
});

const errorSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});

// In-memory storage
const products = new Map<string, z.infer<typeof productResponseSchema>>();

// Fluent builder example: Create Product
const createProductRoute = typedRoute()
  .body(productSchema)
  .response(201, productResponseSchema)
  .response(400, errorSchema)
  .handler((req, res) => {
    const id = crypto.randomUUID();
    const product = {
      id,
      ...req.body,
      createdAt: new Date().toISOString(),
    };

    products.set(id, product);

    res.status(201).json(product);
  });

router.post('/products', ...createProductRoute.build());

// Fluent builder example: Search Products
const searchProductsRoute = typedRoute()
  .query(searchQuerySchema)
  .response(
    200,
    z.object({
      products: z.array(productResponseSchema),
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      hasMore: z.boolean(),
    })
  )
  .handler((req, res) => {
    const { q, category, minPrice, maxPrice, page, limit } = req.query;

    let filtered = Array.from(products.values());

    // Filter by search query
    if (q) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(q.toLowerCase())
      );
    }

    // Filter by category
    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }

    // Filter by price range
    if (minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= minPrice);
    }
    if (maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= maxPrice);
    }

    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    res.status(200).json({
      products: paginated,
      total: filtered.length,
      page,
      limit,
      hasMore: end < filtered.length,
    });
  });

router.get('/products', ...searchProductsRoute.build());

// Fluent builder example: Get Product
const getProductRoute = typedRoute()
  .params(productIdSchema)
  .response(200, productResponseSchema)
  .response(404, errorSchema)
  .handler((req, res) => {
    const { id } = req.params;
    const product = products.get(id);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.status(200).json(product);
  });

router.get('/products/:id', ...getProductRoute.build());

// Fluent builder example: Update Product with Middleware
const updateProductRoute = typedRoute()
  .params(productIdSchema)
  .body(productSchema.partial())
  .response(200, productResponseSchema)
  .response(404, errorSchema)
  // Add custom middleware
  .use((req, res, next) => {
    console.log(`Updating product: ${req.params.id}`);
    next();
  })
  .handler((req, res) => {
    const { id } = req.params;
    const product = products.get(id);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const updated = {
      ...product,
      ...req.body,
    };

    products.set(id, updated);

    res.status(200).json(updated);
  });

router.put('/products/:id', ...updateProductRoute.build());

// Fluent builder example: Delete Product
const deleteProductRoute = typedRoute()
  .params(productIdSchema)
  .response(204, z.object({}))
  .response(404, errorSchema)
  .handler((req, res) => {
    const { id } = req.params;

    if (!products.has(id)) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    products.delete(id);
    res.status(204).json({});
  });

router.delete('/products/:id', ...deleteProductRoute.build());

app.use('/api', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/api/products`);
});
