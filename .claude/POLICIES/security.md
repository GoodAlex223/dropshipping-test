# Security Policy

Security standards and practices for all code changes.

---

## Core Principle

**Security is not optional. Every change must consider security implications.**

---

## Security Classification

### Data Sensitivity Levels

| Level         | Description                      | Examples                          | Handling                            |
| ------------- | -------------------------------- | --------------------------------- | ----------------------------------- |
| **Critical**  | Exposure causes severe harm      | Passwords, API keys, payment data | Encrypt, never log, minimal access  |
| **Sensitive** | Exposure causes significant harm | PII, emails, phone numbers        | Encrypt at rest, mask in logs       |
| **Internal**  | Business-sensitive               | Analytics, internal metrics       | Access controls, no public exposure |
| **Public**    | No harm from exposure            | Marketing content, public docs    | Standard handling                   |

### Change Risk Assessment

Before implementing, assess security risk:

| Risk Factor                  | Low  | Medium           | High                    |
| ---------------------------- | ---- | ---------------- | ----------------------- |
| Handles user input           | No   | Indirect         | Direct                  |
| Accesses sensitive data      | No   | Read-only        | Read/Write              |
| Authentication/Authorization | None | Uses existing    | Modifies                |
| External communication       | None | Trusted services | User-provided endpoints |
| File system access           | None | Read-only        | Write                   |
| Executes commands            | None | Fixed commands   | Dynamic                 |

**High risk changes require security review before merge.**

---

## Secrets Management

### Never Commit Secrets

**Absolutely forbidden in code:**

- API keys
- Passwords
- Database credentials
- Encryption keys
- OAuth tokens
- Private certificates
- Connection strings with credentials

### How to Handle Secrets

```
✅ DO:
- Use environment variables
- Use secrets management service (Vault, AWS Secrets Manager, etc.)
- Use .env files (gitignored)
- Use configuration management

❌ DON'T:
- Hardcode in source files
- Commit to git (even in "test" branches)
- Log secrets
- Include in error messages
- Send in URLs (query parameters)
```

### If Secrets Are Accidentally Committed

1. **Immediately rotate** the exposed secret
2. **Remove from git history** (not just delete):
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch PATH_TO_FILE" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (coordinate with team)
4. **Audit** for any unauthorized access
5. **Document** the incident

### Secret Detection

Pre-commit hooks should scan for:

- High-entropy strings
- Known secret patterns (AWS keys, etc.)
- Common credential file names

---

## Input Validation

### Validate All External Input

**External input includes:**

- User form submissions
- API request parameters
- File uploads
- URL parameters
- Headers
- Cookies
- Database content (if populated externally)

### Validation Rules

```python
# ✅ Good: Whitelist validation
ALLOWED_TYPES = ["image/png", "image/jpeg"]
if file.content_type not in ALLOWED_TYPES:
    raise ValidationError("Invalid file type")

# ❌ Bad: Blacklist validation
FORBIDDEN_TYPES = ["application/x-executable"]
if file.content_type in FORBIDDEN_TYPES:  # Incomplete!
    raise ValidationError("Invalid file type")
```

### Common Validation Requirements

| Input Type | Validations                               |
| ---------- | ----------------------------------------- |
| Strings    | Length limits, allowed characters, format |
| Numbers    | Range, type (int/float), sign             |
| Emails     | Format, domain allowlist if applicable    |
| URLs       | Protocol (https only), domain allowlist   |
| Files      | Type, size, content validation            |
| IDs        | Format, existence, authorization          |

---

## Injection Prevention

### SQL Injection

```python
# ❌ NEVER: String concatenation
query = f"SELECT * FROM users WHERE id = {user_id}"

# ✅ ALWAYS: Parameterized queries
query = "SELECT * FROM users WHERE id = ?"
cursor.execute(query, (user_id,))

# ✅ ALWAYS: ORM methods
User.objects.filter(id=user_id)
```

### Command Injection

```python
# ❌ NEVER: Shell with user input
os.system(f"convert {user_filename} output.png")

# ✅ BETTER: Avoid shell entirely
subprocess.run(["convert", user_filename, "output.png"], shell=False)

# ✅ BEST: Validate and sanitize
if not re.match(r'^[\w\-\.]+$', user_filename):
    raise ValidationError("Invalid filename")
```

### XSS Prevention

```html
<!-- ❌ NEVER: Raw user content -->
<div>{{ user_content | safe }}</div>

<!-- ✅ ALWAYS: Escaped by default -->
<div>{{ user_content }}</div>

<!-- ✅ For HTML content: Sanitize first -->
<div>{{ user_content | sanitize_html }}</div>
```

### Path Traversal

```python
# ❌ NEVER: Direct path concatenation
file_path = os.path.join(BASE_DIR, user_input)

# ✅ ALWAYS: Validate and resolve
safe_path = os.path.realpath(os.path.join(BASE_DIR, user_input))
if not safe_path.startswith(os.path.realpath(BASE_DIR)):
    raise SecurityError("Path traversal attempt")
```

---

## Authentication & Authorization

### Authentication Requirements

- [ ] Passwords hashed with strong algorithm (bcrypt, argon2)
- [ ] Password requirements enforced
- [ ] Rate limiting on login attempts
- [ ] Session tokens are random and unpredictable
- [ ] Sessions expire appropriately
- [ ] Secure cookie flags set (HttpOnly, Secure, SameSite)

