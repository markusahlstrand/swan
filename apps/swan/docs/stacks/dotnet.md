# .NET Stack

Build enterprise-grade APIs with .NET and ASP.NET Core. Swan generates robust, scalable services with built-in dependency injection, comprehensive logging, and extensive middleware support.

## Framework Support

### ASP.NET Core (Default)

Modern, cross-platform framework for building web APIs.

```yaml
# swan.yaml
stack:
  language: "dotnet"
  framework: "aspnetcore"
  dotnet_version: "8.0"
```

### Minimal APIs

Lightweight approach for simple APIs.

```yaml
stack:
  language: "dotnet"
  framework: "minimal"
  dotnet_version: "8.0"
```

## Project Structure

```
MyService/
├── src/
│   └── MyService.Api/
│       ├── Controllers/
│       │   └── UsersController.cs
│       ├── Models/
│       │   └── User.cs
│       ├── Services/
│       │   └── UserService.cs
│       ├── Repositories/
│       │   └── UserRepository.cs
│       ├── Middleware/
│       │   ├── AuthenticationMiddleware.cs
│       │   └── ExceptionMiddleware.cs
│       ├── Configuration/
│       │   └── ServiceConfiguration.cs
│       ├── Program.cs
│       └── MyService.Api.csproj
├── tests/
│   ├── MyService.Api.Tests/
│   └── MyService.Integration.Tests/
├── docker/
│   └── Dockerfile
├── MyService.sln
└── .env.example
```

## Code Examples

### API Controllers

```csharp
// Controllers/UsersController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyService.Api.Models;
using MyService.Api.Services;
using System.ComponentModel.DataAnnotations;

namespace MyService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated list of users
    /// </summary>
    /// <param name="limit">Number of users to return (max 100)</param>
    /// <param name="offset">Number of users to skip</param>
    /// <returns>List of users</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<UserResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PagedResponse<UserResponse>>> GetUsers(
        [FromQuery, Range(1, 100)] int limit = 10,
        [FromQuery, Range(0, int.MaxValue)] int offset = 0,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var users = await _userService.GetUsersAsync(limit, offset, cancellationToken);

            var response = new PagedResponse<UserResponse>
            {
                Data = users.Select(u => new UserResponse(u)).ToList(),
                Meta = new PaginationMeta
                {
                    Limit = limit,
                    Offset = offset,
                    Total = await _userService.GetUserCountAsync(cancellationToken)
                }
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching users with limit {Limit}, offset {Offset}", limit, offset);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    /// <param name="request">User creation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created user</returns>
    [HttpPost]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserResponse>> CreateUser(
        [FromBody] CreateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _userService.CreateUserAsync(request, cancellationToken);

            _logger.LogInformation("User created successfully: {UserId}", user.Id);

            return CreatedAtAction(
                nameof(GetUser),
                new { id = user.Id },
                new UserResponse(user));
        }
        catch (UserAlreadyExistsException)
        {
            return Conflict(new { error = "User with this email already exists" });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { error = "Validation failed", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user with email {Email}", request.Email);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    /// <param name="id">User ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>User details</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserResponse>> GetUser(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(id, cancellationToken);

            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            return Ok(new UserResponse(user));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user {UserId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
```

### Data Models

```csharp
// Models/User.cs
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MyService.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public required string Email { get; set; }
    public string? Name { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    [JsonIgnore]
    public required string PasswordHash { get; set; }
}

public class CreateUserRequest
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public required string Email { get; set; }

    [StringLength(100, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 100 characters")]
    public string? Name { get; set; }

    [Required(ErrorMessage = "Password is required")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 128 characters")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)",
        ErrorMessage = "Password must contain at least one uppercase letter, lowercase letter, and number")]
    public required string Password { get; set; }
}

public class UpdateUserRequest
{
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string? Email { get; set; }

    [StringLength(100, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 100 characters")]
    public string? Name { get; set; }
}

public class UserResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; }
    public string? Name { get; set; }
    public DateTime CreatedAt { get; set; }

    public UserResponse(User user)
    {
        Id = user.Id;
        Email = user.Email;
        Name = user.Name;
        CreatedAt = user.CreatedAt;
    }
}

public class PagedResponse<T>
{
    public List<T> Data { get; set; } = new();
    public PaginationMeta Meta { get; set; } = new();
}

public class PaginationMeta
{
    public int Limit { get; set; }
    public int Offset { get; set; }
    public int Total { get; set; }
}
```

