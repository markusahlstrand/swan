# Deployment Targets

Swan supports multiple deployment platforms, allowing you to choose the best hosting solution for your service requirements. Each deployment target is optimized for specific use cases and comes with automated configuration.

## Supported Platforms

| Platform                                     | Best For                       | Scaling     | Cold Start | Cost Model     |
| -------------------------------------------- | ------------------------------ | ----------- | ---------- | -------------- |
| [Cloudflare Workers](/deployment/cloudflare) | Edge computing, global latency | Auto        | ~5ms       | Request-based  |
| [Docker](/deployment/docker)                 | Container orchestration, K8s   | Manual/Auto | Variable   | Resource-based |
| [Vercel](/deployment/vercel)                 | Serverless functions, JAMstack | Auto        | ~100ms     | Request-based  |
| [AWS Lambda](/deployment/aws-lambda)         | Event-driven, AWS ecosystem    | Auto        | ~200ms     | Request-based  |
| [Google Cloud Run](/deployment/gcp-run)      | Containerized serverless       | Auto        | ~300ms     | Request-based  |
| [Heroku](/deployment/heroku)                 | Simple deployment, prototyping | Manual      | None       | Dyno-based     |
| [Railway](/deployment/railway)               | Modern platform, simple setup  | Auto        | None       | Resource-based |
| [Fly.io](/deployment/fly)                    | Edge deployment, full machines | Manual/Auto | ~50ms      | Machine-based  |

## Deployment Strategy Matrix

### By Service Characteristics

**Stateless APIs**

- ✅ Cloudflare Workers, Vercel, AWS Lambda
- ⚠️ All platforms suitable

**Database Connections**

- ✅ Docker, Heroku, Railway, Fly.io
- ⚠️ Connection pooling required for serverless

**File Storage**

- ✅ Docker, traditional platforms
- ⚠️ Use cloud storage for serverless

**Background Jobs**

- ✅ Docker, Heroku, Railway
- ❌ Not suitable for pure serverless

### By Traffic Pattern

**Low Traffic (< 1K requests/day)**

- Vercel, Railway (free tiers)
- Heroku (hobby dyno)

**Medium Traffic (1K-100K requests/day)**

- Cloudflare Workers, AWS Lambda
- Docker on GCP Cloud Run

**High Traffic (100K+ requests/day)**

- Cloudflare Workers, Docker + K8s
- Multi-region deployment

### By Geographic Distribution

**Global Users**

- Cloudflare Workers (175+ locations)
- AWS Lambda + CloudFront
- Vercel Edge Functions

**Regional Users**

- Single region Docker deployment
- Regional cloud providers

## Code Generation

Swan generates deployment-specific configurations:

### Environment Configuration

```yaml
# Generated for each platform
deployment:
  cloudflare:
    environment: "production"
    cpu_limit: "50ms"
    memory_limit: "128MB"

  docker:
    image: "node:18-alpine"
    port: 3000
    health_check: "/health"

  vercel:
    runtime: "nodejs18.x"
    memory: 1024
    max_duration: 10
```

### Platform-Specific Files

Swan automatically generates:

- `Dockerfile` for container platforms
- `wrangler.toml` for Cloudflare Workers
- `vercel.json` for Vercel
- `Procfile` for Heroku
- `railway.json` for Railway
- `fly.toml` for Fly.io

## Automated Deployment

### GitHub Actions Integration

```yaml
# Generated .github/workflows/deploy.yml
name: Deploy to Multiple Platforms

on:
  push:
    branches: [main]

jobs:
  deploy-cloudflare:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3

  deploy-docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker image
        run: |
          docker build -t myservice .
          docker push myregistry/myservice
```

### CLI Deployment

```bash
# Deploy to multiple platforms with single command
swan deploy --all

# Deploy to specific platform
swan deploy cloudflare --env production
swan deploy docker --registry gcr.io/myproject

# Deploy with custom configuration
swan deploy --config ./deploy/staging.yaml
```

