# Go Stack

Build scalable, cloud-native services with Go. Swan generates efficient APIs using popular frameworks like Gin and Echo, optimized for containerized deployments and microservices architectures.

## Framework Options

### Gin (Default)

Fast HTTP web framework with minimal memory footprint.

```yaml
# swan.yaml
stack:
  language: "go"
  framework: "gin"
  go_version: "1.21"
```

### Echo

High performance, extensible web framework.

```yaml
stack:
  language: "go"
  framework: "echo"
```

## Project Structure

```
my-service/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── handler/
│   │   └── user.go
│   ├── middleware/
│   │   ├── auth.go
│   │   └── cors.go
│   ├── model/
│   │   └── user.go
│   ├── service/
│   │   └── user.go
│   ├── repository/
│   │   └── user.go
│   └── config/
│       └── config.go
├── pkg/
│   ├── logger/
│   │   └── logger.go
│   └── database/
│       └── postgres.go
├── test/
├── go.mod
├── go.sum
├── .env.example
└── docker/
    └── Dockerfile
```

## Code Examples

### API Handlers (Gin)

```go
// internal/handler/user.go
package handler

import (
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
    "github.com/myservice/internal/model"
    "github.com/myservice/internal/service"
    "github.com/myservice/pkg/logger"
)

type UserHandler struct {
    userService *service.UserService
    validator   *validator.Validate
    logger      logger.Logger
}

func NewUserHandler(userService *service.UserService, logger logger.Logger) *UserHandler {
    return &UserHandler{
        userService: userService,
        validator:   validator.New(),
        logger:      logger,
    }
}

func (h *UserHandler) GetUsers(c *gin.Context) {
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
    offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

    if limit > 100 {
        limit = 100
    }

    users, err := h.userService.GetUsers(c.Request.Context(), limit, offset)
    if err != nil {
        h.logger.Error("Failed to fetch users", "error", err)
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Internal server error",
        })
        return
    }

    response := gin.H{
        "data": users,
        "meta": gin.H{
            "limit":  limit,
            "offset": offset,
        },
    }

    c.JSON(http.StatusOK, response)
}

func (h *UserHandler) CreateUser(c *gin.Context) {
    var req model.CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error":   "Invalid request body",
            "details": err.Error(),
        })
        return
    }

    if err := h.validator.Struct(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error":   "Validation failed",
            "details": err.Error(),
        })
        return
    }

    user, err := h.userService.CreateUser(c.Request.Context(), &req)
    if err != nil {
        switch err {
        case service.ErrUserExists:
            c.JSON(http.StatusConflict, gin.H{
                "error": "User with this email already exists",
            })
        default:
            h.logger.Error("Failed to create user", "error", err)
            c.JSON(http.StatusInternalServerError, gin.H{
                "error": "Internal server error",
            })
        }
        return
    }

    h.logger.Info("User created successfully", "userId", user.ID)
    c.JSON(http.StatusCreated, user)
}

func (h *UserHandler) GetUser(c *gin.Context) {
    userID := c.Param("id")

    user, err := h.userService.GetUserByID(c.Request.Context(), userID)
    if err != nil {
        if err == service.ErrUserNotFound {
            c.JSON(http.StatusNotFound, gin.H{
                "error": "User not found",
            })
            return
        }

        h.logger.Error("Failed to fetch user", "error", err, "userId", userID)
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Internal server error",
        })
        return
    }

    c.JSON(http.StatusOK, user)
}

// RegisterRoutes sets up the user routes
func (h *UserHandler) RegisterRoutes(router *gin.RouterGroup) {
    users := router.Group("/users")
    {
        users.GET("/", h.GetUsers)
        users.POST("/", h.CreateUser)
        users.GET("/:id", h.GetUser)
    }
}
```

### Data Models

```go
// internal/model/user.go
package model

import (
    "time"
    "github.com/google/uuid"
)

type User struct {
    ID        uuid.UUID  `json:"id" db:"id"`
    Email     string     `json:"email" db:"email"`
    Name      *string    `json:"name,omitempty" db:"name"`
    CreatedAt time.Time  `json:"created_at" db:"created_at"`
    UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
}

type UserWithPassword struct {
    User
    PasswordHash string `json:"-" db:"password_hash"`
}

type CreateUserRequest struct {
    Email    string  `json:"email" validate:"required,email"`
    Name     *string `json:"name,omitempty" validate:"omitempty,min=1,max=100"`
    Password string  `json:"password" validate:"required,min=8,max=128,password_strength"`
}

type UpdateUserRequest struct {
    Name  *string `json:"name,omitempty" validate:"omitempty,min=1,max=100"`
    Email *string `json:"email,omitempty" validate:"omitempty,email"`
}

// Custom validator for password strength
func init() {
    validate := validator.New()
    validate.RegisterValidation("password_strength", validatePasswordStrength)
}

func validatePasswordStrength(fl validator.FieldLevel) bool {
    password := fl.Field().String()

    hasUpper := false
    hasLower := false
    hasDigit := false

    for _, char := range password {
        switch {
        case 'A' <= char && char <= 'Z':
            hasUpper = true
        case 'a' <= char && char <= 'z':
            hasLower = true
        case '0' <= char && char <= '9':
            hasDigit = true
        }
    }

    return hasUpper && hasLower && hasDigit
}
```

