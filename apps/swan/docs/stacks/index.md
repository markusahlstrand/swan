# Technology Stacks

Swan supports multiple programming languages and frameworks, allowing you to choose the best stack for your requirements while maintaining consistency across your service architecture.

## Supported Stacks

| Language                  | Framework        | Maturity | Best For                                        |
| ------------------------- | ---------------- | -------- | ----------------------------------------------- |
| [Node.js](/stacks/nodejs) | Express, Fastify | Stable   | Rapid development, JavaScript ecosystem         |
| [Python](/stacks/python)  | FastAPI, Flask   | Stable   | Data science, ML integration, rapid prototyping |
| [Rust](/stacks/rust)      | Axum, Warp       | Stable   | High performance, systems programming           |
| [Go](/stacks/golang)      | Gin, Echo        | Stable   | Cloud-native, microservices, performance        |
| [.NET](/stacks/dotnet)    | ASP.NET Core     | Beta     | Enterprise applications, Windows integration    |

## Choosing Your Stack

### Performance Requirements

- **High Throughput**: Rust, Go
- **Low Latency**: Rust, Go, Node.js
- **Memory Efficiency**: Rust, Go
- **CPU Intensive**: Rust, Go

### Development Speed

- **Rapid Prototyping**: Python, Node.js
- **Quick MVP**: Node.js, Python
- **Large Teams**: Go, .NET, Python

### Ecosystem Integration

- **Machine Learning**: Python
- **JavaScript Frontend**: Node.js
- **Enterprise Systems**: .NET, Go
- **Cloud Native**: Go, Rust

### Team Expertise

Choose the stack your team knows best for faster delivery and maintainability.

## Stack Features Comparison

| Feature             | Node.js   | Python     | Rust      | Go        | .NET     |
| ------------------- | --------- | ---------- | --------- | --------- | -------- |
| Async/Await         | ✅        | ✅         | ✅        | ✅        | ✅       |
| Type Safety         | ⚠️ (TS)   | ⚠️ (hints) | ✅        | ✅        | ✅       |
| Memory Safety       | ❌        | ❌         | ✅        | ✅        | ✅       |
| Garbage Collection  | ✅        | ✅         | ❌        | ✅        | ✅       |
| Compile Time        | Fast      | N/A        | Slow      | Fast      | Fast     |
| Runtime Performance | Good      | Fair       | Excellent | Excellent | Good     |
| Package Ecosystem   | Excellent | Excellent  | Growing   | Good      | Good     |
| Learning Curve      | Easy      | Easy       | Steep     | Moderate  | Moderate |

## Code Generation

Swan generates idiomatic code for each stack:

### API Handlers

```javascript
// Node.js/Express
app.get("/users/:id", async (req, res) => {
  const user = await userService.findById(req.params.id);
  res.json(user);
});
```

```python
# Python/FastAPI
@app.get("/users/{user_id}")
async def get_user(user_id: str) -> User:
    return await user_service.find_by_id(user_id)
```

```rust
// Rust/Axum
async fn get_user(Path(user_id): Path<String>) -> Result<Json<User>, ApiError> {
    let user = user_service.find_by_id(&user_id).await?;
    Ok(Json(user))
}
```

```go
// Go/Gin
func GetUser(c *gin.Context) {
    userID := c.Param("id")
    user, err := userService.FindByID(userID)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    c.JSON(200, user)
}
```

```csharp
// .NET/ASP.NET Core
[HttpGet("{id}")]
public async Task<ActionResult<User>> GetUser(string id)
{
    var user = await _userService.FindByIdAsync(id);
    return Ok(user);
}
```

### Data Models

Each stack gets type-safe models with validation:

```typescript
// Node.js/TypeScript
interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}
```

```python
# Python/Pydantic
class User(BaseModel):
    id: str
    email: EmailStr
    name: Optional[str] = None
    created_at: datetime
```

```rust
// Rust/Serde
#[derive(Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
    pub created_at: DateTime<Utc>,
}
```

### Database Integration

Swan generates database access patterns optimized for each stack:

- **Node.js**: Prisma, TypeORM, Knex.js
- **Python**: SQLAlchemy, Tortoise ORM, Databases
- **Rust**: SQLx, Diesel, Sea-ORM
- **Go**: GORM, SQLBoiler, pgx
- **.NET**: Entity Framework Core, Dapper

## Cross-Stack Compatibility

### API Contracts

All stacks implement the same OpenAPI specification, ensuring consistent behavior.

### Authentication

Identical JWT handling and validation across all stacks.

### Monitoring

Consistent metrics, logging, and tracing using OpenTelemetry.

### Configuration

Environment-based configuration with the same variable names.

## Migration Support

Swan supports gradual migration between stacks:

```bash
# Migrate from Node.js to Go
swan migrate --from=nodejs --to=golang --preserve-data

# Generate compatibility layer
swan generate bridge --source=python --target=rust
```

## Next Steps

Choose your preferred stack and dive into the detailed implementation guides:

- [Node.js Implementation Guide](/stacks/nodejs)
- [Python Implementation Guide](/stacks/python)
- [Rust Implementation Guide](/stacks/rust)
- [Go Implementation Guide](/stacks/golang)
- [.NET Implementation Guide](/stacks/dotnet)
