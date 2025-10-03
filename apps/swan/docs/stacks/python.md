# Python Stack

Build fast, modern APIs with Python using FastAPI or Flask. Swan generates type-safe, async-first applications with automatic API documentation and excellent developer experience.

## Framework Options

### FastAPI (Default)

Modern, fast web framework with automatic API documentation.

```yaml
# swan.yaml
stack:
  language: "python"
  framework: "fastapi"
  python_version: "3.11"
```

### Flask

Lightweight, flexible microframework.

```yaml
stack:
  language: "python"
  framework: "flask"
  python_version: "3.11"
```

## Generated Project Structure

```
my-service/
├── app/
│   ├── api/
│   │   ├── dependencies.py
│   │   ├── routes/
│   │   │   └── users.py
│   │   └── __init__.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── __init__.py
│   ├── models/
│   │   ├── user.py
│   │   └── __init__.py
│   ├── schemas/
│   │   ├── user.py
│   │   └── __init__.py
│   ├── services/
│   │   ├── user.py
│   │   └── __init__.py
│   ├── utils/
│   │   ├── logger.py
│   │   └── __init__.py
│   ├── main.py
│   └── __init__.py
├── tests/
│   ├── conftest.py
│   ├── test_users.py
│   └── __init__.py
├── requirements.txt
├── pyproject.toml
├── .env.example
└── docker/
    └── Dockerfile
```

## Code Examples

### API Routes (FastAPI)

```python
# app/api/routes/users.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.schemas.user import User, UserCreate, UserUpdate
from app.services.user import UserService
from app.utils.logger import logger

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[User])
async def get_users(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
) -> List[User]:
    """
    Retrieve users with pagination.

    - **limit**: Number of users to return (1-100)
    - **offset**: Number of users to skip
    """
    try:
        user_service = UserService(db)
        users = await user_service.get_users(limit=limit, offset=offset)
        return users
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/", response_model=User, status_code=201)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> User:
    """
    Create a new user.
    """
    try:
        user_service = UserService(db)

        # Check if user already exists
        existing_user = await user_service.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="User with this email already exists"
            )

        user = await user_service.create_user(user_data)
        logger.info(f"User created: {user.id}")
        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get user by ID.
    """
    user_service = UserService(db)
    user = await user_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
```

### Pydantic Schemas

```python
# app/schemas/user.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator
import re

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = Field(None, min_length=1, max_length=100)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)

    @validator('password')
    def validate_password(cls, v):
        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)', v):
            raise ValueError(
                'Password must contain at least one uppercase letter, '
                'one lowercase letter, and one number'
            )
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)

class User(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class UserInDB(User):
    password_hash: str
```

### Service Layer

```python
# app/services/user.py
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import uuid
from passlib.context import CryptContext

from app.models.user import User as UserModel
from app.schemas.user import UserCreate, UserUpdate
from app.utils.logger import logger

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService:
    def __init__(self, db: Session):
        self.db = db

    async def get_users(self, limit: int = 10, offset: int = 0) -> List[UserModel]:
        """Get paginated list of users."""
        return (
            self.db.query(UserModel)
            .offset(offset)
            .limit(limit)
            .all()
        )

    async def get_user_by_id(self, user_id: str) -> Optional[UserModel]:
        """Get user by ID."""
        return (
            self.db.query(UserModel)
            .filter(UserModel.id == user_id)
            .first()
        )

    async def get_user_by_email(self, email: str) -> Optional[UserModel]:
        """Get user by email."""
        return (
            self.db.query(UserModel)
            .filter(UserModel.email == email)
            .first()
        )

    async def create_user(self, user_data: UserCreate) -> UserModel:
        """Create a new user."""
        password_hash = pwd_context.hash(user_data.password)

        user = UserModel(
            id=str(uuid.uuid4()),
            email=user_data.email,
            name=user_data.name,
            password_hash=password_hash
        )

        try:
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            logger.info(f"User created successfully: {user.id}")
            return user
        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"Failed to create user: {str(e)}")
            raise ValueError("User with this email already exists")

    async def update_user(self, user_id: str, user_data: UserUpdate) -> Optional[UserModel]:
        """Update user."""
        user = await self.get_user_by_id(user_id)
        if not user:
            return None

        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        try:
            self.db.commit()
            self.db.refresh(user)
            logger.info(f"User updated successfully: {user.id}")
            return user
        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"Failed to update user: {str(e)}")
            raise ValueError("Update failed due to constraint violation")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password."""
        return pwd_context.verify(plain_password, hashed_password)
```

### Database Models (SQLAlchemy)

```python
# app/models/user.py
from sqlalchemy import Column, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User(id='{self.id}', email='{self.email}')>"
```

### Dependencies & Database

```python
# app/api/dependencies.py
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.user import UserService

security = HTTPBearer()

def get_db() -> Generator:
    """Database dependency."""
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

async def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Get current authenticated user."""
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    user_service = UserService(db)
    user = await user_service.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user
```

