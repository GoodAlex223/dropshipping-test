# Python Standards

Python-specific coding standards and best practices.

**Applies to**: Python 3.9+
**Last Updated**: YYYY-MM-DD

---

## Code Style

### Formatting

**Use Black for formatting**:

```bash
black --line-length 88 .
```

**Configuration** (pyproject.toml):

```toml
[tool.black]
line-length = 88
target-version = ['py39', 'py310', 'py311']
```

### Linting

**Use Ruff** (recommended) or flake8:

```bash
ruff check .
```

**Configuration** (pyproject.toml):

```toml
[tool.ruff]
line-length = 88
select = ["E", "F", "W", "I", "N", "UP", "B", "C4"]
ignore = ["E501"]  # Line length handled by Black

[tool.ruff.isort]
known-first-party = ["my_package"]
```

### Import Order

```python
# 1. Standard library
import os
import sys
from collections import defaultdict
from typing import Dict, List, Optional

# 2. Third-party packages
import requests
from pydantic import BaseModel

# 3. Local application
from my_package.utils import helper
from my_package.models import User
```

---

## Naming Conventions

| Element        | Convention           | Example              |
| -------------- | -------------------- | -------------------- |
| Modules        | snake_case           | `user_service.py`    |
| Packages       | snake_case           | `my_package/`        |
| Classes        | PascalCase           | `UserService`        |
| Functions      | snake_case           | `get_user_by_id`     |
| Variables      | snake_case           | `user_count`         |
| Constants      | UPPER_SNAKE          | `MAX_RETRIES`        |
| Private        | \_leading_underscore | `_internal_method`   |
| Type variables | PascalCase + T       | `UserT`, `ResponseT` |

### Naming Guidelines

```python
# ✅ Good names
user_repository = UserRepository()
is_valid = validate_input(data)
MAX_RETRY_ATTEMPTS = 3

# ❌ Bad names
ur = UserRepository()  # Too short
isvalid = validate_input(data)  # Missing underscore
maxRetryAttempts = 3  # Wrong convention
```

---

## Type Hints

### Always Use Type Hints

```python
from typing import Dict, List, Optional, Union
from collections.abc import Sequence

def get_user(user_id: int) -> Optional[User]:
    """Fetch user by ID."""
    ...

def process_items(items: Sequence[str]) -> Dict[str, int]:
    """Process items and return counts."""
    ...
```

### Modern Type Hint Syntax (3.10+)

```python
# Python 3.10+
def get_user(user_id: int) -> User | None:
    ...

def process(data: list[str]) -> dict[str, int]:
    ...
```

### Type Checking

**Use mypy**:

```bash
mypy --strict src/
```

**Configuration** (pyproject.toml):

```toml
[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_ignores = true
disallow_untyped_defs = true

[[tool.mypy.overrides]]
module = ["third_party.*"]
ignore_missing_imports = true
```

---

## Project Structure

### Standard Layout

```
project/
├── pyproject.toml      # Project configuration
├── README.md
├── src/
│   └── my_package/
│       ├── __init__.py
│       ├── __main__.py  # Entry point
│       ├── models/
│       │   ├── __init__.py
│       │   └── user.py
│       ├── services/
│       │   ├── __init__.py
│       │   └── user_service.py
│       └── utils/
│           ├── __init__.py
│           └── helpers.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py     # pytest fixtures
│   ├── unit/
│   │   └── test_user.py
│   └── integration/
│       └── test_api.py
└── docs/
```

### `__init__.py` Guidelines

```python
# Expose public API
from my_package.models.user import User
from my_package.services.user_service import UserService

__all__ = ["User", "UserService"]
__version__ = "1.0.0"
```

---

## Dependencies

### Use pyproject.toml

```toml
[project]
name = "my-package"
version = "1.0.0"
requires-python = ">=3.9"
dependencies = [
    "requests>=2.28.0,<3.0.0",
    "pydantic>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-cov>=4.0.0",
    "mypy>=1.0.0",
    "ruff>=0.1.0",
    "black>=23.0.0",
]
```

### Version Pinning

| Dependency Type   | Strategy          | Example             |
| ----------------- | ----------------- | ------------------- |
| Core dependencies | Constrained range | `>=2.0.0,<3.0.0`    |
| Dev dependencies  | Minimum version   | `>=7.0.0`           |
| Lock file         | Exact versions    | `requirements.lock` |

---

## Error Handling

### Custom Exceptions

```python
class AppError(Exception):
    """Base application error."""

    def __init__(self, message: str, code: str | None = None):
        super().__init__(message)
        self.code = code


class ValidationError(AppError):
    """Invalid input data."""
    pass


class NotFoundError(AppError):
    """Resource not found."""
    pass
```

### Exception Handling