### Service Layer

```go
// internal/service/user.go
package service

import (
    "context"
    "errors"
    "time"

    "github.com/google/uuid"
    "golang.org/x/crypto/bcrypt"

    "github.com/myservice/internal/model"
    "github.com/myservice/internal/repository"
    "github.com/myservice/pkg/logger"
)

var (
    ErrUserNotFound = errors.New("user not found")
    ErrUserExists   = errors.New("user already exists")
)

type UserService struct {
    userRepo repository.UserRepository
    logger   logger.Logger
}

func NewUserService(userRepo repository.UserRepository, logger logger.Logger) *UserService {
    return &UserService{
        userRepo: userRepo,
        logger:   logger,
    }
}

func (s *UserService) GetUsers(ctx context.Context, limit, offset int) ([]*model.User, error) {
    users, err := s.userRepo.GetUsers(ctx, limit, offset)
    if err != nil {
        s.logger.Error("Failed to fetch users from repository", "error", err)
        return nil, err
    }

    return users, nil
}

func (s *UserService) GetUserByID(ctx context.Context, userID string) (*model.User, error) {
    id, err := uuid.Parse(userID)
    if err != nil {
        return nil, errors.New("invalid user ID format")
    }

    user, err := s.userRepo.GetUserByID(ctx, id)
    if err != nil {
        if err == repository.ErrUserNotFound {
            return nil, ErrUserNotFound
        }
        s.logger.Error("Failed to fetch user from repository", "error", err, "userId", userID)
        return nil, err
    }

    return user, nil
}

func (s *UserService) GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
    user, err := s.userRepo.GetUserByEmail(ctx, email)
    if err != nil {
        if err == repository.ErrUserNotFound {
            return nil, ErrUserNotFound
        }
        return nil, err
    }
    return user, nil
}

func (s *UserService) CreateUser(ctx context.Context, req *model.CreateUserRequest) (*model.User, error) {
    // Check if user already exists
    _, err := s.GetUserByEmail(ctx, req.Email)
    if err == nil {
        return nil, ErrUserExists
    }
    if err != ErrUserNotFound {
        return nil, err
    }

    // Hash password
    passwordHash, err := s.hashPassword(req.Password)
    if err != nil {
        s.logger.Error("Failed to hash password", "error", err)
        return nil, err
    }

    // Create user
    userWithPassword := &model.UserWithPassword{
        User: model.User{
            ID:        uuid.New(),
            Email:     req.Email,
            Name:      req.Name,
            CreatedAt: time.Now().UTC(),
            UpdatedAt: time.Now().UTC(),
        },
        PasswordHash: passwordHash,
    }

    createdUser, err := s.userRepo.CreateUser(ctx, userWithPassword)
    if err != nil {
        s.logger.Error("Failed to create user in repository", "error", err)
        return nil, err
    }

    s.logger.Info("User created successfully", "userId", createdUser.ID, "email", createdUser.Email)
    return createdUser, nil
}

func (s *UserService) VerifyPassword(ctx context.Context, userID string, password string) error {
    id, err := uuid.Parse(userID)
    if err != nil {
        return errors.New("invalid user ID format")
    }

    userWithPassword, err := s.userRepo.GetUserWithPasswordByID(ctx, id)
    if err != nil {
        return err
    }

    return bcrypt.CompareHashAndPassword([]byte(userWithPassword.PasswordHash), []byte(password))
}

func (s *UserService) hashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    return string(bytes), err
}
```

### Repository Layer

```go
// internal/repository/user.go
package repository

import (
    "context"
    "database/sql"
    "errors"

    "github.com/google/uuid"
    "github.com/jmoiron/sqlx"

    "github.com/myservice/internal/model"
)

var (
    ErrUserNotFound = errors.New("user not found")
)

type UserRepository interface {
    GetUsers(ctx context.Context, limit, offset int) ([]*model.User, error)
    GetUserByID(ctx context.Context, id uuid.UUID) (*model.User, error)
    GetUserByEmail(ctx context.Context, email string) (*model.User, error)
    GetUserWithPasswordByID(ctx context.Context, id uuid.UUID) (*model.UserWithPassword, error)
    CreateUser(ctx context.Context, user *model.UserWithPassword) (*model.User, error)
    UpdateUser(ctx context.Context, id uuid.UUID, updates *model.UpdateUserRequest) (*model.User, error)
    DeleteUser(ctx context.Context, id uuid.UUID) error
}

type userRepository struct {
    db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) UserRepository {
    return &userRepository{db: db}
}

func (r *userRepository) GetUsers(ctx context.Context, limit, offset int) ([]*model.User, error) {
    query := `
        SELECT id, email, name, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
    `

    var users []*model.User
    err := r.db.SelectContext(ctx, &users, query, limit, offset)
    if err != nil {
        return nil, err
    }

    return users, nil
}

func (r *userRepository) GetUserByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
    query := `
        SELECT id, email, name, created_at, updated_at
        FROM users
        WHERE id = $1
    `

    var user model.User
    err := r.db.GetContext(ctx, &user, query, id)
    if err != nil {
        if err == sql.ErrNoRows {
            return nil, ErrUserNotFound
        }
        return nil, err
    }

    return &user, nil
}

func (r *userRepository) GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
    query := `
        SELECT id, email, name, created_at, updated_at
        FROM users
        WHERE email = $1
    `

    var user model.User
    err := r.db.GetContext(ctx, &user, query, email)
    if err != nil {
        if err == sql.ErrNoRows {
            return nil, ErrUserNotFound
        }
        return nil, err
    }

    return &user, nil
}

func (r *userRepository) CreateUser(ctx context.Context, user *model.UserWithPassword) (*model.User, error) {
    query := `
        INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, name, created_at, updated_at
    `

    var createdUser model.User
    err := r.db.GetContext(ctx, &createdUser, query,
        user.ID, user.Email, user.Name, user.PasswordHash,
        user.CreatedAt, user.UpdatedAt,
    )
    if err != nil {
        return nil, err
    }

    return &createdUser, nil
}
```

