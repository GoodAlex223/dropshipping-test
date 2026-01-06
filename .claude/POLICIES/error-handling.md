# Error Handling Policy

Standards for handling errors, exceptions, and failures gracefully.

---

## Core Principles

1. **Fail fast** - Detect errors early, before they cause more damage
2. **Fail gracefully** - Provide useful feedback, don't crash unexpectedly
3. **Fail safely** - Don't expose sensitive information in errors
4. **Fail visibly** - Log errors for debugging, alert on critical issues

---

## Error Categories

### By Recoverability

| Category            | Description                 | Handling                       | Example                                  |
| ------------------- | --------------------------- | ------------------------------ | ---------------------------------------- |
| **Recoverable**     | Can continue after handling | Retry, fallback, or skip       | Network timeout, missing optional config |
| **Non-recoverable** | Must stop current operation | Clean abort, user notification | Invalid input, missing required resource |
| **Fatal**           | System cannot continue      | Graceful shutdown, alert       | Database connection lost, out of memory  |

### By Source

| Source               | Examples                         | Typical Response                   |
| -------------------- | -------------------------------- | ---------------------------------- |
| **User Input**       | Invalid format, missing field    | Validation error with guidance     |
| **External Service** | API timeout, rate limit          | Retry with backoff, fallback       |
| **Internal Logic**   | Unexpected state, assertion fail | Log, investigate, possibly recover |
| **System Resource**  | Disk full, memory limit          | Alert, graceful degradation        |
| **Configuration**    | Missing env var, invalid setting | Fail fast on startup               |

---

## Error Design Patterns

### Custom Error Types

Create specific error types for your domain:

```python
# Python example
class AppError(Exception):
    """Base error for application."""
    def __init__(self, message: str, code: str = None, details: dict = None):
        super().__init__(message)
        self.code = code
        self.details = details or {}

class ValidationError(AppError):
    """Invalid user input."""
    pass

class NotFoundError(AppError):
    """Resource not found."""
    pass

class AuthorizationError(AppError):
    """User not authorized."""
    pass

class ExternalServiceError(AppError):
    """External service failure."""
    pass
```

```typescript
// TypeScript example
class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ValidationError extends AppError {}
class NotFoundError extends AppError {}
class AuthorizationError extends AppError {}
```

### Result Types (Alternative to Exceptions)

For expected failure cases, consider result types:

```python
from typing import Union, TypeVar, Generic
from dataclasses import dataclass

T = TypeVar('T')
E = TypeVar('E')

@dataclass
class Ok(Generic[T]):
    value: T

@dataclass
class Err(Generic[E]):
    error: E

Result = Union[Ok[T], Err[E]]

# Usage
def parse_config(path: str) -> Result[Config, str]:
    if not os.path.exists(path):
        return Err(f"Config file not found: {path}")
    try:
        config = load_config(path)
        return Ok(config)
    except Exception as e:
        return Err(f"Failed to parse config: {e}")
```

---

## Input Validation

### Validate Early

```python
# ✅ Good: Validate at entry point
def create_user(data: dict) -> User:
    # Validate all input first
    errors = []

    if not data.get('email'):
        errors.append("Email is required")
    elif not is_valid_email(data['email']):
        errors.append("Invalid email format")

    if not data.get('password'):
        errors.append("Password is required")
    elif len(data['password']) < 8:
        errors.append("Password must be at least 8 characters")

    if errors:
        raise ValidationError("Invalid input", details={"errors": errors})

    # Now safe to proceed
    return User.create(email=data['email'], password=data['password'])
```

### Validation Error Format

Provide actionable error messages:

```json
{
  "error": {
    "type": "ValidationError",
    "message": "Invalid input provided",
    "details": {
      "fields": {
        "email": "Invalid email format",
        "password": "Must be at least 8 characters",
        "age": "Must be a positive integer"
      }
    }
  }
}
```

---

## External Service Errors

### Retry with Exponential Backoff

```python
import time
import random

def retry_with_backoff(
    func,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exceptions: tuple = (Exception,)
):
    """Retry function with exponential backoff."""
    for attempt in range(max_retries):
        try:
            return func()
        except exceptions as e:
            if attempt == max_retries - 1:
                raise

            delay = min(base_delay * (2 ** attempt), max_delay)
            jitter = random.uniform(0, delay * 0.1)
            time.sleep(delay + jitter)

            logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay:.1f}s")
```

### Circuit Breaker Pattern

```python
class CircuitBreaker:
    """Prevent cascading failures to external services."""

    def __init__(self, failure_threshold: int = 5, reset_timeout: float = 60):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.failures = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open

    def call(self, func):
        if self.state == "open":
            if time.time() - self.last_failure_time > self.reset_timeout:
                self.state = "half-open"
            else:
                raise ExternalServiceError("Circuit breaker is open")

        try:
            result = func()
            if self.state == "half-open":
                self.state = "closed"
                self.failures = 0
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure_time = time.time()
            if self.failures >= self.failure_threshold:
                self.state = "open"
            raise
```

### Fallback Strategies

```python
def get_user_preferences(user_id: str) -> dict:
    """Get preferences with fallback to defaults."""
    try:
        return preferences_service.get(user_id)
    except ExternalServiceError:
        logger.warning(f"Preferences service unavailable, using defaults for {user_id}")
        return DEFAULT_PREFERENCES
    except NotFoundError:
        return DEFAULT_PREFERENCES
```

---

## Error Responses

### HTTP API Errors

