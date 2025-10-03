# Node.js Stack

Build high-performance APIs with Node.js using modern JavaScript/TypeScript patterns. Swan generates production-ready Express or Fastify applications with built-in best practices.

## Framework Options

### Express.js (Default)

Battle-tested, widely adopted web framework.

```yaml
# swan.yaml
stack:
  language: "nodejs"
  framework: "express"
  typescript: true
```

### Fastify

High-performance alternative with built-in validation.

```yaml
stack:
  language: "nodejs"
  framework: "fastify"
  typescript: true
```

## Generated Project Structure

```
my-service/
├── src/
│   ├── controllers/
│   │   └── users.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── cors.middleware.ts
│   │   └── validation.middleware.ts
│   ├── models/
│   │   └── user.model.ts
│   ├── routes/
│   │   └── users.routes.ts
│   ├── services/
│   │   └── user.service.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   └── config.ts
│   └── app.ts
├── tests/
│   ├── integration/
│   └── unit/
├── package.json
├── tsconfig.json
├── .env.example
└── docker/
    └── Dockerfile
```

## Code Examples

### API Controller (Express)

```typescript
// src/controllers/users.controller.ts
import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { logger } from "../utils/logger";
import { CreateUserRequest, User } from "../models/user.model";

export class UsersController {
  constructor(private userService: UserService) {}

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10, offset = 0 } = req.query;
      const users = await this.userService.findMany({
        limit: Number(limit),
        offset: Number(offset),
      });

      res.json({
        data: users,
        meta: { limit, offset },
      });
    } catch (error) {
      logger.error("Error fetching users", { error: error.message });
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async createUser(
    req: Request<{}, User, CreateUserRequest>,
    res: Response
  ): Promise<void> {
    try {
      const user = await this.userService.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      if (error.code === "VALIDATION_ERROR") {
        res.status(400).json({ error: error.message });
      } else {
        logger.error("Error creating user", { error: error.message });
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
}
```

### Service Layer

```typescript
// src/services/user.service.ts
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
} from "../models/user.model";
import { Database } from "../utils/database";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

export class UserService {
  constructor(private db: Database) {}

  async findMany(options: { limit: number; offset: number }): Promise<User[]> {
    return this.db.users.findMany({
      skip: options.offset,
      take: options.limit,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }

  async create(data: CreateUserRequest): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await this.db.users.create({
      data: {
        id: uuidv4(),
        email: data.email,
        name: data.name,
        passwordHash: hashedPassword,
        createdAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    logger.info("User created", { userId: user.id, email: user.email });
    return user;
  }
}
```

### Data Models

```typescript
// src/models/user.model.ts
import { z } from "zod";

// Validation schemas
export const CreateUserRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
});

export const UpdateUserRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

// Type definitions
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}
```

### Authentication Middleware

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
    };

    next();
  } catch (error) {
    logger.warn("Authentication failed", { error: error.message });
    res.status(401).json({ error: "Invalid token" });
  }
};

export const requireRole = (role: string) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user?.roles.includes(role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
};
```

## Database Integration

### Prisma ORM (Recommended)

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String?
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}
```

### Database Service

```typescript
// src/utils/database.ts
import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

class Database {
  private static instance: Database;
  public client: PrismaClient;

  private constructor() {
    this.client = new PrismaClient({
      log: [
        { emit: "event", level: "query" },
        { emit: "event", level: "error" },
        { emit: "event", level: "warn" },
      ],
    });

    // Log database queries in development
    if (process.env.NODE_ENV === "development") {
      this.client.$on("query", (e) => {
        logger.debug("Database query", { query: e.query, params: e.params });
      });
    }
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
    try {
      await this.client.$connect();
      logger.info("Database connected successfully");
    } catch (error) {
      logger.error("Database connection failed", { error: error.message });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
    logger.info("Database disconnected");
  }
}

export const database = Database.getInstance();
```

## Testing

### Unit Tests (Jest)

```typescript
// tests/unit/user.service.test.ts
import { UserService } from "../../src/services/user.service";
import { Database } from "../../src/utils/database";

describe("UserService", () => {
  let userService: UserService;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = {
      users: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    } as any;

    userService = new UserService(mockDb);
  });

  describe("findMany", () => {
    it("should return paginated users", async () => {
      const mockUsers = [
        {
          id: "1",
          email: "user1@example.com",
          name: "User 1",
          createdAt: new Date(),
        },
        {
          id: "2",
          email: "user2@example.com",
          name: "User 2",
          createdAt: new Date(),
        },
      ];

      mockDb.users.findMany.mockResolvedValue(mockUsers);

      const result = await userService.findMany({ limit: 10, offset: 0 });

      expect(result).toEqual(mockUsers);
      expect(mockDb.users.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });
    });
  });
});
```

### Integration Tests (Supertest)

```typescript
// tests/integration/users.test.ts
import request from "supertest";
import { app } from "../../src/app";
import { database } from "../../src/utils/database";

describe("/users", () => {
  beforeAll(async () => {
    await database.connect();
  });

  afterAll(async () => {
    await database.disconnect();
  });

  describe("GET /users", () => {
    it("should return list of users", async () => {
      const response = await request(app).get("/users").expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty("meta");
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/users?limit=5&offset=10")
        .expect(200);

      expect(response.body.meta.limit).toBe("5");
      expect(response.body.meta.offset).toBe("10");
    });
  });
});
```

## Performance Optimization

### Caching

```typescript
// src/middleware/cache.middleware.ts
import Redis from "ioredis";
import { Request, Response, NextFunction } from "express";

const redis = new Redis(process.env.REDIS_URL);

export const cacheMiddleware = (ttl: number = 300) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (req.method !== "GET") {
      next();
      return;
    }

    const cacheKey = `cache:${req.originalUrl}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (data: any) {
        redis.setex(cacheKey, ttl, JSON.stringify(data));
        return originalJson(data);
      };

      next();
    } catch (error) {
      // Cache failure shouldn't break the request
      next();
    }
  };
};
```

## Deployment

### Docker

```dockerfile
# docker/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runtime

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
```

### Environment Configuration

```bash
# .env.example
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
LOG_LEVEL=info
```

## Monitoring & Observability

Swan automatically generates monitoring code:

```typescript
// src/utils/metrics.ts
import { createPrometheusMetrics } from "@prometheus/client";

export const metrics = {
  httpRequests: new Counter({
    name: "http_requests_total",
    help: "Total HTTP requests",
    labelNames: ["method", "route", "status_code"],
  }),

  httpDuration: new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration",
    labelNames: ["method", "route"],
  }),

  activeConnections: new Gauge({
    name: "active_connections",
    help: "Active database connections",
  }),
};
```

## Best Practices

1. **Use TypeScript**: Enable type safety and better IDE support
2. **Environment Variables**: Use dotenv for configuration
3. **Error Handling**: Implement comprehensive error middleware
4. **Validation**: Use Zod or Joi for request validation
5. **Logging**: Structured logging with correlation IDs
6. **Security**: Helmet.js, rate limiting, input sanitization
7. **Testing**: Unit, integration, and E2E tests
8. **Performance**: Connection pooling, caching, compression