```python
# ✅ Catch specific exceptions
try:
    user = get_user(user_id)
except NotFoundError:
    logger.warning(f"User {user_id} not found")
    return None
except DatabaseError as e:
    logger.error(f"Database error: {e}")
    raise

# ❌ Don't catch everything
try:
    user = get_user(user_id)
except Exception:  # Too broad
    pass  # Silent failure
```

---

## Testing

### pytest Configuration

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_functions = ["test_*"]
addopts = "-v --cov=src --cov-report=term-missing"
markers = [
    "slow: marks tests as slow",
    "integration: marks integration tests",
]
```

### Test Structure

```python
import pytest
from my_package.services import UserService


class TestUserService:
    """Tests for UserService."""

    @pytest.fixture
    def service(self) -> UserService:
        """Create service instance."""
        return UserService()

    def test_get_user_returns_user(self, service: UserService) -> None:
        """Should return user when found."""
        # Arrange
        user_id = 123

        # Act
        result = service.get_user(user_id)

        # Assert
        assert result is not None
        assert result.id == user_id

    def test_get_user_not_found_returns_none(self, service: UserService) -> None:
        """Should return None when user not found."""
        result = service.get_user(999)
        assert result is None
```

### Fixtures

```python
# conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session


@pytest.fixture(scope="session")
def engine():
    """Create test database engine."""
    return create_engine("sqlite:///:memory:")


@pytest.fixture
def db_session(engine) -> Session:
    """Create database session for each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()
```

---

## Documentation

### Docstring Format (Google Style)

```python
def calculate_score(
    items: list[Item],
    weights: dict[str, float],
    normalize: bool = True,
) -> float:
    """Calculate weighted score for items.

    Computes a weighted sum of item values, optionally normalized
    to the range [0, 1].

    Args:
        items: List of items to score.
        weights: Mapping of item types to weight values.
        normalize: Whether to normalize the final score.

    Returns:
        The calculated score, between 0 and 1 if normalized.

    Raises:
        ValueError: If items list is empty.
        KeyError: If item type not found in weights.

    Examples:
        >>> items = [Item("a", 10), Item("b", 20)]
        >>> weights = {"a": 0.5, "b": 0.5}
        >>> calculate_score(items, weights)
        0.75
    """
```

### Module Docstrings

```python
"""User management module.

This module provides user-related functionality including:
- User creation and validation
- Authentication and authorization
- Profile management

Example:
    from my_package.users import UserService

    service = UserService()
    user = service.create_user(email="user@example.com")
"""
```

---

## Common Patterns

### Context Managers

```python
from contextlib import contextmanager
from typing import Generator

@contextmanager
def database_transaction() -> Generator[Session, None, None]:
    """Provide a transactional scope."""
    session = Session()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
```

### Data Classes

```python
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class User:
    id: int
    email: str
    name: str
    created_at: datetime = field(default_factory=datetime.utcnow)

    def __post_init__(self) -> None:
        if not self.email:
            raise ValueError("Email is required")
```

### Pydantic Models

```python
from pydantic import BaseModel, Field, EmailStr


class UserCreate(BaseModel):
    """User creation request."""

    email: EmailStr
    name: str = Field(min_length=1, max_length=100)

    model_config = {"strict": True}


class UserResponse(BaseModel):
    """User response."""

    id: int
    email: str
    name: str

    model_config = {"from_attributes": True}
```

---

## Anti-Patterns to Avoid

| Anti-Pattern                  | Problem            | Better Approach           |
| ----------------------------- | ------------------ | ------------------------- |
| `from module import *`        | Pollutes namespace | Import specific names     |
| Mutable default args          | Shared state bugs  | Use `None` default        |
| Bare `except:`                | Catches everything | Catch specific exceptions |
| Global variables              | Hard to test       | Dependency injection      |
| String concatenation in loops | O(n²)              | Use `join()`              |
| `type()` for type checking    | Misses inheritance | Use `isinstance()`        |

### Examples

```python
# ❌ Mutable default argument
def add_item(item, items=[]):
    items.append(item)
    return items

# ✅ Use None default
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

---

## Tools Summary

| Tool      | Purpose       | Command           |
| --------- | ------------- | ----------------- |
| Black     | Formatting    | `black .`         |
| Ruff      | Linting       | `ruff check .`    |
| mypy      | Type checking | `mypy --strict .` |
| pytest    | Testing       | `pytest`          |
| pip-audit | Security      | `pip-audit`       |

### Pre-commit Configuration

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.9
    hooks:
      - id: ruff

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies: [pydantic]
```

---

_See [../POLICIES/testing.md](../POLICIES/testing.md) for general testing policy._
_See [../POLICIES/error-handling.md](../POLICIES/error-handling.md) for error handling patterns._