### Service Layer

```csharp
// Services/UserService.cs
using MyService.Api.Models;
using MyService.Api.Repositories;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace MyService.Api.Services;

public interface IUserService
{
    Task<List<User>> GetUsersAsync(int limit, int offset, CancellationToken cancellationToken = default);
    Task<User?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetUserByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default);
    Task<User?> UpdateUserAsync(Guid id, UpdateUserRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserAsync(Guid id, CancellationToken cancellationToken = default);
    Task<int> GetUserCountAsync(CancellationToken cancellationToken = default);
    Task<bool> VerifyPasswordAsync(Guid userId, string password, CancellationToken cancellationToken = default);
}

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly ILogger<UserService> _logger;

    public UserService(
        IUserRepository userRepository,
        IPasswordHasher<User> passwordHasher,
        ILogger<UserService> logger)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<List<User>> GetUsersAsync(int limit, int offset, CancellationToken cancellationToken = default)
    {
        return await _userRepository.GetUsersAsync(limit, offset, cancellationToken);
    }

    public async Task<User?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _userRepository.GetUserByIdAsync(id, cancellationToken);
    }

    public async Task<User?> GetUserByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _userRepository.GetUserByEmailAsync(email, cancellationToken);
    }

    public async Task<User> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        // Check if user already exists
        var existingUser = await GetUserByEmailAsync(request.Email, cancellationToken);
        if (existingUser != null)
        {
            throw new UserAlreadyExistsException($"User with email {request.Email} already exists");
        }

        // Create user with hashed password
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            Name = request.Name,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            PasswordHash = string.Empty // Will be set below
        };

        // Hash password
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        var createdUser = await _userRepository.CreateUserAsync(user, cancellationToken);

        _logger.LogInformation("User created successfully: {UserId} with email {Email}",
            createdUser.Id, createdUser.Email);

        return createdUser;
    }

    public async Task<User?> UpdateUserAsync(Guid id, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        var user = await GetUserByIdAsync(id, cancellationToken);
        if (user == null)
        {
            return null;
        }

        // Update fields if provided
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            user.Email = request.Email;
        }

        if (request.Name != null)
        {
            user.Name = string.IsNullOrWhiteSpace(request.Name) ? null : request.Name;
        }

        user.UpdatedAt = DateTime.UtcNow;

        return await _userRepository.UpdateUserAsync(user, cancellationToken);
    }

    public async Task<bool> DeleteUserAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _userRepository.DeleteUserAsync(id, cancellationToken);
    }

    public async Task<int> GetUserCountAsync(CancellationToken cancellationToken = default)
    {
        return await _userRepository.GetUserCountAsync(cancellationToken);
    }

    public async Task<bool> VerifyPasswordAsync(Guid userId, string password, CancellationToken cancellationToken = default)
    {
        var user = await GetUserByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            return false;
        }

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        return result == PasswordVerificationResult.Success;
    }
}

public class UserAlreadyExistsException : Exception
{
    public UserAlreadyExistsException(string message) : base(message) { }
}
```

### Repository Layer (Entity Framework)