## Testing

### Unit Tests

```go
// internal/service/user_test.go
package service

import (
    "context"
    "testing"

    "github.com/google/uuid"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"

    "github.com/myservice/internal/model"
    "github.com/myservice/pkg/logger"
)

type MockUserRepository struct {
    mock.Mock
}

func (m *MockUserRepository) GetUsers(ctx context.Context, limit, offset int) ([]*model.User, error) {
    args := m.Called(ctx, limit, offset)
    return args.Get(0).([]*model.User), args.Error(1)
}

func (m *MockUserRepository) GetUserByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
    args := m.Called(ctx, id)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*model.User), args.Error(1)
}

func TestUserService_GetUsers(t *testing.T) {
    mockRepo := new(MockUserRepository)
    mockLogger := logger.NewNoop()
    service := NewUserService(mockRepo, mockLogger)

    expectedUsers := []*model.User{
        {
            ID:    uuid.New(),
            Email: "user1@example.com",
            Name:  stringPtr("User 1"),
        },
        {
            ID:    uuid.New(),
            Email: "user2@example.com",
            Name:  stringPtr("User 2"),
        },
    }

    mockRepo.On("GetUsers", mock.Anything, 10, 0).Return(expectedUsers, nil)

    users, err := service.GetUsers(context.Background(), 10, 0)

    assert.NoError(t, err)
    assert.Equal(t, expectedUsers, users)
    mockRepo.AssertExpectations(t)
}

func stringPtr(s string) *string {
    return &s
}
```

### Integration Tests

```go
// test/integration_test.go
package test

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"

    "github.com/myservice/internal/model"
)

func TestCreateUser(t *testing.T) {
    router := setupTestRouter(t)

    user := model.CreateUserRequest{
        Email:    "test@example.com",
        Name:     stringPtr("Test User"),
        Password: "TestPassword123",
    }

    jsonBody, _ := json.Marshal(user)
    req, _ := http.NewRequest("POST", "/api/v1/users", bytes.NewBuffer(jsonBody))
    req.Header.Set("Content-Type", "application/json")

    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)

    assert.Equal(t, http.StatusCreated, w.Code)

    var response model.User
    err := json.Unmarshal(w.Body.Bytes(), &response)
    assert.NoError(t, err)
    assert.Equal(t, user.Email, response.Email)
    assert.Equal(t, user.Name, response.Name)
}
```

## Configuration

```go
// internal/config/config.go
package config

import (
    "fmt"
    "os"
    "strconv"
)

type Config struct {
    Port        int
    Host        string
    DatabaseURL string
    JWTSecret   string
    LogLevel    string
    Environment string
}

func LoadConfig() (*Config, error) {
    config := &Config{
        Port:        getEnvAsInt("PORT", 8080),
        Host:        getEnv("HOST", "0.0.0.0"),
        DatabaseURL: getEnv("DATABASE_URL", ""),
        JWTSecret:   getEnv("JWT_SECRET", ""),
        LogLevel:    getEnv("LOG_LEVEL", "info"),
        Environment: getEnv("ENVIRONMENT", "development"),
    }

    if config.DatabaseURL == "" {
        return nil, fmt.Errorf("DATABASE_URL is required")
    }

    if config.JWTSecret == "" {
        return nil, fmt.Errorf("JWT_SECRET is required")
    }

    return config, nil
}

func (c *Config) Address() string {
    return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

func getEnv(key, fallback string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return fallback
}

func getEnvAsInt(key string, fallback int) int {
    if value := os.Getenv(key); value != "" {
        if intVal, err := strconv.Atoi(value); err == nil {
            return intVal
        }
    }
    return fallback
}
```

## Best Practices

1. **Project Structure**: Follow standard Go project layout
2. **Error Handling**: Use explicit error handling patterns
3. **Interfaces**: Define interfaces for testability
4. **Context**: Use context for request scoping
5. **Validation**: Input validation with struct tags
6. **Testing**: Unit tests with mocks, integration tests
7. **Logging**: Structured logging throughout
8. **Configuration**: Environment-based configuration
