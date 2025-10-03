# Rust Stack

Build ultra-high performance, memory-safe APIs with Rust. Swan generates production-ready services using modern async frameworks like Axum and Warp with zero-cost abstractions.

## Framework Options

### Axum (Default)

Modern, ergonomic web framework built on Tokio.

```yaml
# swan.yaml
stack:
  language: "rust"
  framework: "axum"
  rust_edition: "2021"
```

### Warp

Composable web server framework with built-in filters.

```yaml
stack:
  language: "rust"
  framework: "warp"
```

## Project Structure

```
my-service/
├── src/
│   ├── handlers/
│   │   └── users.rs
│   ├── models/
│   │   └── user.rs
│   ├── services/
│   │   └── user.rs
│   ├── middleware/
│   │   ├── auth.rs
│   │   └── cors.rs
│   ├── utils/
│   │   ├── config.rs
│   │   └── logger.rs
│   ├── main.rs
│   └── lib.rs
├── tests/
│   ├── integration.rs
│   └── common/
├── Cargo.toml
├── .env.example
└── docker/
    └── Dockerfile
```

## Code Examples

### API Handlers (Axum)

```rust
// src/handlers/users.rs
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    models::user::{CreateUserRequest, User, UserResponse},
    services::user::UserService,
    utils::error::ApiError,
    AppState,
};

#[derive(Deserialize)]
pub struct PaginationQuery {
    #[serde(default = "default_limit")]
    limit: u32,
    #[serde(default)]
    offset: u32,
}

fn default_limit() -> u32 { 10 }

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/users", get(get_users).post(create_user))
        .route("/users/:id", get(get_user))
}

pub async fn get_users(
    State(state): State<AppState>,
    Query(pagination): Query<PaginationQuery>,
) -> Result<Json<Vec<UserResponse>>, ApiError> {
    let users = UserService::new(&state.db)
        .get_users(pagination.limit, pagination.offset)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch users: {}", e);
            ApiError::InternalServerError
        })?;

    let user_responses: Vec<UserResponse> = users.into_iter().map(|u| u.into()).collect();
    Ok(Json(user_responses))
}

pub async fn create_user(
    State(state): State<AppState>,
    Json(request): Json<CreateUserRequest>,
) -> Result<(StatusCode, Json<UserResponse>), ApiError> {
    // Validate request
    request.validate()?;

    let user = UserService::new(&state.db)
        .create_user(request)
        .await
        .map_err(|e| match e {
            crate::services::user::UserError::EmailExists => ApiError::BadRequest("Email already exists".to_string()),
            _ => {
                tracing::error!("Failed to create user: {}", e);
                ApiError::InternalServerError
            }
        })?;

    tracing::info!("User created: {}", user.id);
    Ok((StatusCode::CREATED, Json(user.into())))
}

pub async fn get_user(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<UserResponse>, ApiError> {
    let user = UserService::new(&state.db)
        .get_user_by_id(user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch user {}: {}", user_id, e);
            ApiError::InternalServerError
        })?
        .ok_or(ApiError::NotFound)?;

    Ok(Json(user.into()))
}
```

### Data Models

```rust
// src/models/user.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::{Validate, ValidationError};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,

    #[validate(length(min = 1, max = 100, message = "Name must be between 1 and 100 characters"))]
    pub name: Option<String>,

    #[validate(length(min = 8, message = "Password must be at least 8 characters"))]
    #[validate(custom = "validate_password_strength")]
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            email: user.email,
            name: user.name,
            created_at: user.created_at,
        }
    }
}

fn validate_password_strength(password: &str) -> Result<(), ValidationError> {
    let has_upper = password.chars().any(|c| c.is_uppercase());
    let has_lower = password.chars().any(|c| c.is_lowercase());
    let has_digit = password.chars().any(|c| c.is_numeric());

    if has_upper && has_lower && has_digit {
        Ok(())
    } else {
        Err(ValidationError::new(
            "Password must contain uppercase, lowercase, and number"
        ))
    }
}
```

### Service Layer

```rust
// src/services/user.rs
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{rand_core::OsRng, SaltString};
use chrono::Utc;
use sqlx::{PgPool, Row};
use thiserror::Error;
use uuid::Uuid;

use crate::models::user::{CreateUserRequest, User};

#[derive(Error, Debug)]
pub enum UserError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Password hashing error: {0}")]
    PasswordHash(String),
    #[error("Email already exists")]
    EmailExists,
    #[error("User not found")]
    NotFound,
}

pub struct UserService<'a> {
    db: &'a PgPool,
}

impl<'a> UserService<'a> {
    pub fn new(db: &'a PgPool) -> Self {
        Self { db }
    }

    pub async fn get_users(&self, limit: u32, offset: u32) -> Result<Vec<User>, UserError> {
        let users = sqlx::query_as!(
            User,
            r#"
            SELECT id, email, name, password_hash, created_at, updated_at
            FROM users
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            "#,
            limit as i64,
            offset as i64
        )
        .fetch_all(self.db)
        .await?;

        Ok(users)
    }

    pub async fn get_user_by_id(&self, user_id: Uuid) -> Result<Option<User>, UserError> {
        let user = sqlx::query_as!(
            User,
            "SELECT id, email, name, password_hash, created_at, updated_at FROM users WHERE id = $1",
            user_id
        )
        .fetch_optional(self.db)
        .await?;

        Ok(user)
    }

    pub async fn get_user_by_email(&self, email: &str) -> Result<Option<User>, UserError> {
        let user = sqlx::query_as!(
            User,
            "SELECT id, email, name, password_hash, created_at, updated_at FROM users WHERE email = $1",
            email
        )
        .fetch_optional(self.db)
        .await?;

        Ok(user)
    }

    pub async fn create_user(&self, request: CreateUserRequest) -> Result<User, UserError> {
        // Check if user already exists
        if self.get_user_by_email(&request.email).await?.is_some() {
            return Err(UserError::EmailExists);
        }

        // Hash password
        let password_hash = self.hash_password(&request.password)?;
        let user_id = Uuid::new_v4();
        let now = Utc::now();

        let user = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, email, name, password_hash, created_at, updated_at
            "#,
            user_id,
            request.email,
            request.name,
            password_hash,
            now,
            now
        )
        .fetch_one(self.db)
        .await?;

        tracing::info!("User created successfully: {}", user.id);
        Ok(user)
    }

    pub fn verify_password(&self, password: &str, hash: &str) -> Result<bool, UserError> {
        let parsed_hash = PasswordHash::new(hash)
            .map_err(|e| UserError::PasswordHash(e.to_string()))?;

        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok())
    }

    fn hash_password(&self, password: &str) -> Result<String, UserError> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();

        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| UserError::PasswordHash(e.to_string()))?
            .to_string();

        Ok(password_hash)
    }
}
```