```csharp
// Repositories/UserRepository.cs
using Microsoft.EntityFrameworkCore;
using MyService.Api.Models;
using MyService.Api.Data;

namespace MyService.Api.Repositories;

public interface IUserRepository
{
    Task<List<User>> GetUsersAsync(int limit, int offset, CancellationToken cancellationToken = default);
    Task<User?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetUserByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User> CreateUserAsync(User user, CancellationToken cancellationToken = default);
    Task<User> UpdateUserAsync(User user, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserAsync(Guid id, CancellationToken cancellationToken = default);
    Task<int> GetUserCountAsync(CancellationToken cancellationToken = default);
}

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;
    private readonly ILogger<UserRepository> _logger;

    public UserRepository(AppDbContext context, ILogger<UserRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<User>> GetUsersAsync(int limit, int offset, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<User?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<User?> GetUserByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
    }

    public async Task<User> CreateUserAsync(User user, CancellationToken cancellationToken = default)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<User> UpdateUserAsync(User user, CancellationToken cancellationToken = default)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<bool> DeleteUserAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await GetUserByIdAsync(id, cancellationToken);
        if (user == null)
        {
            return false;
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<int> GetUserCountAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Users.CountAsync(cancellationToken);
    }
}
```

## Program Setup

```csharp
// Program.cs
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MyService.Api.Configuration;
using MyService.Api.Data;
using MyService.Api.Models;
using MyService.Api.Repositories;
using MyService.Api.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Identity
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// Services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();

// Authentication & Authorization
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.Authority = builder.Configuration["Auth:Authority"];
        options.TokenValidationParameters.ValidateAudience = false;
    });

builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Database migration
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await context.Database.MigrateAsync();
}

await app.RunAsync();
```

## Testing

### Unit Tests (xUnit)

```csharp
// Tests/UserServiceTests.cs
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Moq;
using MyService.Api.Models;
using MyService.Api.Repositories;
using MyService.Api.Services;
using Xunit;

namespace MyService.Api.Tests;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _mockRepository;
    private readonly Mock<IPasswordHasher<User>> _mockPasswordHasher;
    private readonly Mock<ILogger<UserService>> _mockLogger;
    private readonly UserService _userService;

    public UserServiceTests()
    {
        _mockRepository = new Mock<IUserRepository>();
        _mockPasswordHasher = new Mock<IPasswordHasher<User>>();
        _mockLogger = new Mock<ILogger<UserService>>();
        _userService = new UserService(_mockRepository.Object, _mockPasswordHasher.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task CreateUserAsync_WithValidRequest_ReturnsUser()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "test@example.com",
            Name = "Test User",
            Password = "TestPassword123"
        };

        _mockRepository.Setup(r => r.GetUserByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
                      .ReturnsAsync((User?)null);

        var hashedPassword = "hashed_password";
        _mockPasswordHasher.Setup(h => h.HashPassword(It.IsAny<User>(), request.Password))
                          .Returns(hashedPassword);

        var expectedUser = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            Name = request.Name,
            PasswordHash = hashedPassword,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockRepository.Setup(r => r.CreateUserAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                      .ReturnsAsync(expectedUser);

        // Act
        var result = await _userService.CreateUserAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(request.Email, result.Email);
        Assert.Equal(request.Name, result.Name);
        _mockRepository.Verify(r => r.CreateUserAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateUserAsync_WithExistingEmail_ThrowsException()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "existing@example.com",
            Password = "TestPassword123"
        };

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockRepository.Setup(r => r.GetUserByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
                      .ReturnsAsync(existingUser);

        // Act & Assert
        await Assert.ThrowsAsync<UserAlreadyExistsException>(
            () => _userService.CreateUserAsync(request));
    }
}
```

## Best Practices

1. **Dependency Injection**: Use built-in DI container
2. **Async/Await**: Async operations throughout
3. **Configuration**: IOptions pattern for settings
4. **Logging**: Structured logging with Serilog
5. **Validation**: Data annotations and FluentValidation
6. **Testing**: Unit tests with xUnit and Moq
7. **Security**: Built-in authentication and authorization
8. **Documentation**: XML comments and Swagger/OpenAPI
