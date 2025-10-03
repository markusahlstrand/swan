# Template Specifications

Swan provides a comprehensive library of pre-built templates for common service patterns. These templates include complete specifications, code generation, and deployment configurations.

## Template Categories

### Basic Services

- [RESTful API](#restful-api) - Standard CRUD operations
- [GraphQL API](#graphql-api) - Modern graph-based API
- [Webhook Handler](#webhook-handler) - Process incoming webhooks
- [Background Worker](#background-worker) - Async task processing

### Authentication Services

- [JWT Authentication](#jwt-authentication) - Token-based auth
- [OAuth2 Provider](#oauth2-provider) - Full OAuth2 server
- [API Gateway](#api-gateway) - Request routing and auth
- [User Management](#user-management) - Complete user system

### Data Services

- [Analytics API](#analytics-api) - Event tracking and metrics
- [File Storage API](#file-storage-api) - Upload and management
- [Search Service](#search-service) - Full-text search
- [Notification Service](#notification-service) - Multi-channel messaging

### Integration Services

- [Payment Processing](#payment-processing) - Stripe/PayPal integration
- [Email Service](#email-service) - Transactional emails
- [SMS Gateway](#sms-gateway) - Text messaging
- [Social Media API](#social-media-api) - Social platform integration

## Quick Start Templates

### RESTful API

A complete CRUD API with authentication, validation, and database integration.

```yaml
# templates/restful-api/swan.yaml
service:
  name: "restful-api"
  version: "1.0.0"
  description: "Complete RESTful API with CRUD operations"

database:
  type: "postgresql"
  connection_pooling: true

authentication:
  type: "jwt"
  secret: "${JWT_SECRET}"
  expiration: "24h"

endpoints:
  - path: "/auth/register"
    method: "POST"
    summary: "Register new user"
    public: true

  - path: "/auth/login"
    method: "POST"
    summary: "User login"
    public: true

  - path: "/users"
    method: "GET"
    summary: "List users"
    auth_required: true

  - path: "/users/{id}"
    method: "GET"
    summary: "Get user by ID"
    auth_required: true

schemas:
  User:
    type: "object"
    required: ["id", "email"]
    properties:
      id:
        type: "string"
        format: "uuid"
      email:
        type: "string"
        format: "email"
      name:
        type: "string"
      created_at:
        type: "string"
        format: "date-time"
```

**Generate this template:**

```bash
swan generate --template restful-api --stack nodejs
```

### GraphQL API

Modern GraphQL service with type-safe resolvers and subscriptions.

```yaml
# templates/graphql-api/swan.yaml
service:
  name: "graphql-api"
  version: "1.0.0"
  description: "GraphQL API with real-time subscriptions"

graphql:
  enabled: true
  playground: true
  introspection: true

authentication:
  type: "jwt"

subscriptions:
  enabled: true
  transport: "websocket"

types:
  User:
    fields:
      id: "ID!"
      email: "String!"
      name: "String"
      posts: "[Post!]!"

  Post:
    fields:
      id: "ID!"
      title: "String!"
      content: "String!"
      author: "User!"
      published: "Boolean!"

queries:
  users:
    type: "[User!]!"
    args:
      limit:
        type: "Int"
        default: 10

  user:
    type: "User"
    args:
      id:
        type: "ID!"

mutations:
  createUser:
    type: "User!"
    args:
      input:
        type: "CreateUserInput!"

  updatePost:
    type: "Post!"
    args:
      id:
        type: "ID!"
      input:
        type: "UpdatePostInput!"

subscriptions:
  postAdded:
    type: "Post!"
    args:
      userId:
        type: "ID"
```

### JWT Authentication

Complete authentication service with registration, login, and token management.

```yaml
# templates/jwt-auth/swan.yaml
service:
  name: "jwt-auth-service"
  version: "1.0.0"
  description: "JWT authentication with user management"

authentication:
  jwt:
    secret: "${JWT_SECRET}"
    algorithm: "HS256"
    access_token_expiry: "15m"
    refresh_token_expiry: "7d"

  password:
    min_length: 8
    require_uppercase: true
    require_lowercase: true
    require_numbers: true
    require_symbols: false

  rate_limiting:
    login_attempts: 5
    lockout_duration: "15m"

endpoints:
  - path: "/auth/register"
    method: "POST"
    summary: "Register new user account"
    public: true
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/schemas/RegisterRequest"

  - path: "/auth/login"
    method: "POST"
    summary: "Authenticate user and return tokens"
    public: true
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/schemas/LoginRequest"

  - path: "/auth/refresh"
    method: "POST"
    summary: "Refresh access token"
    public: true
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: "object"
            properties:
              refresh_token:
                type: "string"

  - path: "/auth/logout"
    method: "POST"
    summary: "Logout and invalidate tokens"
    auth_required: true

  - path: "/auth/profile"
    method: "GET"
    summary: "Get current user profile"
    auth_required: true

schemas:
  RegisterRequest:
    type: "object"
    required: ["email", "password"]
    properties:
      email:
        type: "string"
        format: "email"
      password:
        type: "string"
        minLength: 8
      name:
        type: "string"
        minLength: 1
        maxLength: 100

  LoginRequest:
    type: "object"
    required: ["email", "password"]
    properties:
      email:
        type: "string"
        format: "email"
      password:
        type: "string"

  AuthResponse:
    type: "object"
    properties:
      access_token:
        type: "string"
      refresh_token:
        type: "string"
      expires_in:
        type: "integer"
      user:
        $ref: "#/schemas/User"
```

### File Storage API

Complete file upload and management service with cloud storage integration.

```yaml
# templates/file-storage/swan.yaml
service:
  name: "file-storage-api"
  version: "1.0.0"
  description: "File upload and management service"

storage:
  provider: "s3" # or "gcs", "azure", "local"
  bucket: "${STORAGE_BUCKET}"
  max_file_size: "10MB"
  allowed_types: ["image/*", "application/pdf", "text/*"]

authentication:
  type: "api_key"
  header: "X-API-Key"

endpoints:
  - path: "/files/upload"
    method: "POST"
    summary: "Upload file"
    auth_required: true
    requestBody:
      required: true
      content:
        multipart/form-data:
          schema:
            type: "object"
            properties:
              file:
                type: "string"
                format: "binary"
              metadata:
                type: "object"

  - path: "/files/{id}"
    method: "GET"
    summary: "Download file"
    parameters:
      - name: "id"
        in: "path"
        required: true
        schema:
          type: "string"
          format: "uuid"

  - path: "/files/{id}/info"
    method: "GET"
    summary: "Get file metadata"
    auth_required: true

  - path: "/files"
    method: "GET"
    summary: "List user files"
    auth_required: true
    parameters:
      - name: "limit"
        in: "query"
        schema:
          type: "integer"
          default: 20
      - name: "type"
        in: "query"
        schema:
          type: "string"

schemas:
  FileInfo:
    type: "object"
    properties:
      id:
        type: "string"
        format: "uuid"
      filename:
        type: "string"
      size:
        type: "integer"
      mime_type:
        type: "string"
      upload_date:
        type: "string"
        format: "date-time"
      download_url:
        type: "string"
        format: "uri"
```

### Analytics API

Event tracking and analytics service with real-time metrics.

```yaml
# templates/analytics-api/swan.yaml
service:
  name: "analytics-api"
  version: "1.0.0"
  description: "Event tracking and analytics service"

database:
  type: "postgresql"
  time_series: true

cache:
  type: "redis"
  ttl: 300

authentication:
  type: "api_key"

rate_limiting:
  events_per_minute: 1000

endpoints:
  - path: "/events"
    method: "POST"
    summary: "Track event"
    auth_required: true
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/schemas/EventRequest"

  - path: "/analytics/overview"
    method: "GET"
    summary: "Get analytics overview"
    auth_required: true
    parameters:
      - name: "start_date"
        in: "query"
        required: true
        schema:
          type: "string"
          format: "date"
      - name: "end_date"
        in: "query"
        required: true
        schema:
          type: "string"
          format: "date"

  - path: "/analytics/events/{event_name}"
    method: "GET"
    summary: "Get event analytics"
    auth_required: true

schemas:
  EventRequest:
    type: "object"
    required: ["event_name"]
    properties:
      event_name:
        type: "string"
        minLength: 1
        maxLength: 100
      properties:
        type: "object"
        additionalProperties: true
      user_id:
        type: "string"
      session_id:
        type: "string"
      timestamp:
        type: "string"
        format: "date-time"

  AnalyticsData:
    type: "object"
    properties:
      total_events:
        type: "integer"
      unique_users:
        type: "integer"
      top_events:
        type: "array"
        items:
          type: "object"
          properties:
            name:
              type: "string"
            count:
              type: "integer"
```

## Using Templates

### Generate from Template

```bash
# List available templates
swan templates list

# Generate service from template
swan generate --template restful-api --stack nodejs --name my-api

# Generate with custom configuration
swan generate --template jwt-auth --stack python --config custom.yaml
```

### Customize Templates

```bash
# Create custom template from existing service
swan template create --from ./my-service --name my-custom-template

# Modify existing template
swan template edit jwt-auth

# Share template
swan template publish my-custom-template --registry company-registry
```

### Template Registry

```bash
# Install template from registry
swan template install @company/microservice-template

# Update templates
swan template update --all

# Search templates
swan template search "authentication"
```

## Template Development

### Creating Custom Templates

```yaml
# template.yaml (template metadata)
template:
  name: "my-custom-template"
  version: "1.0.0"
  description: "Custom service template"
  author: "Your Name"
  tags: ["api", "authentication", "postgresql"]

variables:
  service_name:
    type: "string"
    description: "Name of the service"
    required: true

  database_type:
    type: "string"
    description: "Database type"
    default: "postgresql"
    options: ["postgresql", "mysql", "sqlite"]

  enable_auth:
    type: "boolean"
    description: "Enable authentication"
    default: true

files:
  - src: "swan.yaml.template"
    dest: "swan.yaml"
  - src: "README.md.template"
    dest: "README.md"
  - src: "docker/"
    dest: "docker/"
    condition: "{{.enable_docker}}"
```

### Template Variables

```yaml
# swan.yaml.template
service:
  name: "{{.service_name}}"
  version: "1.0.0"
  description: "{{.description}}"

{{#if enable_auth}}
authentication:
  type: "jwt"
  secret: "${JWT_SECRET}"
{{/if}}

database:
  type: "{{.database_type}}"
  {{#if (eq database_type "postgresql")}}
  connection_pooling: true
  {{/if}}
```

## Best Practices

### Template Selection

1. **Start Simple**: Begin with basic templates and add complexity
2. **Match Use Case**: Choose templates that fit your specific needs
3. **Consider Stack**: Some templates work better with certain stacks
4. **Team Standards**: Use organization templates for consistency

### Customization

1. **Understand the Template**: Review the generated specification
2. **Modify Gradually**: Make incremental changes and test
3. **Document Changes**: Keep track of customizations
4. **Version Control**: Commit changes to track modifications

### Sharing Templates

1. **Create Reusable Templates**: Extract common patterns
2. **Document Well**: Provide clear descriptions and examples
3. **Test Thoroughly**: Verify templates work across stacks
4. **Version Properly**: Use semantic versioning for templates
