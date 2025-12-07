# Fluent Builder API Example

This example demonstrates the fluent route builder API with a product catalog.

## Features Demonstrated

- ✅ Fluent route builder with `.body()`, `.query()`, `.params()`, `.response()`
- ✅ Complex search/filtering with multiple query parameters
- ✅ Custom middleware integration via `.use()`
- ✅ Multiple response status codes
- ✅ Type inference across the builder chain

## Running the Example

```bash
# From the examples/fluent-builder directory
npx ts-node server.ts
```

## Testing the API

### Create a Product

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "price": 999.99,
    "category": "electronics",
    "inStock": true
  }'
```

### Search Products

```bash
# Search by name
curl "http://localhost:3000/api/products?q=laptop"

# Filter by category
curl "http://localhost:3000/api/products?category=electronics"

# Filter by price range
curl "http://localhost:3000/api/products?minPrice=500&maxPrice=1500"

# Combined filters with pagination
curl "http://localhost:3000/api/products?category=electronics&minPrice=500&page=1&limit=10"
```

### Get a Product

```bash
curl http://localhost:3000/api/products/{id}
```

### Update a Product

```bash
curl -X PUT http://localhost:3000/api/products/{id} \
  -H "Content-Type: application/json" \
  -d '{"price": 899.99}'
```

### Delete a Product

```bash
curl -X DELETE http://localhost:3000/api/products/{id}
```

## Fluent Builder Benefits

1. **Readable**: Each schema is clearly labeled (`.body()`, `.query()`, etc.)
2. **Composable**: Chain methods together in any order
3. **Middleware Integration**: Use `.use()` to add custom middleware
4. **Type-Safe**: Full type inference throughout the chain
5. **Reusable**: Route definitions can be exported and reused
