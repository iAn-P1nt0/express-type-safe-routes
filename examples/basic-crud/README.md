# Basic CRUD Example

This example demonstrates a complete CRUD API for user management with full type safety.

## Features Demonstrated

- ✅ POST /users - Create user with body validation
- ✅ GET /users/:id - Get user by ID with param validation
- ✅ GET /users - List users with pagination (query validation)
- ✅ PUT /users/:id - Update user
- ✅ DELETE /users/:id - Delete user
- ✅ Response type enforcement
- ✅ Error handling with typed responses

## Running the Example

```bash
# From the examples/basic-crud directory
npx ts-node server.ts
```

## Testing the API

### Create a User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "name": "John Doe", "age": 30}'
```

### Get a User

```bash
curl http://localhost:3000/api/users/{id}
```

### List Users with Pagination

```bash
curl "http://localhost:3000/api/users?page=1&limit=10"
```

### Update a User

```bash
curl -X PUT http://localhost:3000/api/users/{id} \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe"}'
```

### Delete a User

```bash
curl -X DELETE http://localhost:3000/api/users/{id}
```

## Type Safety Features

1. **Request Validation**: All request bodies, params, and queries are validated against Zod schemas
2. **Type Inference**: Handler parameters are fully typed based on schemas
3. **Response Enforcement**: Response shapes are enforced by TypeScript
4. **Error Responses**: Even error responses are typed
