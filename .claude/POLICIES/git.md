# Git Workflow Policy

Standards for version control, branching, and collaboration.

---

## Core Principle

**Git history should be clean, meaningful, and useful for understanding project evolution.**

---

## Branch Strategy

### Branch Types

| Branch       | Purpose               | Naming                        | Lifetime            |
| ------------ | --------------------- | ----------------------------- | ------------------- |
| `main`       | Production-ready code | `main`                        | Permanent           |
| `develop`    | Integration branch    | `develop`                     | Permanent (if used) |
| `feature/*`  | New features          | `feature/short-description`   | Until merged        |
| `bugfix/*`   | Bug fixes             | `bugfix/issue-or-description` | Until merged        |
| `hotfix/*`   | Production fixes      | `hotfix/critical-issue`       | Until merged        |
| `release/*`  | Release preparation   | `release/vX.Y.Z`              | Until released      |
| `refactor/*` | Code restructuring    | `refactor/what-refactored`    | Until merged        |

### Branch Naming Conventions

```
✅ Good branch names:
feature/user-authentication
bugfix/login-validation-error
hotfix/security-patch-cve-2024
refactor/database-layer
release/v2.1.0

❌ Bad branch names:
feature/my-feature
fix
test-branch
john-working
Feature/UserAuthentication  (case matters in some systems)
```

### Branch Rules

| Rule               | Main     | Develop | Feature          |
| ------------------ | -------- | ------- | ---------------- |
| Direct commits     | ❌ No    | ❌ No   | ✅ Yes           |
| Force push         | ❌ Never | ❌ No   | ⚠️ Before review |
| Delete after merge | N/A      | N/A     | ✅ Yes           |
| Requires review    | ✅ Yes   | ✅ Yes  | Optional         |
| CI must pass       | ✅ Yes   | ✅ Yes  | ✅ Yes           |

---

## Commit Standards

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Components:**

| Part    | Required | Description                         |
| ------- | -------- | ----------------------------------- |
| type    | Yes      | Category of change                  |
| scope   | No       | Component affected                  |
| subject | Yes      | Brief description (imperative mood) |
| body    | No       | Detailed explanation                |
| footer  | No       | References, breaking changes        |

### Commit Types

| Type       | Description                 | Example                          |
| ---------- | --------------------------- | -------------------------------- |
| `feat`     | New feature                 | `feat(auth): add OAuth2 login`   |
| `fix`      | Bug fix                     | `fix(api): handle null response` |
| `docs`     | Documentation only          | `docs: update API reference`     |
| `style`    | Formatting, no logic change | `style: fix indentation`         |
| `refactor` | Code change, no feature/fix | `refactor: extract validation`   |
| `test`     | Adding/updating tests       | `test: add login edge cases`     |
| `chore`    | Maintenance tasks           | `chore: update dependencies`     |
| `perf`     | Performance improvement     | `perf: optimize query`           |
| `ci`       | CI/CD changes               | `ci: add coverage report`        |
| `build`    | Build system changes        | `build: update webpack config`   |
| `revert`   | Revert previous commit      | `revert: feat(auth): add OAuth2` |

### Commit Message Examples

```
feat(auth): implement two-factor authentication

Add TOTP-based 2FA for enhanced account security.
- Generate and store encrypted secrets
- Verify codes during login
- Add backup codes for recovery

Closes #123
```

```
fix(api): prevent race condition in session handler

Multiple concurrent requests could corrupt session data
due to unsynchronized access. Added mutex lock around
session read/write operations.

Fixes #456
```

```
refactor(db): migrate from raw SQL to ORM

Replace direct SQL queries with SQLAlchemy ORM for:
- Better type safety
- Automatic connection pooling
- Easier testing with mocks

BREAKING CHANGE: Database access layer API changed.
See migration guide in docs/migrations/v3.md
```

### Commit Best Practices

**DO:**

- Write in imperative mood ("Add feature" not "Added feature")
- Keep subject line under 50 characters
- Wrap body at 72 characters
- Explain "what" and "why", not "how"
- Reference issues/tasks
- Make atomic commits (one logical change)

**DON'T:**

- Commit generated files (unless intentional)
- Mix unrelated changes
- Write vague messages ("fix", "update", "WIP")
- Include sensitive data
- Leave merge conflict markers

---

## Workflow Patterns

### Feature Development

```bash
# 1. Start from up-to-date main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/user-profile

# 3. Work on feature (multiple commits OK)
git add .
git commit -m "feat(profile): add avatar upload"

# 4. Keep branch updated (if long-lived)
git fetch origin
git rebase origin/main

# 5. Push for review
git push origin feature/user-profile

# 6. After approval, merge via PR/MR
# (squash or merge commit per team preference)

# 7. Delete branch after merge
git branch -d feature/user-profile
```

### Bug Fix