### Authorization Requirements

- [ ] Every endpoint checks authorization
- [ ] Authorization checked on server side (not just client)
- [ ] Principle of least privilege applied
- [ ] Resource access verified (user can access THIS resource)
- [ ] Admin functions properly protected

### Authorization Patterns

```python
# ❌ Bad: Only checks if logged in
@login_required
def view_document(request, doc_id):
    doc = Document.objects.get(id=doc_id)
    return render(request, 'doc.html', {'doc': doc})

# ✅ Good: Checks ownership/permission
@login_required
def view_document(request, doc_id):
    doc = Document.objects.get(id=doc_id)
    if not doc.can_view(request.user):
        raise PermissionDenied()
    return render(request, 'doc.html', {'doc': doc})
```

---

## Cryptography

### Use Standard Libraries

```
✅ DO: Use well-tested libraries
- Python: cryptography, bcrypt
- Node: crypto (built-in), bcrypt
- Go: crypto (standard library)

❌ DON'T:
- Implement your own crypto
- Use deprecated algorithms (MD5, SHA1 for security)
- Use ECB mode
- Hardcode IVs or salts
```

### Algorithm Recommendations

| Purpose                | Recommended            | Avoid                   |
| ---------------------- | ---------------------- | ----------------------- |
| Password hashing       | bcrypt, argon2, scrypt | MD5, SHA1, plain SHA256 |
| Symmetric encryption   | AES-256-GCM            | DES, 3DES, AES-ECB      |
| Asymmetric encryption  | RSA-2048+, ECDSA       | RSA-1024, DSA           |
| Hashing (non-password) | SHA-256, SHA-3         | MD5, SHA1               |
| Random generation      | Cryptographic RNG      | Math.random, rand()     |

---

## Logging Security

### What to Log

- Authentication events (success and failure)
- Authorization failures
- Input validation failures
- System errors
- Admin actions
- Data access (for sensitive data)

### What NOT to Log

- Passwords (even hashed)
- API keys or tokens
- Credit card numbers
- Social security numbers
- Full PII (mask it)
- Session tokens

### Secure Logging Pattern

```python
# ❌ Bad: Logs sensitive data
logger.info(f"Login attempt for {email} with password {password}")

# ✅ Good: Logs event without sensitive data
logger.info(f"Login attempt for user_id={user.id} from ip={request.ip}")

# ✅ Good: Masks sensitive data
logger.info(f"Processing card ending in {card_number[-4:]}")
```

---

## Dependency Security

### Keep Dependencies Updated

- Regular dependency audits
- Automated vulnerability scanning
- Update security patches promptly

### Audit Commands

```bash
# Python
pip-audit
safety check

# Node
npm audit
yarn audit

# General
dependabot / renovate (automated)
```

### Dependency Evaluation

Before adding new dependency:

- [ ] Is it actively maintained?
- [ ] How many downloads/stars?
- [ ] Any known vulnerabilities?
- [ ] What permissions does it need?
- [ ] Is the license acceptable?

---

## Security Checklist

### For Every Change

- [ ] No secrets in code
- [ ] Input validation present
- [ ] Output encoding for user content
- [ ] Authorization checks in place
- [ ] Errors don't leak sensitive info
- [ ] Logging doesn't include secrets

### For Authentication Changes

- [ ] Password hashing is secure
- [ ] Session management is secure
- [ ] Rate limiting implemented
- [ ] Account lockout considered

### For API Changes

- [ ] Authentication required
- [ ] Authorization verified
- [ ] Input validated
- [ ] Rate limiting in place
- [ ] Error responses are safe

### For Data Changes

- [ ] Encryption at rest (if sensitive)
- [ ] Encryption in transit (HTTPS)
- [ ] Access controls applied
- [ ] Audit logging in place

---

## Incident Response

### If Security Issue Found

1. **Assess severity** - What data/systems affected?
2. **Contain** - Prevent further damage
3. **Document** - What happened, when, impact
4. **Fix** - Resolve the vulnerability
5. **Review** - How to prevent similar issues
6. **Communicate** - Inform affected parties if needed

### Security Issue Severity

| Severity | Description                      | Response Time |
| -------- | -------------------------------- | ------------- |
| Critical | Active exploitation, data breach | Immediate     |
| High     | Exploitable vulnerability        | 24 hours      |
| Medium   | Potential vulnerability          | 1 week        |
| Low      | Minor security improvement       | Next release  |

---

## Claude's Security Responsibilities

When implementing code:

1. **Always validate input** from external sources
2. **Never hardcode secrets** - use environment variables
3. **Use parameterized queries** - no string concatenation for SQL
4. **Check authorization** - not just authentication
5. **Follow least privilege** - request minimal permissions
6. **Flag security concerns** - alert user to potential issues

When reviewing code:

1. **Check for common vulnerabilities** (OWASP Top 10)
2. **Verify secrets handling**
3. **Confirm input validation**
4. **Ensure proper authorization**
5. **Review error handling** for info leakage

---

_See [code-review.md](code-review.md) for security review requirements._
_See [error-handling.md](error-handling.md) for secure error handling._
