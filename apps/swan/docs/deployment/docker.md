# Docker Deployment

Deploy your Swan services as containers for maximum flexibility, portability, and control. Perfect for Kubernetes, cloud platforms, or on-premises infrastructure.

## Overview

Docker deployment provides:

- **Complete environment control** - OS, runtime, dependencies
- **Horizontal scaling** with container orchestration
- **Multi-platform support** - Linux, Windows containers
- **Resource isolation** and consistent performance
- **Easy local development** and testing

## Generated Dockerfile

Swan creates optimized, multi-stage Dockerfiles for each stack:

### Node.js Dockerfile

```dockerfile
# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS runtime

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
```

### Python Dockerfile

```dockerfile
FROM python:3.11-slim AS builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim AS runtime

# Create non-root user
RUN useradd --create-home --shell /bin/bash app

WORKDIR /app

# Copy installed packages
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY --chown=app:app . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

USER app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Docker Compose Setup

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/myservice
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myservice
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

## Kubernetes Deployment

### Deployment Manifest

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myservice
  labels:
    app: myservice
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myservice
  template:
    metadata:
      labels:
        app: myservice
    spec:
      containers:
        - name: myservice
          image: myregistry/myservice:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: myservice-secrets
                  key: database-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: myservice-secrets
                  key: jwt-secret
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 15"]
---
apiVersion: v1
kind: Service
metadata:
  name: myservice-service
spec:
  selector:
    app: myservice
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

### Ingress Configuration

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myservice-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
    - hosts:
        - api.myservice.com
      secretName: myservice-tls
  rules:
    - host: api.myservice.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myservice-service
                port:
                  number: 80
```

## Cloud Platform Deployment

### Google Cloud Run

```bash
# Build and push image
docker build -t gcr.io/my-project/myservice .
docker push gcr.io/my-project/myservice

# Deploy to Cloud Run
gcloud run deploy myservice \
  --image gcr.io/my-project/myservice \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 100 \
  --timeout 300
```

### AWS ECS with Fargate

```json
// ecs-task-definition.json
{
  "family": "myservice",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "myservice",
      "image": "account.dkr.ecr.region.amazonaws.com/myservice:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:ssm:region:account:parameter/myservice/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/myservice",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

## Environment Configuration

### .env Files

```bash
# .env.production
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@db-host:5432/dbname
DATABASE_POOL_SIZE=10

# Cache
REDIS_URL=redis://redis-host:6379
CACHE_TTL=300

# Security
JWT_SECRET=your-jwt-secret-here
CORS_ORIGINS=https://myapp.com,https://api.myapp.com

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn

# Feature flags
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX_REQUESTS=100
```

### Docker Secrets

```bash
# Create Docker secrets
echo "postgresql://user:pass@db:5432/mydb" | docker secret create db_url -
echo "your-jwt-secret" | docker secret create jwt_secret -

# Use in docker-compose.yml
services:
  app:
    secrets:
      - db_url
      - jwt_secret
    environment:
      - DATABASE_URL_FILE=/run/secrets/db_url
      - JWT_SECRET_FILE=/run/secrets/jwt_secret

secrets:
  db_url:
    external: true
  jwt_secret:
    external: true
```

## Monitoring & Logging

### Application Monitoring

```dockerfile
# Add monitoring to Dockerfile
FROM myservice:latest

# Install monitoring agent
RUN curl -sSO https://dl.google.com/cloudagents/add-monitoring-agent-repo.sh && \
    bash add-monitoring-agent-repo.sh && \
    apt-get update && \
    apt-get install -y stackdriver-agent

# Copy monitoring configuration
COPY monitoring.conf /etc/stackdriver/

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
```

### Prometheus Integration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "myservice"
    static_configs:
      - targets: ["myservice:3000"]
    metrics_path: "/metrics"
    scrape_interval: 10s

  - job_name: "postgres"
    static_configs:
      - targets: ["postgres-exporter:9187"]

  - job_name: "redis"
    static_configs:
      - targets: ["redis-exporter:9121"]
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "MyService Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

## CI/CD Pipeline

```yaml
# .github/workflows/docker.yml
name: Docker Build and Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build test image
        uses: docker/build-push-action@v5
        with:
          context: .
          target: builder
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Run tests
        run: |
          docker run --rm \
            -v ${{ github.workspace }}:/app \
            -w /app \
            node:18-alpine \
            npm test

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: "${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest"
          format: "sarif"
          output: "trivy-results.sarif"

  deploy:
    needs: [build-and-test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix=sha-

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy to Kubernetes
        run: |
          echo "${{ secrets.KUBECONFIG }}" | base64 -d > kubeconfig
          export KUBECONFIG=kubeconfig

          kubectl set image deployment/myservice \
            myservice=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}

          kubectl rollout status deployment/myservice
```

## Performance Optimization

### Multi-stage Builds

```dockerfile
# Optimize image size with multi-stage builds
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
WORKDIR /app

COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist

USER nextjs
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Resource Limits

```yaml
# Set appropriate resource limits
resources:
  requests:
    memory: "64Mi"
    cpu: "50m"
  limits:
    memory: "128Mi"
    cpu: "200m"
```

## Best Practices

1. **Security**: Use non-root users, scan for vulnerabilities
2. **Size**: Minimize image size with multi-stage builds
3. **Caching**: Leverage build cache and layer caching
4. **Health Checks**: Implement proper health and readiness probes
5. **Logging**: Use structured logging to stdout/stderr
6. **Secrets**: Never embed secrets in images
7. **Monitoring**: Include monitoring and observability
8. **Updates**: Keep base images and dependencies updated
