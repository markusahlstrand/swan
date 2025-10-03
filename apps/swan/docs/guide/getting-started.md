# Getting Started

Welcome to Swan! This guide will walk you through creating your first service from specification to deployment in minutes.

## What You'll Build

In this tutorial, you'll create a complete user management API with:

- User registration and authentication
- CRUD operations with validation
- Database integration
- API documentation
- Production deployment

## Prerequisites

- **Node.js 18+** or **Python 3.9+** or **Go 1.19+** or **Rust 1.70+** or **.NET 7+**
- **Git** for version control
- **Docker** (optional, for containerized deployment)

## Installation

### Install Swan CLI

```bash
# Using npm (recommended)
npm install -g @swan/cli

# Using pip
pip install swan-cli

# Using cargo
cargo install swan-cli

# Using go
go install github.com/swan-framework/cli@latest

# Using homebrew (macOS/Linux)
brew install swan-cli
```

### Verify Installation

```bash
swan --version
# swan version 1.0.0
```

## Step 1: Create Your First Service

### Initialize Project

```bash
# Create a new Swan service
swan init my-user-service

# Navigate to the project
cd my-user-service
```

This creates the following structure:

```
my-user-service/
├── swan.yaml          # Service specification
├── README.md          # Generated documentation
├── .gitignore         # Git ignore file
└── docs/              # API documentation
    └── api.md
```

### Examine the Generated Specification

```yaml
# swan.yaml
service:
  name: "my-user-service"
  version: "1.0.0"
  description: "A user management service built with Swan"

api:
  base_path: "/api/v1"

endpoints:
  - path: "/health"
    method: "GET"
    summary: "Health check endpoint"
    responses:
      200:
        description: "Service is healthy"
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: "healthy"
```

## Step 2: Define Your Data Model

Add a User model to your specification:

```yaml
# Add to swan.yaml
schemas:
  User:
    type: "object"
    required: ["id", "email"]
    properties:
      id:
        type: "string"
        format: "uuid"
        description: "Unique user identifier"
      email:
        type: "string"
        format: "email"
        description: "User email address"
      name:
        type: "string"
        minLength: 1
        maxLength: 100
        description: "User display name"
      created_at:
        type: "string"
        format: "date-time"
        description: "User creation timestamp"
        readOnly: true

  CreateUserRequest:
    type: "object"
    required: ["email", "password"]
    properties:
      email:
        type: "string"
        format: "email"
      name:
        type: "string"
        minLength: 1
        maxLength: 100
      password:
        type: "string"
        minLength: 8
        maxLength: 128
        description: "Must contain uppercase, lowercase, and number"
```

## Step 3: Add API Endpoints

Extend your specification with user endpoints:

```yaml
# Add to swan.yaml endpoints section
endpoints:
  - path: "/health"
    method: "GET"
    summary: "Health check endpoint"
    responses:
      200:
        description: "Service is healthy"

  - path: "/users"
    method: "GET"
    summary: "List users with pagination"
    parameters:
      - name: "limit"
        in: "query"
        schema:
          type: "integer"
          minimum: 1
          maximum: 100
          default: 10
      - name: "offset"
        in: "query"
        schema:
          type: "integer"
          minimum: 0
          default: 0
    responses:
      200:
        description: "List of users"
        content:
          application/json:
            schema:
              type: "object"
              properties:
                data:
                  type: "array"
                  items:
                    $ref: "#/schemas/User"
                meta:
                  type: "object"
                  properties:
                    limit:
                      type: "integer"
                    offset:
                      type: "integer"

  - path: "/users"
    method: "POST"
    summary: "Create a new user"
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/schemas/CreateUserRequest"
    responses:
      201:
        description: "User created successfully"
        content:
          application/json:
            schema:
              $ref: "#/schemas/User"
      400:
        description: "Invalid request data"
      409:
        description: "User already exists"

  - path: "/users/{id}"
    method: "GET"
    summary: "Get user by ID"
    parameters:
      - name: "id"
        in: "path"
        required: true
        schema:
          type: "string"
          format: "uuid"
    responses:
      200:
        description: "User details"
        content:
          application/json:
            schema:
              $ref: "#/schemas/User"
      404:
        description: "User not found"
```

## Step 4: Generate Your Service

Choose your preferred technology stack and generate the service:

### Option A: Node.js with TypeScript

```bash
swan generate --stack nodejs --framework express --typescript
```

This generates:

