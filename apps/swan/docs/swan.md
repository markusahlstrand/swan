# Swan Framework - Complete Reference for AI Assistants

Swan is a comprehensive framework for building, deploying, and maintaining microservices with best practices built-in. This document provides complete reference information optimized for AI assistants and automated tooling.

## Overview

Swan allows developers to define service architectures once and generate production-ready code for multiple technology stacks and deployment targets. The framework emphasizes:

- **Specification-Driven Development**: YAML-based service definitions
- **Multi-Stack Code Generation**: Support for Node.js, Python, Rust, Go, .NET
- **Deployment Flexibility**: Multiple hosting platforms from serverless to containers
- **Built-in Best Practices**: Authentication, monitoring, validation, documentation

## Core Concepts

### Service Specification (swan.yaml)

The central configuration file that defines your entire service:

```yaml
service:
  name: "my-service"
  version: "1.0.0"
  description: "Service description"

api:
  base_path: "/api/v1"

authentication:
  type: "jwt|api_key|oauth2|mtls"

database:
  type: "postgresql|mysql|sqlite|mongodb"

endpoints:
  - path: "/users"
    method: "GET|POST|PUT|DELETE|PATCH"
    summary: "Endpoint description"
    auth_required: true|false

schemas:
  ModelName:
    type: "object"
    properties: {}
```

### Technology Stacks

Swan supports five primary stacks with framework options:

1. **Node.js**: Express, Fastify
2. **Python**: FastAPI, Flask
3. **Rust**: Axum, Warp
4. **Go**: Gin, Echo
5. **.NET**: ASP.NET Core

### Deployment Targets

Supported deployment platforms:

1. **Serverless**: Cloudflare Workers, Vercel, AWS Lambda
2. **Containers**: Docker, Kubernetes, Google Cloud Run
3. **Platform-as-a-Service**: Heroku, Railway, Fly.io

## CLI Commands Reference

### Project Initialization

```bash
# Create new service
swan init <service-name>

# Generate from template
swan generate --template <template-name> --stack <stack>
```

### Code Generation

```bash
# Generate service code
swan generate --stack <nodejs|python|rust|go|dotnet> --framework <framework>

# Supported stack/framework combinations:
# nodejs: express, fastify
# python: fastapi, flask
# rust: axum, warp
# go: gin, echo
# dotnet: aspnetcore
```

### Development

```bash
# Start development server
swan dev

# Run tests
swan test [unit|integration|e2e]

# Database operations
swan db migrate
swan db generate-migration <name>
```

### Deployment

```bash
# Deploy to platform
swan deploy <platform> --env <environment>

# Supported platforms:
# cloudflare, vercel, aws-lambda, docker, heroku, railway, fly
```

### Documentation

```bash
# Generate API documentation
swan docs generate

# Serve documentation
swan docs serve
```

## Stack-Specific Implementation Details

### Node.js Stack

**Generated Structure:**

```
src/
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # Data models
├── routes/          # Route definitions
├── services/        # Business logic
└── utils/           # Utilities
```

**Key Features:**

- TypeScript support by default
- Express or Fastify framework
- Prisma ORM integration
- Jest testing framework
- ESLint/Prettier configuration

**Example Generated Controller:**

```typescript
@Controller("/users")
export class UsersController {
  @Get()
  async getUsers(@Query() query: PaginationQuery): Promise<UserResponse[]> {
    return this.userService.findMany(query);
  }

  @Post()
  async createUser(@Body() userData: CreateUserRequest): Promise<UserResponse> {
    return this.userService.create(userData);
  }
}
```

### Python Stack

**Generated Structure:**

```
app/
├── api/routes/      # FastAPI routers
├── core/            # Core configuration
├── models/          # SQLAlchemy models
├── schemas/         # Pydantic schemas
├── services/        # Business logic
└── utils/           # Utilities
```

**Key Features:**

- FastAPI or Flask framework
- Pydantic data validation
- SQLAlchemy ORM
- Pytest testing framework
- Automatic OpenAPI generation

**Example Generated Route:**

```python
@router.get("/users", response_model=List[UserResponse])
async def get_users(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    return await user_service.get_users(db, limit, offset)
```

### Rust Stack

**Generated Structure:**

```
src/
├── handlers/        # Request handlers
├── models/          # Data structures
├── services/        # Business logic
├── middleware/      # Axum middleware
└── utils/           # Utilities
```

**Key Features:**

- Axum or Warp framework
- Serde serialization
- SQLx database integration
- Tokio async runtime
- Comprehensive error handling

### Go Stack

**Generated Structure:**

```
cmd/server/          # Application entry
internal/
├── handler/         # HTTP handlers
├── model/           # Data models
├── service/         # Business logic
└── repository/      # Data access
```

**Key Features:**

- Gin or Echo framework
- GORM database integration
- Testify testing framework
- Structured logging
- Clean architecture pattern

### .NET Stack

**Generated Structure:**

```
src/
├── Controllers/     # API controllers
├── Models/          # Data models
├── Services/        # Business logic
├── Repositories/    # Data access
└── Middleware/      # ASP.NET middleware
```