```bash
# 1. Create branch from main
git checkout main
git pull origin main
git checkout -b bugfix/login-error

# 2. Fix and commit
git add .
git commit -m "fix(auth): handle expired tokens gracefully

Tokens expired mid-session caused 500 error.
Now redirects to login with message.

Fixes #789"

# 3. Push and create PR
git push origin bugfix/login-error
```

### Hotfix (Production Emergency)

```bash
# 1. Branch from main (production)
git checkout main
git pull origin main
git checkout -b hotfix/security-patch

# 2. Minimal fix only
git add .
git commit -m "fix(security): patch XSS vulnerability

Escape user input in comment display.
CVE-2024-XXXXX

Fixes #URGENT"

# 3. Expedited review and merge
git push origin hotfix/security-patch

# 4. Tag release
git tag -a v1.2.1 -m "Security patch"
git push origin v1.2.1

# 5. Backport to develop if using git-flow
git checkout develop
git merge hotfix/security-patch
```

---

## Merge Strategies

### When to Use Each Strategy

| Strategy     | When to Use                       | Result                             |
| ------------ | --------------------------------- | ---------------------------------- |
| Merge commit | Preserving feature history        | Merge commit + all feature commits |
| Squash merge | Clean history, many small commits | Single commit with all changes     |
| Rebase       | Linear history, clean commits     | Feature commits on top of main     |

### Team Defaults (Choose One)

**Option A: Squash Merge (Recommended for most)**

- Clean main branch history
- One commit per feature/fix
- Detailed PR description becomes commit body

**Option B: Rebase + Merge**

- Linear history
- Each meaningful commit preserved
- Requires clean commit discipline

**Option C: Merge Commits**

- Full history preserved
- Clear feature boundaries
- Can be noisy

---

## Pull Request Guidelines

### PR Template

```markdown
## Summary

[Brief description of changes]

## Type of Change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)

## Changes Made

- [Change 1]
- [Change 2]

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings introduced

## Related

- Task: [Reference]
- Plan: [Link to plan document]

## Screenshots (if applicable)

[Add screenshots for UI changes]
```

### PR Size Guidelines

| Size   | Lines Changed | Review Time   | Recommendation        |
| ------ | ------------- | ------------- | --------------------- |
| Small  | < 100         | 15 min        | ✅ Ideal              |
| Medium | 100-400       | 30 min        | ✅ Acceptable         |
| Large  | 400-1000      | 1+ hour       | ⚠️ Consider splitting |
| XL     | 1000+         | Several hours | ❌ Split required     |

### Handling Large Changes

If change is necessarily large:

1. Add detailed PR description
2. Organize commits logically
3. Add inline comments explaining complex parts
4. Offer to walk reviewer through changes
5. Consider stacked PRs for independent parts

---

## Git Configuration

### Recommended Settings

```bash
# User identification
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Default branch
git config --global init.defaultBranch main

# Better diff
git config --global diff.algorithm histogram

# Autostash on rebase
git config --global rebase.autoStash true

# Prune on fetch
git config --global fetch.prune true

# Better merge conflict style
git config --global merge.conflictStyle diff3
```

### Useful Aliases

```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.last 'log -1 HEAD'
git config --global alias.unstage 'reset HEAD --'
git config --global alias.visual '!gitk'
git config --global alias.graph 'log --oneline --graph --all'
```

---

## .gitignore Guidelines

### Always Ignore

```gitignore
# Dependencies
node_modules/
vendor/
venv/
__pycache__/

# Build outputs
dist/
build/
*.egg-info/

# IDE/Editor
.idea/
.vscode/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Environment
.env
.env.local
*.local

# Logs
*.log
logs/

# Secrets (extra safety)
*.pem
*.key
secrets/
```

### Project-Specific

Add in PROJECT.md or project's .gitignore:

```gitignore
# Project-specific ignores
[specific patterns]
```

---

## Recovery Procedures

### Undo Last Commit (Not Pushed)

```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Discard changes too
git reset --hard HEAD~1
```

### Undo Pushed Commit

```bash
# Create reverting commit (safe)
git revert HEAD
git push

# Force rewrite (dangerous, coordinate with team)
git reset --hard HEAD~1
git push --force-with-lease
```

### Recover Deleted Branch

```bash
# Find the commit
git reflog

# Recreate branch
git checkout -b recovered-branch <commit-hash>
```

### Resolve Merge Conflicts

```bash
# 1. See conflicted files
git status

# 2. Edit files, resolve conflicts
# Remove <<<<<<, =======, >>>>>> markers

# 3. Mark as resolved
git add <resolved-files>

# 4. Complete merge
git commit
```

---

## Claude's Git Responsibilities

**Before commits:**

- Verify changes match task requirements
- Ensure tests pass
- Check for secrets or sensitive data
- Write clear commit messages

**During work:**

- Make atomic, logical commits
- Keep commits focused
- Update documentation with code

**After approval:**

- Push only after user confirmation
- Clean up branches after merge
- Update task documentation

---

_See [../WORKFLOW.md](../WORKFLOW.md) for how git integrates with development workflow._
_See [code-review.md](code-review.md) for PR review process._