### Application Setup

```rust
// src/main.rs
use axum::{
    http::{HeaderValue, Method},
    middleware::DefaultBodyLimit,
    Router,
};
use sqlx::PgPool;
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::{
    cors::CorsLayer,
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod handlers;
mod middleware;
mod models;
mod services;
mod utils;

#[derive(Clone)]
pub struct AppState {
    db: PgPool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    // Load configuration
    let config = utils::config::Config::from_env()?;

    // Connect to database
    let db = sqlx::PgPool::connect(&config.database_url).await?;

    // Run migrations
    sqlx::migrate!().run(&db).await?;

    let state = AppState { db };

    // Build application
    let app = Router::new()
        .nest("/api/v1", handlers::users::routes())
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(DefaultBodyLimit::max(1024 * 1024)) // 1MB
                .layer(
                    CorsLayer::new()
                        .allow_origin("*".parse::<HeaderValue>()?)
                        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
                        .allow_headers(tower_http::cors::Any),
                ),
        )
        .with_state(state);

    // Start server
    let listener = tokio::net::TcpListener::bind(&config.bind_address()).await?;
    tracing::info!("Server starting on {}", config.bind_address());

    axum::serve(listener, app).await?;

    Ok(())
}
```

## Testing

### Unit Tests

```rust
// tests/user_service_test.rs
use sqlx::PgPool;
use uuid::Uuid;

use myservice::{
    models::user::CreateUserRequest,
    services::user::UserService,
};

#[sqlx::test]
async fn test_create_user(pool: PgPool) {
    let service = UserService::new(&pool);
    let request = CreateUserRequest {
        email: "test@example.com".to_string(),
        name: Some("Test User".to_string()),
        password: "TestPassword123".to_string(),
    };

    let user = service.create_user(request).await.unwrap();

    assert_eq!(user.email, "test@example.com");
    assert_eq!(user.name, Some("Test User".to_string()));
}

#[sqlx::test]
async fn test_duplicate_email(pool: PgPool) {
    let service = UserService::new(&pool);
    let request = CreateUserRequest {
        email: "duplicate@example.com".to_string(),
        name: None,
        password: "Password123".to_string(),
    };

    // Create first user
    service.create_user(request.clone()).await.unwrap();

    // Try to create second user with same email
    let result = service.create_user(request).await;
    assert!(result.is_err());
}
```

### Integration Tests

```rust
// tests/integration.rs
use axum::http::StatusCode;
use serde_json::json;

mod common;

#[tokio::test]
async fn test_create_user_endpoint() {
    let app = common::create_test_app().await;

    let response = app
        .oneshot(
            axum::http::Request::builder()
                .uri("/api/v1/users")
                .method("POST")
                .header("content-type", "application/json")
                .body(
                    json!({
                        "email": "test@example.com",
                        "name": "Test User",
                        "password": "TestPassword123"
                    })
                    .to_string(),
                )
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CREATED);
}
```

## Performance Features

### Async Database Operations

```rust
// High-performance async database queries with connection pooling
let users = sqlx::query_as!(User, "SELECT * FROM users WHERE active = true")
    .fetch_all(&pool)
    .await?;
```

### Zero-Copy Serialization

```rust
// Efficient JSON serialization with serde
#[derive(Serialize)]
struct ApiResponse<T> {
    data: T,
    #[serde(skip_serializing_if = "Option::is_none")]
    meta: Option<serde_json::Value>,
}
```

### Memory-Safe Concurrency

```rust
// Safe concurrent operations without data races
use tokio::sync::RwLock;
use std::sync::Arc;

#[derive(Clone)]
struct CacheService {
    cache: Arc<RwLock<HashMap<String, String>>>,
}
```

## Best Practices

1. **Error Handling**: Use `thiserror` for custom error types
2. **Async/Await**: Leverage Tokio for async operations
3. **Memory Safety**: Utilize Rust's ownership system
4. **Type Safety**: Use strong typing throughout
5. **Testing**: Comprehensive unit and integration tests
6. **Logging**: Structured logging with `tracing`
7. **Security**: Input validation and safe string handling
8. **Performance**: Zero-cost abstractions and efficient algorithms