**Key Features:**

- ASP.NET Core framework
- Entity Framework Core
- Built-in dependency injection
- xUnit testing framework
- Comprehensive validation

## Deployment Platform Details

### Cloudflare Workers

**Configuration:** `wrangler.toml`
**Runtime:** V8 JavaScript engine
**Limitations:**

- 1MB bundle size limit
- 128MB memory limit
- 10ms CPU time per request
- Edge computing model

**Optimal For:**

- Global latency-sensitive applications
- Stateless API services
- Edge computing workloads

### Docker Deployments

**Generated Files:**

- Multi-stage Dockerfile
- docker-compose.yml
- Kubernetes manifests
- Health check endpoints

**Features:**

- Optimized image sizes
- Security best practices
- Resource limit configuration
- Monitoring integration

### Serverless Platforms (Vercel/AWS Lambda)

**Characteristics:**

- Cold start considerations
- Stateless execution model
- Auto-scaling capabilities
- Pay-per-request pricing

## Authentication Patterns

### JWT Authentication

```yaml
authentication:
  jwt:
    secret: "${JWT_SECRET}"
    algorithm: "HS256|RS256"
    expiration: "24h"
    issuer: "service-name"
```

### API Key Authentication

```yaml
authentication:
  api_key:
    header: "X-API-Key"
    location: "header|query"
```

### OAuth2 Integration

```yaml
authentication:
  oauth2:
    provider: "auth0|google|github|custom"
    client_id: "${OAUTH_CLIENT_ID}"
    scopes: ["openid", "profile", "email"]
```

## Database Integration Patterns

### PostgreSQL Configuration

```yaml
database:
  type: "postgresql"
  connection_string: "${DATABASE_URL}"
  pool_size: 10
  ssl_mode: "require"
```

### Migration Management

```bash
# Auto-generated migration files
migrations/
├── 001_initial_schema.sql
├── 002_add_users_table.sql
└── 003_add_indexes.sql
```

## Monitoring and Observability

### Built-in Metrics

- HTTP request metrics (count, duration, status codes)
- Database query performance
- Memory and CPU usage
- Custom business metrics

### Logging Configuration

```yaml
logging:
  level: "debug|info|warn|error"
  format: "json|text"
  structured: true
```

### Health Check Implementation

```yaml
health:
  endpoint: "/health"
  checks:
    - name: "database"
      type: "postgresql"
      timeout: "5s"
    - name: "redis"
      type: "redis"
      timeout: "2s"
```

## Error Handling Patterns

### Standardized Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid format"
    },
    "trace_id": "abc123"
  }
}
```

### HTTP Status Code Mapping

- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 409: Conflict (resource already exists)
- 422: Unprocessable Entity (semantic errors)
- 429: Too Many Requests (rate limiting)
- 500: Internal Server Error (unexpected errors)

## Validation Patterns

### Schema-Based Validation

```yaml
schemas:
  CreateUserRequest:
    type: "object"
    required: ["email", "password"]
    properties:
      email:
        type: "string"
        format: "email"
      password:
        type: "string"
        minLength: 8
        pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)"
```

## Common Use Cases and Patterns

### RESTful CRUD API

- Standard HTTP methods (GET, POST, PUT, DELETE)
- Pagination support
- Filtering and sorting
- Validation and error handling

### File Upload Service

- Multipart form data handling
- File type validation
- Size limits
- Cloud storage integration (S3, GCS, Azure)

### Authentication Service

- User registration and login
- Password hashing (bcrypt/argon2)
- JWT token generation and validation
- Rate limiting for auth endpoints

### Analytics/Event Tracking

- Event ingestion endpoints
- Time-series data storage
- Aggregation and reporting
- Real-time metrics

## Configuration Management

### Environment Variables

```bash
# Required environment variables by feature:

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Authentication
JWT_SECRET=your-secret-key
OAUTH_CLIENT_ID=oauth-client-id
OAUTH_CLIENT_SECRET=oauth-client-secret

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info

# Deployment
PORT=3000
NODE_ENV=production
```

### Multi-Environment Support

```yaml
environments:
  development:
    database_url: "postgresql://localhost/dev"
    log_level: "debug"

  staging:
    database_url: "${STAGING_DATABASE_URL}"
    log_level: "info"

  production:
    database_url: "${DATABASE_URL}"
    log_level: "warn"
    rate_limiting: true
```

## Links to Detailed Documentation

For comprehensive guides, see:

- **Architecture**: [Service Architecture Best Practices](./architecture/index.md)
- **Technology Stacks**:
  - [Node.js Implementation](./stacks/nodejs.md)
  - [Python Implementation](./stacks/python.md)
  - [Rust Implementation](./stacks/rust.md)
  - [Go Implementation](./stacks/golang.md)
  - [.NET Implementation](./stacks/dotnet.md)
- **Deployment Platforms**:
  - [Cloudflare Workers](./deployment/cloudflare.md)
  - [Docker Deployment](./deployment/docker.md)
- **Templates**: [Service Templates Library](./templates/index.md)
- **Getting Started**: [Complete Tutorial](./guide/getting-started.md)
