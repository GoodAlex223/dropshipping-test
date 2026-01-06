# Versioning Policy

Standards for version numbering, releases, and changelog management.

---

## Core Principle

**Version numbers communicate the nature of changes to users and systems.**

---

## Semantic Versioning (SemVer)

### Format

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

Examples:
1.0.0
2.1.3
1.0.0-alpha.1
1.0.0-beta.2+build.123
```

### Version Components

| Component | When to Increment                  | Example Change                                   |
| --------- | ---------------------------------- | ------------------------------------------------ |
| **MAJOR** | Breaking changes                   | API change, removed feature, incompatible schema |
| **MINOR** | New features (backward compatible) | New endpoint, new optional parameter             |
| **PATCH** | Bug fixes (backward compatible)    | Fix bug, security patch, docs fix                |

### Pre-release Versions

| Stage | Format          | When to Use                      |
| ----- | --------------- | -------------------------------- |
| Alpha | `1.0.0-alpha.1` | Early development, incomplete    |
| Beta  | `1.0.0-beta.1`  | Feature complete, testing        |
| RC    | `1.0.0-rc.1`    | Release candidate, final testing |

### Version Precedence

```
1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-beta < 1.0.0-beta.2 < 1.0.0-rc.1 < 1.0.0
```

---

## What Constitutes a Breaking Change

### Definitely Breaking

- Removing a public API endpoint/method
- Changing required parameters
- Changing return type
- Changing database schema (without migration)
- Changing configuration format
- Removing CLI options
- Changing default behavior significantly

### Not Breaking

- Adding new optional parameters
- Adding new endpoints/methods
- Adding new fields to responses
- Deprecating (but not removing) features
- Performance improvements
- Bug fixes (unless relied upon)
- Internal refactoring

### Gray Areas (Document Clearly)

- Fixing bugs that some users depend on
- Changing error messages/codes
- Changing timing/ordering (when not documented)
- Updating dependencies

---

## Version Locations

### Where to Update Version

| File             | Format                  | Purpose          |
| ---------------- | ----------------------- | ---------------- |
| `package.json`   | `"version": "1.2.3"`    | Node.js projects |
| `pyproject.toml` | `version = "1.2.3"`     | Python projects  |
| `Cargo.toml`     | `version = "1.2.3"`     | Rust projects    |
| `VERSION`        | `1.2.3`                 | Plain text file  |
| `__version__.py` | `__version__ = "1.2.3"` | Python package   |
| `build.gradle`   | `version = '1.2.3'`     | Java/Gradle      |

### Single Source of Truth

Choose one location as source of truth, generate/sync others:

```python
# setup.py reading from __version__.py
from my_package import __version__
setup(version=__version__)
```

```bash
# Script to sync versions
VERSION=$(cat VERSION)
sed -i "s/version = .*/version = \"$VERSION\"/" pyproject.toml
```

---

## Changelog

### Changelog Format (Keep a Changelog)

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- New feature X (#123)

### Changed

- Improved performance of Y

### Deprecated

- Old API method Z (use W instead)

### Removed

- Removed legacy feature

### Fixed

- Bug in authentication flow (#456)

### Security

- Patched vulnerability CVE-2024-XXXXX

## [1.2.0] - 2025-01-15

### Added

- User profile customization
- Export to PDF feature

### Fixed

- Memory leak in session handler (#789)

## [1.1.0] - 2025-01-01

### Added

- Initial release

[Unreleased]: https://github.com/user/repo/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/user/repo/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/user/repo/releases/tag/v1.1.0
```

### Changelog Categories

| Category       | What Goes Here                    |
| -------------- | --------------------------------- |
| **Added**      | New features                      |
| **Changed**    | Changes to existing functionality |
| **Deprecated** | Features to be removed in future  |
| **Removed**    | Features removed in this release  |
| **Fixed**      | Bug fixes                         |
| **Security**   | Security fixes                    |

### Changelog Best Practices

**DO:**

- Write for humans (not machines)
- Include issue/PR references
- Group by category
- Date each release
- Link to full diff

**DON'T:**

- Include every commit
- Use commit messages verbatim
- Skip entries for "small" changes
- Forget to update before release

---

## Release Process

### Release Checklist

```markdown
## Release v1.2.0 Checklist

### Preparation

- [ ] All planned features complete
- [ ] All tests passing
- [ ] No critical bugs open
- [ ] Documentation updated

### Version Update

- [ ] Update version in source files
- [ ] Update CHANGELOG.md
- [ ] Review CHANGELOG for completeness
- [ ] Commit: "chore(release): prepare v1.2.0"

### Testing

- [ ] Full test suite passes
- [ ] Manual testing completed
- [ ] Staging deployment verified

### Release

- [ ] Create git tag: git tag -a v1.2.0 -m "Release v1.2.0"
- [ ] Push tag: git push origin v1.2.0
- [ ] Create GitHub/GitLab release
- [ ] Publish to package registry (if applicable)

### Post-Release

- [ ] Verify deployment
- [ ] Announce release (if applicable)
- [ ] Update documentation site
- [ ] Close milestone
```

