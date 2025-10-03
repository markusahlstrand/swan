# API Versioning

API versioning is crucial for maintaining backward compatibility while evolving your services. Swan provides built-in support for semantic versioning and multiple versioning strategies.

## Versioning Strategies

### 1. URL Path Versioning

Include version in the URL path for clear, cacheable versioning.

```
GET /v1/users/123
GET /v2/users/123
```

**Pros:**

- Clear and explicit
- Easy to cache
- Simple routing

**Cons:**

- Verbose URLs
- Multiple API surfaces

### 2. Header Versioning

Use HTTP headers to specify API version.

```http
GET /users/123
API-Version: 2.0
```

**Pros:**

- Clean URLs
- Flexible versioning
- Content negotiation support

**Cons:**

- Less visible
- Caching complexity

### 3. Query Parameter Versioning

Include version as a query parameter.

```
GET /users/123?version=2.0
```

## Swan's Approach

Swan uses **semantic versioning** combined with **URL path versioning** by default:

```yaml
# swan.yaml
version: "2.1.0"
api:
  versioning:
    strategy: "path"
    pattern: "/v{major}"
```

### Version Evolution Rules

1. **Major Version (v1 → v2)**: Breaking changes

   - Changed response structure
   - Removed endpoints
   - Changed required parameters

2. **Minor Version (v2.1 → v2.2)**: Backward-compatible additions

   - New endpoints
   - New optional parameters
   - Additional response fields

3. **Patch Version (v2.1.0 → v2.1.1)**: Bug fixes
   - No API changes
   - Internal improvements
   - Security patches

## Implementation Example

```yaml
# Define multiple API versions
versions:
  v1:
    endpoints:
      - path: "/users"
        methods: ["GET", "POST"]
        deprecated: true
        sunset: "2024-12-31"

  v2:
    endpoints:
      - path: "/users"
        methods: ["GET", "POST", "PATCH"]
      - path: "/users/bulk"
        methods: ["POST"]
```

## Migration Strategy

1. **Announce Changes Early**: Give consumers time to adapt
2. **Maintain Parallel Versions**: Support old versions during transition
3. **Provide Migration Guides**: Document breaking changes
4. **Set Sunset Dates**: Communicate deprecation timeline
5. **Monitor Usage**: Track version adoption

## Best Practices

- Version only when necessary (breaking changes)
- Keep version count minimal
- Provide clear migration paths
- Use deprecation warnings
- Monitor version usage metrics
- Consider feature toggles for minor changes

## Tools and Automation

Swan provides tools for version management:

```bash
# Generate new version
swan version bump major

# Check compatibility
swan version check --from=v1 --to=v2

# Generate migration guide
swan version migration v1 v2
```