### Configuration

```python
# app/core/config.py
from typing import Optional
from pydantic import BaseSettings, PostgresDsn, validator

class Settings(BaseSettings):
    # API Settings
    PROJECT_NAME: str = "Swan Service"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RELOAD: bool = False

    # Database
    DATABASE_URL: PostgresDsn
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10

    # Security
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 3600  # 1 hour

    # Redis
    REDIS_URL: Optional[str] = None

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    # CORS
    CORS_ORIGINS: list[str] = ["*"]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: list[str] = ["*"]
    CORS_HEADERS: list[str] = ["*"]

    @validator("DATABASE_URL", pre=True)
    def validate_database_url(cls, v):
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql",
            user=v.get("user"),
            password=v.get("password"),
            host=v.get("host"),
            port=v.get("port"),
            path=f"/{v.get('database', '')}"
        )

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

## Testing

### Pytest Configuration

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from app.main import app
from app.api.dependencies import get_db
from app.models.user import Base

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

@pytest.fixture(scope="session")
def client():
    # Create test database
    Base.metadata.create_all(bind=engine)

    # Override database dependency
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    # Cleanup
    os.remove("./test.db")

@pytest.fixture
def sample_user_data():
    return {
        "email": "test@example.com",
        "name": "Test User",
        "password": "TestPassword123"
    }
```

### Unit Tests

```python
# tests/test_users.py
import pytest
from fastapi.testclient import TestClient

def test_create_user(client: TestClient, sample_user_data):
    """Test user creation."""
    response = client.post("/api/v1/users/", json=sample_user_data)

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == sample_user_data["email"]
    assert data["name"] == sample_user_data["name"]
    assert "id" in data
    assert "password" not in data

def test_get_users(client: TestClient, sample_user_data):
    """Test getting users list."""
    # Create a user first
    client.post("/api/v1/users/", json=sample_user_data)

    response = client.get("/api/v1/users/")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_get_user_by_id(client: TestClient, sample_user_data):
    """Test getting user by ID."""
    # Create user
    create_response = client.post("/api/v1/users/", json=sample_user_data)
    user_id = create_response.json()["id"]

    response = client.get(f"/api/v1/users/{user_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_id

def test_create_user_duplicate_email(client: TestClient, sample_user_data):
    """Test creating user with duplicate email."""
    # Create first user
    client.post("/api/v1/users/", json=sample_user_data)

    # Try to create second user with same email
    response = client.post("/api/v1/users/", json=sample_user_data)

    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

@pytest.mark.parametrize("invalid_password", [
    "short",  # Too short
    "nouppercase123",  # No uppercase
    "NOLOWERCASE123",  # No lowercase
    "NoNumbers",  # No numbers
])
def test_create_user_invalid_password(client: TestClient, sample_user_data, invalid_password):
    """Test user creation with invalid passwords."""
    sample_user_data["password"] = invalid_password

    response = client.post("/api/v1/users/", json=sample_user_data)

    assert response.status_code == 422
```

## Async Operations

### Database with asyncpg

```python
# app/core/database_async.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    echo=settings.LOG_LEVEL == "DEBUG"
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

### Async Service

```python
# app/services/user_async.py
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User as UserModel
from app.schemas.user import UserCreate

class AsyncUserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_users(self, limit: int = 10, offset: int = 0) -> List[UserModel]:
        """Get paginated users asynchronously."""
        result = await self.db.execute(
            select(UserModel)
            .offset(offset)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_user_by_id(self, user_id: str) -> Optional[UserModel]:
        """Get user by ID asynchronously."""
        result = await self.db.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_user(self, user_data: UserCreate) -> UserModel:
        """Create user asynchronously."""
        user = UserModel(**user_data.dict())
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
```

## Performance & Optimization

### Caching with Redis

```python
# app/utils/cache.py
import json
import redis.asyncio as redis
from typing import Any, Optional
from app.core.config import settings

class CacheService:
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL) if settings.REDIS_URL else None

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if not self.redis:
            return None

        try:
            value = await self.redis.get(key)
            return json.loads(value) if value else None
        except Exception:
            return None

    async def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in cache."""
        if not self.redis:
            return False

        try:
            await self.redis.setex(key, ttl, json.dumps(value, default=str))
            return True
        except Exception:
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if not self.redis:
            return False

        try:
            await self.redis.delete(key)
            return True
        except Exception:
            return False

cache = CacheService()
```

## Best Practices

1. **Type Hints**: Use comprehensive type hints throughout
2. **Pydantic Models**: Leverage Pydantic for data validation
3. **Async/Await**: Use async operations for I/O bound tasks
4. **Error Handling**: Implement proper exception handling
5. **Testing**: Comprehensive test coverage with pytest
6. **Logging**: Structured logging with correlation IDs
7. **Security**: Input validation, authentication, authorization
8. **Performance**: Use async databases, caching, connection pooling
