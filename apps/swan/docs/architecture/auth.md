# Authentication & Authorization

Secure your Swan services with flexible authentication and authorization patterns. Swan supports multiple auth strategies and provides type-safe implementations across all supported stacks.

## Authentication Methods

### 1. API Keys
Simple authentication for service-to-service communication.

```yaml
# swan.yaml
auth:
  apiKey:
    header: "X-API-Key"
    location: "header" # or "query"
    name: "api_key"
```

### 2. JWT (JSON Web Tokens)
Stateless authentication with embedded claims.

```yaml
auth:
  jwt:
    secret: "${JWT_SECRET}"
    algorithm: "HS256"
    expiresIn: "24h"
    issuer: "swan-service"
    audience: "api-users"
```

### 3. OAuth 2.0 / OpenID Connect
Industry-standard authentication for user-facing applications.

```yaml
auth:
  oauth2:
    provider: "auth0" # or "google", "github", "custom"
    clientId: "${OAUTH_CLIENT_ID}"
    clientSecret: "${OAUTH_CLIENT_SECRET}"
    scopes: ["openid", "profile", "email"]
```

### 4. mTLS (Mutual TLS)
Certificate-based authentication for high-security environments.

```yaml
auth:
  mtls:
    ca: "./certs/ca.crt"
    cert: "./certs/client.crt"
    key: "./certs/client.key"
```

## Authorization Patterns

### Role-Based Access Control (RBAC)

```yaml
authorization:
  type: "rbac"
  roles:
    admin:
      permissions: ["*"]
    editor:
      permissions: ["users:read", "users:write", "posts:*"]
    viewer:
      permissions: ["users:read", "posts:read"]
```

### Attribute-Based Access Control (ABAC)

```yaml
authorization:
  type: "abac"
  policies:
    - name: "user_data_access"
      condition: "user.id == resource.owner_id"
      effect: "allow"
    - name: "admin_access"
      condition: "user.role == 'admin'"
      effect: "allow"
```

## Implementation Examples

### Protecting Endpoints

```yaml
endpoints:
  - path: "/users"
    methods: ["GET"]
    auth: "jwt"
    permissions: ["users:read"]
  
  - path: "/admin/users"
    methods: ["GET", "POST", "DELETE"]
    auth: "jwt"
    roles: ["admin"]
  
  - path: "/internal/health"
    methods: ["GET"]
    auth: "apiKey"
```

### Custom Authentication

```yaml
auth:
  custom:
    handler: "./auth/custom-handler"
    options:
      timeout: 5000
      retries: 3
```

## Security Best Practices

### 1. Principle of Least Privilege
Grant minimum necessary permissions.

### 2. Token Security
- Use short expiration times
- Implement refresh tokens
- Secure token storage

### 3. Rate Limiting
Protect against brute force attacks.

```yaml
rateLimit:
  window: "15m"
  max: 100
  keyGenerator: "ip" # or "user", "api_key"
```

### 4. Input Validation
Validate and sanitize all inputs.

```yaml
validation:
  headers:
    strict: true
    allowUnknown: false
  body:
    maxSize: "1mb"
    sanitize: true
```

## Multi-Stack Implementation

Swan generates auth implementations for each stack:

### Node.js (Express)
```javascript
// Generated middleware
app.use('/api', jwtAuth({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256']
}));
```

### Python (FastAPI)
```python
# Generated dependency
@app.get("/users")
async def get_users(user: User = Depends(jwt_required)):
    return users
```

### Rust (Axum)
```rust
// Generated middleware
let app = Router::new()
    .route("/users", get(get_users))
    .layer(JwtAuthLayer::new(secret));
```

## Testing Authentication

Swan provides auth testing utilities:

```bash
# Generate test tokens
swan auth token --role=admin --expires=1h

# Test protected endpoints
swan test auth --endpoint=/users --token=$TOKEN
```

## Monitoring & Logging

Track authentication events:

- Failed login attempts
- Token expiration events
- Permission denials
- Unusual access patterns

```yaml
logging:
  auth:
    level: "info"
    events: ["login", "logout", "token_refresh", "permission_denied"]
```