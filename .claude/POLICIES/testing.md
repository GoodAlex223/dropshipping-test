# Testing Policy

Standards for test coverage, TDD workflow, and quality gates.

---

## Test-Driven Development (TDD)

### Mandatory Sequence

```
1. Write test → 2. See it fail → 3. Implement → 4. See it pass → 5. Refactor
```

**Never skip steps 1-2.** Writing tests after implementation misses design benefits.

### TDD Workflow

```python
# Step 1: Write test first
def test_filter_items_by_category_returns_matching():
    items = [Item(category="A"), Item(category="B")]
    result = filter_items_by_category(items, "A")
    assert len(result) == 1
    assert result[0].category == "A"

# Step 2: Run test — should FAIL (function doesn't exist)
# Step 3: Implement minimal code to pass
def filter_items_by_category(items, category):
    return [i for i in items if i.category == category]

# Step 4: Run test — should PASS
# Step 5: Refactor if needed (add types, optimize, etc.)
```

---

## Coverage Requirements

| Code Type         | Minimum Coverage |
| ----------------- | ---------------- |
| New features      | 80%              |
| Bug fixes         | 100% of fix path |
| Critical paths    | 90%              |
| Utility functions | 70%              |

### What Must Be Tested

- [ ] All public methods/functions
- [ ] All critical code paths
- [ ] Error handling (exceptions, edge cases)
- [ ] Boundary conditions
- [ ] Integration points

### What May Be Skipped

- Trivial getters/setters
- Generated code
- Third-party library wrappers (test integration instead)
- Configuration constants

---

## Test Types

### Unit Tests

Test individual functions/methods in isolation.

```python
def test_calculate_score_with_empty_input():
    """Unit test: isolated function behavior."""
    result = calculate_score(items=[], weights={})
    assert result == 0.0
```

### Integration Tests

Test component interactions.

```python
def test_session_persists_across_handlers():
    """Integration: session + handler interaction."""
    session = create_session(user_id=123)
    handle_action(session, item_id=456)

    # Verify session state updated
    assert 456 in session.processed_items
```

### Regression Tests

Prevent fixed bugs from recurring.

```python
def test_input_with_spaces_does_not_crash():
    """Regression: Issue #42 - spaces in input caused crash."""
    # This exact case caused the bug
    inputs = ["item with spaces", "another item"]
    result = process_inputs(inputs)  # Should not raise
    assert len(result) == 2
```

---

## Test Structure

### File Organization

```
tests/
├── unit/
│   ├── test_core.py
│   ├── test_utils.py
│   └── test_models.py
├── integration/
│   ├── test_database.py
│   └── test_api.py
└── regression/
    └── test_known_bugs.py
```

### Test Naming

```python
def test_[unit]_[scenario]_[expected_outcome]():
    """
    Docstring explaining:
    - What is being tested
    - Why this case matters
    - Reference to related issue/requirement
    """
```

Examples:

- `test_filter_items_empty_list_returns_empty`
- `test_calculate_score_negative_weights_handled`
- `test_session_timeout_clears_state`

### Test Body: AAA Pattern

```python
def test_something():
    # Arrange: Set up test data and conditions
    user = User(id=1, preferences={"item1": 0.5})
    items = [Item(id="item1", category="A")]

    # Act: Execute the code under test
    result = recommend_items(user, items)

    # Assert: Verify expected outcome
    assert len(result) == 1
    assert result[0].score > 0
```

---

## Edge Cases Checklist

For every function, consider:

| Category           | Examples                        |
| ------------------ | ------------------------------- |
| Empty input        | `[]`, `""`, `None`, `{}`        |
| Single element     | List with 1 item                |
| Boundary values    | 0, -1, MAX_INT, MIN_INT         |
| Invalid types      | String where int expected       |
| Unicode            | Emojis, RTL text, special chars |
| Concurrent access  | Race conditions                 |
| Resource limits    | Very large inputs               |
| **Null/undefined** | Missing optional fields         |
| **Invalid state**  | Corrupted or inconsistent data  |

---

## Running Tests

### General Commands

```bash
# All tests (adjust for your framework)
pytest                    # Python
npm test                  # JavaScript/Node
cargo test                # Rust

# Specific file
pytest tests/test_core.py

# Specific test
pytest tests/test_core.py::test_specific_function

# With coverage
pytest --cov=src --cov-report=html

# Verbose output
pytest -v

# Stop on first failure
pytest -x
```

### Pre-commit Integration

Tests should run automatically via pre-commit hooks. If tests fail, commit should be blocked.

---

## Mocking Guidelines

### When to Mock

- External APIs (network calls)
- Database for unit tests
- Time-dependent functions
- Random number generators
- File system operations
- **Third-party services**

### When NOT to Mock

- Core business logic
- Data transformations
- Utility functions
- **Integration tests (by definition)**

### Mock Example

```python
from unittest.mock import Mock, patch

def test_api_request_handles_timeout():
    with patch('module.requests.get') as mock_get:
        mock_get.side_effect = TimeoutError()

        result = fetch_data(endpoint="test")

        assert result == []  # Graceful handling
```

---

## Quality Gates

### Before Commit

- [ ] All existing tests pass
- [ ] New tests written for new code
- [ ] Coverage meets minimum threshold
- [ ] No skipped tests without `@skip(reason="...")`

### Before Push

- [ ] Full test suite passes
- [ ] Integration tests pass
- [ ] Manual testing checklist completed

### Before Merge

- [ ] All CI checks pass
- [ ] Code review completed
- [ ] No regressions detected

---

## Debugging Failed Tests

### Process

1. **Read the error message** — Often contains the answer
2. **Check test assumptions** — Is test setup correct?
3. **Isolate the failure** — Run single test with `-v`
4. **Add debugging output** — Use appropriate debugging tools
5. **Check recent changes** — `git diff` against working state

### Common Issues

| Symptom                           | Likely Cause                          |
| --------------------------------- | ------------------------------------- |
| Test passes alone, fails in suite | Shared state pollution                |
| Flaky test                        | Race condition or time dependency     |
| Import error                      | Missing dependency or circular import |
| Assertion error on equal objects  | `__eq__` not implemented              |
| **Works locally, fails in CI**    | Environment difference                |
| **Timeout**                       | Infinite loop or missing mock         |

---

## Test Documentation

### When to Document Tests

- Non-obvious test scenarios
- Tests for edge cases
- Regression tests (always reference the issue)
- Tests with complex setup

### Documentation Format

```python
def test_complex_scenario():
    """
    Test that [specific behavior] works when [condition].

    This test covers the case where:
    - [Condition 1]
    - [Condition 2]

    Related to: Issue #123, TODO.md 4.2.1

    Setup:
    - [Describe any non-obvious setup]
    """
```

---

## Continuous Improvement

After each testing session, consider:

- [ ] Are there untested edge cases discovered?
- [ ] Should any manual tests be automated?
- [ ] Is test coverage adequate for critical paths?
- [ ] Are tests maintainable and readable?
- [ ] Should test utilities be extracted?

Document findings in the task's plan file under "Testing Insights".

---

_See [../WORKFLOW.md](../WORKFLOW.md) for how testing integrates with development phases._
_See [documentation.md](documentation.md) for documenting test-related decisions._