## Environment Management

### Configuration Strategy

Swan manages environment-specific configurations:

```yaml
# swan.yaml
environments:
  development:
    database_url: "postgresql://localhost:5432/dev"
    log_level: "debug"

  staging:
    database_url: "${STAGING_DATABASE_URL}"
    log_level: "info"

  production:
    database_url: "${DATABASE_URL}"
    log_level: "warn"
    rate_limit: 1000
    cache_ttl: 300
```

### Secrets Management

Platform-specific secret handling:

```bash
# Cloudflare Workers
swan secrets set DATABASE_URL --platform cloudflare

# Vercel
swan secrets set JWT_SECRET --platform vercel

# Docker (via environment file)
swan secrets generate-env --platform docker --env production
```

## Monitoring Across Platforms

### Unified Observability

Swan provides consistent monitoring regardless of platform:

```yaml
monitoring:
  metrics:
    provider: "prometheus" # or "datadog", "newrelic"
    endpoint: "/metrics"

  logging:
    format: "json"
    level: "${LOG_LEVEL}"

  tracing:
    enabled: true
    exporter: "jaeger"
    sample_rate: 0.1
```

### Platform-Specific Integration

- **Cloudflare**: Analytics, Real User Monitoring
- **Vercel**: Built-in Analytics, Web Vitals
- **Docker**: Prometheus + Grafana stack
- **AWS**: CloudWatch integration
- **GCP**: Cloud Monitoring integration

## Cost Optimization

### Automatic Right-sizing

Swan provides cost analysis and recommendations:

```bash
# Analyze current deployment costs
swan cost analyze --timeframe 30d

# Get platform recommendations
swan cost recommend --traffic-pattern ./analytics.json

# Simulate costs for different platforms
swan cost simulate --platforms cloudflare,vercel,lambda
```

### Multi-Platform Strategy

```yaml
# Route traffic based on cost/performance
routing:
  primary: "cloudflare" # Main traffic
  overflow: "aws-lambda" # Burst capacity
  fallback: "docker" # High availability
```

## Migration Support

### Platform Migration

```bash
# Migrate between platforms
swan migrate --from docker --to cloudflare

# Generate migration checklist
swan migrate checklist --source heroku --target railway

# Test compatibility
swan validate --platform cloudflare --stack nodejs
```

### Blue-Green Deployment

```yaml
# Automated blue-green across platforms
deployment:
  strategy: "blue-green"
  platforms:
    blue: "cloudflare-workers"
    green: "vercel-functions"
  traffic_split: "10/90" # Gradual migration
```

## Best Practices

### Platform Selection

1. **Start Simple**: Begin with platforms like Vercel or Railway
2. **Measure Performance**: Use real traffic data for decisions
3. **Consider Constraints**: Database connections, file system access
4. **Plan for Scale**: Choose platforms that can grow with you

### Deployment Strategy

1. **Environment Parity**: Keep dev/staging/prod consistent
2. **Automated Testing**: Test deployments in CI/CD
3. **Rollback Plan**: Always have a rollback strategy
4. **Monitoring**: Set up alerts before deployment
5. **Documentation**: Document deployment procedures

### Security

1. **Secrets Management**: Never commit secrets to code
2. **Network Security**: Use TLS/SSL everywhere
3. **Access Control**: Limit deployment permissions
4. **Vulnerability Scanning**: Regular security updates

## Next Steps

Choose your deployment platform and follow the detailed setup guide:

- [Cloudflare Workers Deployment](/deployment/cloudflare)
- [Docker Deployment](/deployment/docker)
- [Vercel Deployment](/deployment/vercel)
- [AWS Lambda Deployment](/deployment/aws-lambda)
- [Google Cloud Run Deployment](/deployment/gcp-run)
- [Heroku Deployment](/deployment/heroku)
- [Railway Deployment](/deployment/railway)
- [Fly.io Deployment](/deployment/fly)