| HTTP Status               | When to Use                     | Example                  |
| ------------------------- | ------------------------------- | ------------------------ |
| 400 Bad Request           | Invalid input                   | Validation errors        |
| 401 Unauthorized          | Not authenticated               | Missing/invalid token    |
| 403 Forbidden             | Not authorized                  | Insufficient permissions |
| 404 Not Found             | Resource doesn't exist          | Unknown ID               |
| 409 Conflict              | State conflict                  | Duplicate entry          |
| 422 Unprocessable         | Valid syntax, invalid semantics | Business rule violation  |
| 429 Too Many Requests     | Rate limited                    | Throttled                |
| 500 Internal Server Error | Unexpected server error         | Bug, unhandled exception |
| 502 Bad Gateway           | Upstream service error          | External API failed      |
| 503 Service Unavailable   | Temporarily unavailable         | Maintenance, overload    |

### Error Response Format

```json
{
  "error": {
    "type": "ValidationError",
    "code": "INVALID_INPUT",
    "message": "The request contains invalid data",
    "details": {
      "fields": {
        "email": "Invalid email format"
      }
    },
    "request_id": "req_abc123",
    "documentation_url": "https://api.example.com/errors/INVALID_INPUT"
  }
}
```

### User-Facing Error Messages

**DO:**

- Be clear and specific
- Suggest corrective action
- Be respectful and helpful

**DON'T:**

- Expose technical details
- Blame the user
- Use jargon

```python
# ❌ Bad user messages
"NullPointerException in UserService.java:142"
"Error: ECONNREFUSED"
"You did something wrong"

# ✅ Good user messages
"Please enter a valid email address"
"We're having trouble connecting. Please try again in a moment."
"The file you uploaded is too large. Maximum size is 10MB."
```

---

## Logging Errors

### What to Log

| Level    | When                   | Example                              |
| -------- | ---------------------- | ------------------------------------ |
| DEBUG    | Detailed diagnostic    | Variable values, flow tracking       |
| INFO     | Normal operations      | Request received, operation complete |
| WARNING  | Unexpected but handled | Retry attempt, deprecated usage      |
| ERROR    | Operation failed       | Exception caught, request failed     |
| CRITICAL | System failure         | Database down, data corruption       |

### Structured Logging

```python
import logging
import json

class StructuredLogger:
    def error(self, message: str, **context):
        log_entry = {
            "level": "ERROR",
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            **context
        }
        logging.error(json.dumps(log_entry))

# Usage
logger.error(
    "Failed to process payment",
    user_id=user.id,
    order_id=order.id,
    error_type="PaymentDeclined",
    error_code="INSUFFICIENT_FUNDS",
    # Never log sensitive data
    # card_number=card.number  ❌
)
```

### Log Context

Always include:

- Timestamp
- Request/correlation ID
- User ID (if applicable)
- Operation being performed
- Error type and message

Never include:

- Passwords
- API keys
- Credit card numbers
- Personal data beyond IDs

---

## Exception Handling Patterns

### Catch Specific Exceptions

```python
# ❌ Bad: Catch everything
try:
    process_data(data)
except Exception:
    pass  # Silently swallow all errors

# ✅ Good: Catch specific exceptions
try:
    process_data(data)
except ValidationError as e:
    logger.warning(f"Invalid data: {e}")
    return error_response(400, str(e))
except DatabaseError as e:
    logger.error(f"Database error: {e}")
    return error_response(500, "Internal error")
```

### Don't Catch and Ignore

```python
# ❌ Bad: Silent failure
try:
    send_email(user)
except:
    pass

# ✅ Good: Log and handle appropriately
try:
    send_email(user)
except EmailServiceError as e:
    logger.error(f"Failed to send email to {user.id}: {e}")
    queue_for_retry(email_task)
```

### Clean Up Resources

```python
# ✅ Use context managers
with open(filename) as f:
    data = f.read()  # File closed even if exception

# ✅ Use finally for cleanup
connection = None
try:
    connection = create_connection()
    result = connection.execute(query)
except DatabaseError:
    logger.error("Query failed")
    raise
finally:
    if connection:
        connection.close()
```

### Re-raise with Context

```python
try:
    config = load_config(path)
except FileNotFoundError as e:
    raise ConfigurationError(f"Config file not found: {path}") from e
except json.JSONDecodeError as e:
    raise ConfigurationError(f"Invalid JSON in config file: {path}") from e
```

---

## Error Testing

### Test Error Cases

```python
def test_create_user_invalid_email():
    """Should reject invalid email format."""
    with pytest.raises(ValidationError) as exc:
        create_user({"email": "invalid", "password": "secure123"})

    assert "email" in exc.value.details["fields"]

def test_external_service_retry():
    """Should retry on transient failures."""
    mock_service.side_effect = [TimeoutError(), TimeoutError(), {"data": "success"}]

    result = fetch_with_retry()

    assert result == {"data": "success"}
    assert mock_service.call_count == 3

def test_circuit_breaker_opens():
    """Should open circuit after threshold failures."""
    breaker = CircuitBreaker(failure_threshold=3)

    for _ in range(3):
        with pytest.raises(ServiceError):
            breaker.call(failing_function)

    with pytest.raises(ExternalServiceError, match="Circuit breaker is open"):
        breaker.call(any_function)
```

---

## Checklist

### For Every Function

- [ ] What errors can occur?
- [ ] How should each error be handled?
- [ ] What should be logged?
- [ ] What should the caller receive?

### For External Calls

- [ ] What if it times out?
- [ ] What if it returns an error?
- [ ] Should we retry?
- [ ] Is there a fallback?

### For User-Facing Operations

- [ ] Is the error message helpful?
- [ ] Does it expose sensitive information?
- [ ] Can the user take corrective action?
- [ ] Is the error logged for debugging?

---

_See [security.md](security.md) for secure error handling._
_See [testing.md](testing.md) for testing error cases._