### Git Tagging

```bash
# Create annotated tag
git tag -a v1.2.0 -m "Release v1.2.0"

# Push tag
git push origin v1.2.0

# List tags
git tag -l "v*"

# Delete tag (if needed)
git tag -d v1.2.0
git push origin :refs/tags/v1.2.0
```

### Release Naming

| Type                     | Tag Format      | Example         |
| ------------------------ | --------------- | --------------- |
| Standard release         | `v1.2.3`        | `v1.2.3`        |
| Pre-release              | `v1.2.3-beta.1` | `v2.0.0-beta.1` |
| Date-based (alternative) | `v2025.01.15`   | `v2025.01.15`   |

---

## API Versioning

### URL Path Versioning

```
https://api.example.com/v1/users
https://api.example.com/v2/users
```

**Pros:** Clear, easy to understand
**Cons:** URL changes between versions

### Header Versioning

```
GET /users
Accept: application/vnd.example.v1+json
```

**Pros:** Clean URLs
**Cons:** Less discoverable

### Query Parameter Versioning

```
https://api.example.com/users?version=1
```

**Pros:** Easy to test
**Cons:** Can be messy

### Recommended Approach

1. Use URL path versioning (`/v1/`, `/v2/`)
2. Maintain old versions for deprecation period
3. Document migration path between versions
4. Sunset old versions with clear timeline

---

## Deprecation Policy

### Deprecation Process

1. **Announce** deprecation in CHANGELOG
2. **Document** migration path
3. **Warn** at runtime (logs, console)
4. **Support** for defined period
5. **Remove** in next major version

### Deprecation Warning Example

```python
import warnings

def old_function():
    """Old function.

    .. deprecated:: 1.5.0
       Use :func:`new_function` instead.
    """
    warnings.warn(
        "old_function is deprecated, use new_function instead",
        DeprecationWarning,
        stacklevel=2
    )
    return new_function()
```

### Deprecation Timeline

| Severity         | Minimum Notice   |
| ---------------- | ---------------- |
| Minor feature    | 1 minor version  |
| Major feature    | 1 major version  |
| Security-related | May be immediate |

---

## Version Compatibility

### Dependency Constraints

```python
# Python (pyproject.toml)
[project]
dependencies = [
    "requests>=2.25.0,<3.0.0",  # Compatible with 2.x
    "pydantic>=2.0.0",          # 2.0 or higher
    "numpy~=1.24.0",            # 1.24.x only
]
```

```json
// Node.js (package.json)
{
  "dependencies": {
    "express": "^4.18.0", // Compatible with 4.x
    "lodash": "~4.17.21", // 4.17.x only
    "axios": ">=1.0.0" // 1.0 or higher
  }
}
```

### Version Constraint Symbols

| Symbol | Meaning                    | Example   | Matches             |
| ------ | -------------------------- | --------- | ------------------- |
| `^`    | Compatible (minor+patch)   | `^1.2.3`  | `1.2.3` to `<2.0.0` |
| `~`    | Approximately (patch only) | `~1.2.3`  | `1.2.3` to `<1.3.0` |
| `>=`   | Greater or equal           | `>=1.2.3` | `1.2.3` and above   |
| `<`    | Less than                  | `<2.0.0`  | Below `2.0.0`       |
| `*`    | Any version                | `*`       | All versions        |

---

## Version in Code

### Runtime Version Access

```python
# Python
from my_package import __version__
print(f"Running version {__version__}")
```

```typescript
// TypeScript/Node
import { version } from "./package.json";
console.log(`Running version ${version}`);
```

### Version in Logs/Responses

```python
# Include version in log output
logger.info(f"Application starting", extra={"version": __version__})

# Include version in API response headers
response.headers["X-API-Version"] = __version__
```

---

## Automated Versioning

### Conventional Commits → Version

Tools like `semantic-release` can determine version from commits:

```
feat: new feature     → MINOR bump
fix: bug fix          → PATCH bump
feat!: breaking       → MAJOR bump
BREAKING CHANGE:      → MAJOR bump
```

### Example Configuration

```json
// package.json for semantic-release
{
  "release": {
    "branches": ["main"],
    "plugins": [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      "@semantic-release/changelog",
      "@semantic-release/npm",
      "@semantic-release/git"
    ]
  }
}
```

---

## Checklist

### Before Release

- [ ] All planned changes complete
- [ ] Version number updated
- [ ] CHANGELOG updated
- [ ] Documentation updated
- [ ] Tests passing
- [ ] Breaking changes documented
- [ ] Migration guide (if breaking)

### During Release

- [ ] Git tag created
- [ ] Release notes published
- [ ] Package published (if applicable)
- [ ] Deployment successful

### After Release

- [ ] Verify deployment
- [ ] Update [Unreleased] section in CHANGELOG
- [ ] Communicate release to users
- [ ] Monitor for issues

---

_See [git.md](git.md) for tagging and branching._
_See [../WORKFLOW.md](../WORKFLOW.md) for release workflow._
