# OpenAPI Integration

Swan automatically generates comprehensive OpenAPI 3.0 specifications from your service definitions, enabling powerful tooling and documentation workflows.

## Automatic Generation

Swan converts your service specification into valid OpenAPI documents:

```yaml
# swan.yaml
service:
  name: "user-service"
  version: "1.0.0"
  description: "User management service"

endpoints:
  - path: "/users"
    method: "GET"
    summary: "List users"
    parameters:
      - name: "limit"
        type: "integer"
        default: 10
    responses:
      200:
        description: "List of users"
        schema:
          type: "array"
          items:
            $ref: "#/components/schemas/User"
```

**Generated OpenAPI:**

```yaml
openapi: 3.0.0
info:
  title: User Service
  version: 1.0.0
  description: User management service
paths:
  /users:
    get:
      summary: List users
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
      responses:
        "200":
          description: List of users
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/User"
```

## Schema Definitions

### Basic Types

```yaml
schemas:
  User:
    type: "object"
    required: ["id", "email"]
    properties:
      id:
        type: "string"
        format: "uuid"
        description: "User unique identifier"
      email:
        type: "string"
        format: "email"
        description: "User email address"
      name:
        type: "string"
        minLength: 1
        maxLength: 100
      created_at:
        type: "string"
        format: "date-time"
        readOnly: true
```

### Nested Objects

```yaml
schemas:
  UserProfile:
    type: "object"
    properties:
      user:
        $ref: "#/components/schemas/User"
      preferences:
        type: "object"
        properties:
          theme:
            type: "string"
            enum: ["light", "dark"]
          notifications:
            type: "boolean"
```

### Validation Rules

```yaml
schemas:
  CreateUserRequest:
    type: "object"
    required: ["email", "password"]
    properties:
      email:
        type: "string"
        format: "email"
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
      password:
        type: "string"
        minLength: 8
        maxLength: 128
        description: "Must contain at least one uppercase, lowercase, and number"
      age:
        type: "integer"
        minimum: 18
        maximum: 120
```

## Documentation Features

### Rich Descriptions

Add comprehensive documentation to your APIs:

```yaml
endpoints:
  - path: "/users/{id}"
    method: "GET"
    summary: "Get user by ID"
    description: |
      Retrieves a single user by their unique identifier.

      ## Usage

      This endpoint requires authentication and the `users:read` permission.

      ## Rate Limiting

      Limited to 100 requests per minute per user.
    parameters:
      - name: "id"
        in: "path"
        required: true
        description: "The user's unique identifier"
        schema:
          type: "string"
          format: "uuid"
        example: "550e8400-e29b-41d4-a716-446655440000"
```

### Examples

```yaml
schemas:
  User:
    type: "object"
    properties:
      id:
        type: "string"
        format: "uuid"
      email:
        type: "string"
        format: "email"
    example:
      id: "550e8400-e29b-41d4-a716-446655440000"
      email: "john.doe@example.com"
      name: "John Doe"
      created_at: "2023-01-15T10:30:00Z"
```

### Response Examples

```yaml
responses:
  200:
    description: "User retrieved successfully"
    content:
      application/json:
        schema:
          $ref: "#/components/schemas/User"
        examples:
          standard_user:
            summary: "Standard user example"
            value:
              id: "550e8400-e29b-41d4-a716-446655440000"
              email: "john@example.com"
              name: "John Doe"
          admin_user:
            summary: "Admin user example"
            value:
              id: "550e8400-e29b-41d4-a716-446655440001"
              email: "admin@example.com"
              name: "Admin User"
              role: "administrator"
```

## Tools Integration

### Swagger UI

Automatic interactive documentation:

```bash
# Start documentation server
swan docs serve --port 3001

# Generate static docs
swan docs build --output ./docs
```

### Client Generation

Generate clients for multiple languages:

```bash
# Generate TypeScript client
swan generate client --lang typescript --output ./clients/ts

# Generate Python client
swan generate client --lang python --output ./clients/python

# Generate Go client
swan generate client --lang go --output ./clients/go
```

### Postman Collections

Export API collections for testing:

```bash
# Generate Postman collection
swan generate postman --output ./postman/collection.json
```

## Advanced Features

### Custom Extensions

```yaml
# Add vendor extensions
info:
  x-logo:
    url: "https://example.com/logo.png"
    altText: "Company Logo"
  x-api-id: "user-service-v1"

paths:
  /users:
    get:
      x-rate-limit: 100
      x-cache-ttl: 300
```

### Security Schemes

```yaml
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    OAuth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://auth.example.com/oauth/authorize
          tokenUrl: https://auth.example.com/oauth/token
          scopes:
            users:read: Read user information
            users:write: Modify user information
```

## Validation & Testing

### Schema Validation

Automatically validate requests and responses:

```yaml
validation:
  requests: true
  responses: true
  strict: true # Fail on unknown properties
```

### Contract Testing

Ensure implementation matches specification:

```bash
# Run contract tests
swan test contract --spec ./swagger.yaml --base-url http://localhost:3000

# Generate test cases
swan generate tests --output ./tests/contract
```

## Documentation Deployment

Deploy documentation to various platforms:

```bash
# Deploy to GitHub Pages
swan docs deploy github-pages

# Deploy to Netlify
swan docs deploy netlify

# Deploy to custom host
swan docs deploy --host https://docs.myservice.com
```