```
src/
├── controllers/
│   └── users.controller.ts
├── models/
│   └── user.model.ts
├── routes/
│   └── users.routes.ts
├── services/
│   └── user.service.ts
├── middleware/
├── utils/
└── app.ts
package.json
tsconfig.json
```

### Option B: Python with FastAPI

```bash
swan generate --stack python --framework fastapi
```

This generates:

```
app/
├── api/
│   └── routes/
│       └── users.py
├── models/
│   └── user.py
├── schemas/
│   └── user.py
├── services/
│   └── user.py
└── main.py
requirements.txt
```

### Option C: Go with Gin

```bash
swan generate --stack go --framework gin
```

This generates:

```
cmd/
└── server/
    └── main.go
internal/
├── handler/
│   └── user.go
├── model/
│   └── user.go
├── service/
│   └── user.go
└── repository/
    └── user.go
go.mod
```

## Step 5: Configure Database

Add database configuration to your specification:

```yaml
# Add to swan.yaml
database:
  type: "postgresql"
  migrations_path: "./migrations"

environments:
  development:
    database_url: "postgresql://localhost:5432/myservice_dev"
  production:
    database_url: "${DATABASE_URL}"
```

Generate database schema:

```bash
# Generate migration files
swan db generate-migration create_users_table

# Apply migrations
swan db migrate
```

## Step 6: Run Your Service Locally

Start the development server:

```bash
# Install dependencies and start
swan dev

# Or use the generated scripts
npm run dev        # Node.js
python -m uvicorn app.main:app --reload  # Python
go run cmd/server/main.go               # Go
```

Your service is now running at `http://localhost:3000` (or the configured port).

## Step 7: Test Your API

### Using curl

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Create a user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe",
    "password": "SecurePass123"
  }'

# List users
curl http://localhost:3000/api/v1/users?limit=5

# Get user by ID
curl http://localhost:3000/api/v1/users/{user-id}
```

### Using the Generated Test Suite

```bash
# Run the generated tests
swan test

# Run specific test types
swan test unit
swan test integration
swan test api
```

## Step 8: View API Documentation

Swan automatically generates interactive API documentation:

```bash
# Start documentation server
swan docs serve

# Open in browser
open http://localhost:3001
```

This shows:

- **Interactive API explorer** with request/response examples
- **Schema documentation** with validation rules
- **Authentication** information
- **Code samples** in multiple languages

## Step 9: Deploy Your Service

Choose your deployment target:

### Option A: Cloudflare Workers (Serverless)

```bash
# Configure Cloudflare
swan deploy setup cloudflare

# Deploy
swan deploy cloudflare --env production
```

### Option B: Docker (Container)

```bash
# Build Docker image
swan deploy build docker

# Deploy to cloud
swan deploy docker --platform gcp-run
```

### Option C: Vercel (Serverless)

```bash
# Configure Vercel
swan deploy setup vercel

# Deploy
swan deploy vercel --env production
```

## Step 10: Monitor Your Service

Swan provides built-in monitoring:

```bash
# View service metrics
swan monitor --platform cloudflare

# Check health across deployments
swan health check --all-environments

# View logs
swan logs --env production --tail
```

## Next Steps

Congratulations! You've successfully created, generated, and deployed your first Swan service. Here's what to explore next:

### Learn the Concepts

- **[Service Architecture](/architecture/)** - Best practices and patterns
- **[Technology Stacks](/stacks/)** - Deep dive into your chosen stack
- **[Deployment Options](/deployment/)** - Explore other deployment targets

### Extend Your Service

- **Add Authentication** - JWT, OAuth2, API keys
- **Implement Caching** - Redis integration
- **Add Background Jobs** - Async processing
- **Set up Monitoring** - Metrics, logging, alerting

### Use Templates

- **[Template Library](/templates/)** - Ready-to-use service patterns
- **Custom Templates** - Create your own templates
- **Team Standards** - Share templates across your organization

### Advanced Features

- **Multi-Stack Services** - Gradual migration between stacks
- **API Versioning** - Manage breaking changes
- **Rate Limiting** - Protect your services
- **Circuit Breakers** - Handle failures gracefully

## Getting Help

- **Documentation**: [Complete guides](/guide/introduction) and [API reference](/api/)
- **Community**: [GitHub Discussions](https://github.com/swan-framework/swan/discussions)
- **Issues**: [Bug reports and feature requests](https://github.com/swan-framework/swan/issues)
- **Discord**: [Join our community chat](https://discord.gg/swan-framework)
