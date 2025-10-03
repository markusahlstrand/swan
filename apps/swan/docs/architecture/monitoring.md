# Monitoring & Observability

Swan provides comprehensive observability features to help you monitor, debug, and optimize your services in production.

## The Three Pillars

### 1. Metrics

Quantitative measurements of your service performance and business logic.

### 2. Logs

Detailed records of events and operations within your service.

### 3. Traces

Request flow tracking across distributed service boundaries.

## Built-in Metrics

Swan automatically collects essential service metrics:

### HTTP Metrics

- Request count by endpoint and status code
- Response time percentiles (p50, p95, p99)
- Request size and response size
- Error rates by endpoint

### System Metrics

- CPU usage and memory consumption
- Garbage collection statistics (where applicable)
- Database connection pool usage
- Cache hit/miss ratios

### Business Metrics

Define custom metrics for business logic:

```yaml
metrics:
  custom:
    - name: "user_registrations"
      type: "counter"
      description: "Total user registrations"
      labels: ["source", "plan_type"]

    - name: "order_value"
      type: "histogram"
      description: "Order value distribution"
      buckets: [10, 50, 100, 500, 1000]

    - name: "active_sessions"
      type: "gauge"
      description: "Currently active user sessions"
```

## Structured Logging

### Log Levels

Swan uses standard log levels with consistent formatting:

- **ERROR**: System errors and exceptions
- **WARN**: Potentially problematic situations
- **INFO**: General informational messages
- **DEBUG**: Detailed debugging information

### Log Format

```yaml
logging:
  format: "json" # or "text"
  level: "info"
  fields:
    timestamp: true
    requestId: true
    userId: true
    method: true
    path: true
    statusCode: true
    duration: true
```

**Example JSON Log:**

```json
{
  "timestamp": "2023-10-03T10:30:00.000Z",
  "level": "info",
  "requestId": "req_abc123",
  "userId": "user_456",
  "method": "GET",
  "path": "/users/456",
  "statusCode": 200,
  "duration": 45,
  "message": "User retrieved successfully"
}
```

### Contextual Logging

```yaml
# Automatic context injection
logging:
  context:
    requestId: true
    userId: true
    organizationId: true
    traceId: true
    spanId: true
```

## Distributed Tracing

### OpenTelemetry Integration

Swan uses OpenTelemetry for standardized tracing:

```yaml
tracing:
  enabled: true
  exporter: "jaeger" # or "zipkin", "otlp"
  endpoint: "http://localhost:14268/api/traces"
  sampleRate: 0.1 # Sample 10% of requests
```

### Trace Correlation

Automatic trace propagation across service boundaries:

```yaml
tracing:
  propagation:
    - "tracecontext"
    - "baggage"
    - "b3"
  headers:
    - "x-trace-id"
    - "x-span-id"
    - "x-request-id"
```

### Custom Spans

Add custom spans for detailed tracing:

```yaml
endpoints:
  - path: "/users/{id}"
    method: "GET"
    spans:
      - name: "database_query"
        operation: "db.query"
        attributes:
          db.system: "postgresql"
          db.statement: "SELECT * FROM users WHERE id = $1"

      - name: "cache_lookup"
        operation: "cache.get"
        attributes:
          cache.system: "redis"
```

## Health Checks

### Built-in Health Endpoints

```yaml
health:
  endpoint: "/health"
  checks:
    - name: "database"
      type: "postgresql"
      connection: "${DATABASE_URL}"
      timeout: "5s"

    - name: "cache"
      type: "redis"
      connection: "${REDIS_URL}"
      timeout: "2s"

    - name: "external_service"
      type: "http"
      url: "${EXTERNAL_API_URL}/health"
      timeout: "10s"
```

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2023-10-03T10:30:00.000Z",
  "duration": 250,
  "checks": {
    "database": {
      "status": "healthy",
      "duration": 150
    },
    "cache": {
      "status": "healthy",
      "duration": 50
    },
    "external_service": {
      "status": "degraded",
      "duration": 5000,
      "error": "Response time exceeded threshold"
    }
  }
}
```

## Alerting

### Threshold-based Alerts

```yaml
alerts:
  - name: "high_error_rate"
    condition: "error_rate > 0.05"
    duration: "5m"
    severity: "critical"
    channels: ["slack", "pagerduty"]

  - name: "high_response_time"
    condition: "response_time_p95 > 1000"
    duration: "2m"
    severity: "warning"
    channels: ["slack"]

  - name: "database_connection_failure"
    condition: "database_health == 'unhealthy'"
    duration: "30s"
    severity: "critical"
    channels: ["pagerduty"]
```

### Alert Channels

```yaml
alerting:
  channels:
    slack:
      webhook: "${SLACK_WEBHOOK_URL}"
      channel: "#alerts"
      template: |
        🚨 Alert: {{.Name}}
        Service: {{.Service}}
        Severity: {{.Severity}}
        Message: {{.Message}}

    pagerduty:
      integrationKey: "${PAGERDUTY_INTEGRATION_KEY}"
      severity: "{{.Severity}}"
```

## Performance Monitoring

### Automatic Performance Tracking

Swan tracks key performance indicators:

- Request throughput (requests per second)
- Error rates by endpoint and error type
- Resource utilization (CPU, memory, I/O)
- Database query performance
- External API dependency performance

### Custom Performance Metrics

```yaml
performance:
  tracking:
    - name: "user_query_performance"
      type: "database"
      query: "SELECT * FROM users WHERE active = true"
      threshold: "100ms"

    - name: "image_processing_time"
      type: "custom"
      operation: "process_image"
      threshold: "5s"
```

## Integration with Monitoring Tools

### Prometheus

Export metrics in Prometheus format:

```yaml
monitoring:
  prometheus:
    enabled: true
    endpoint: "/metrics"
    prefix: "myservice_"
```

### Grafana Dashboards

Generate pre-configured dashboards:

```bash
# Generate Grafana dashboard
swan monitoring dashboard grafana --output ./monitoring/dashboard.json
```

### APM Platforms

Integration with popular APM platforms:

```yaml
monitoring:
  apm:
    provider: "datadog" # or "newrelic", "elastic"
    apiKey: "${APM_API_KEY}"
    environment: "${ENVIRONMENT}"
    version: "${SERVICE_VERSION}"
```

## Error Tracking

### Automatic Error Capture

Swan automatically captures and tracks:

- Unhandled exceptions
- HTTP error responses (4xx, 5xx)
- Database connection errors
- Timeout errors
- Validation failures

### Error Context

```yaml
errors:
  tracking:
    enabled: true
    captureStackTrace: true
    includeRequest: true
    includeUser: true
    sampleRate: 1.0
```

### Error Grouping and Deduplication

```yaml
errors:
  grouping:
    - field: "error.type"
    - field: "error.message"
    - field: "request.path"

  deduplication:
    window: "5m"
    threshold: 10
```

## Best Practices

1. **Start Simple**: Begin with basic metrics and logs
2. **Monitor What Matters**: Focus on business-critical metrics
3. **Set Meaningful Thresholds**: Base alerts on user impact
4. **Use Correlation IDs**: Track requests across services
5. **Monitor Dependencies**: Track external service health
6. **Regular Review**: Continuously improve monitoring coverage
7. **Documentation**: Document your monitoring setup and runbooks
