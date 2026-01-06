# TypeScript/JavaScript Standards

TypeScript and JavaScript coding standards and best practices.

**Applies to**: TypeScript 5.x, Node.js 18+, ES2022+
**Last Updated**: YYYY-MM-DD

---

## Code Style

### Formatting

**Use Prettier**:

```bash
prettier --write .
```

**Configuration** (.prettierrc):

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Linting

**Use ESLint with TypeScript**:

```bash
eslint --ext .ts,.tsx .
```

**Configuration** (eslint.config.js - flat config):

```javascript
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.strictTypeChecked, {
  languageOptions: {
    parserOptions: {
      project: true,
    },
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-function-return-type": "error",
  },
});
```

---

## Naming Conventions

| Element            | Convention                       | Example                       |
| ------------------ | -------------------------------- | ----------------------------- |
| Files (components) | PascalCase                       | `UserProfile.tsx`             |
| Files (utilities)  | camelCase                        | `formatDate.ts`               |
| Classes            | PascalCase                       | `UserService`                 |
| Interfaces         | PascalCase + I prefix (optional) | `User` or `IUser`             |
| Types              | PascalCase                       | `UserResponse`                |
| Functions          | camelCase                        | `getUserById`                 |
| Variables          | camelCase                        | `userCount`                   |
| Constants          | UPPER_SNAKE or camelCase         | `MAX_RETRIES` or `maxRetries` |
| Enums              | PascalCase                       | `UserStatus`                  |
| Enum values        | PascalCase                       | `UserStatus.Active`           |

### Naming Guidelines

```typescript
// ✅ Good names
const userRepository = new UserRepository();
const isValid = validateInput(data);
const MAX_RETRY_ATTEMPTS = 3;

// ❌ Bad names
const ur = new UserRepository(); // Too short
const isvalid = validateInput(data); // Missing camelCase
const max_retry_attempts = 3; // Wrong convention
```

---

## TypeScript Configuration

### Strict Mode (Required)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Type Safety Rules

```typescript
// ✅ Always use explicit types for function parameters and returns
function getUser(id: number): Promise<User | null> {
  // ...
}

// ✅ Use strict null checks
function processUser(user: User | null): void {
  if (!user) {
    return;
  }
  // user is now User (not null)
}

// ❌ Avoid `any`
function process(data: any): any {
  // Bad
  return data;
}

// ✅ Use `unknown` for truly unknown types
function process(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }
  throw new Error("Expected string");
}
```

---

## Project Structure

### Standard Layout

```
project/
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── src/
│   ├── index.ts           # Entry point
│   ├── types/
│   │   └── index.ts       # Type definitions
│   ├── models/
│   │   └── user.ts
│   ├── services/
│   │   └── userService.ts
│   ├── utils/
│   │   └── helpers.ts
│   └── config/
│       └── index.ts
├── tests/
│   ├── setup.ts
│   ├── unit/
│   │   └── userService.test.ts
│   └── integration/
│       └── api.test.ts
└── dist/                  # Compiled output
```

### Barrel Exports

```typescript
// src/models/index.ts
export { User } from "./user";
export { Post } from "./post";
export type { UserCreateInput, UserUpdateInput } from "./user";
```

---

## Type Definitions

### Interfaces vs Types

```typescript
// Use interface for object shapes (extendable)
interface User {
  id: number;
  email: string;
  name: string;
}

interface AdminUser extends User {
  permissions: string[];
}

// Use type for unions, primitives, computed types
type UserId = number | string;
type UserStatus = "active" | "inactive" | "pending";
type UserWithPosts = User & { posts: Post[] };
```

### Utility Types

```typescript
// Partial - all properties optional
type UserUpdate = Partial<User>;

// Required - all properties required
type CompleteUser = Required<User>;

// Pick - select properties
type UserPreview = Pick<User, "id" | "name">;

// Omit - exclude properties
type UserWithoutId = Omit<User, "id">;

// Record - object with specific key/value types
type UserRoles = Record<UserId, string[]>;
```

### Discriminated Unions

```typescript
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

function handleResult(result: Result<User>): void {
  if (result.success) {
    console.log(result.data.name); // TypeScript knows data exists
  } else {
    console.error(result.error.message); // TypeScript knows error exists
  }
}
```

---

## Error Handling

### Custom Error Classes

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", details);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string | number) {
    super(`${resource} with id ${id} not found`, "NOT_FOUND");
  }
}
```

### Error Handling Patterns

```typescript
// ✅ Type-safe error handling
async function getUser(id: number): Promise<User> {
  const user = await db.users.findUnique({ where: { id } });

  if (!user) {
    throw new NotFoundError("User", id);
  }

  return user;
}

// ✅ Result type pattern (no exceptions)
async function getUserSafe(id: number): Promise<Result<User>> {
  try {
    const user = await db.users.findUnique({ where: { id } });
    if (!user) {
      return { success: false, error: new NotFoundError("User", id) };
    }
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

---

## Async/Await

### Always Use Async/Await

```typescript
// ✅ Clean async/await
async function fetchUserData(userId: number): Promise<UserData> {
  const user = await getUser(userId);
  const posts = await getUserPosts(userId);
  const followers = await getUserFollowers(userId);

  return { user, posts, followers };
}

// ✅ Parallel execution
async function fetchUserDataParallel(userId: number): Promise<UserData> {
  const [user, posts, followers] = await Promise.all([
    getUser(userId),
    getUserPosts(userId),
    getUserFollowers(userId),
  ]);

  return { user, posts, followers };
}

// ❌ Avoid .then() chains
function fetchUserData(userId: number): Promise<UserData> {
  return getUser(userId)
    .then((user) => getUserPosts(userId).then((posts) => ({ user, posts })))
    .then(({ user, posts }) => /* ... */);  // Hard to read
}
```

### Error Handling in Async

```typescript
// ✅ Try/catch with specific handling
async function processUser(userId: number): Promise<void> {
  try {
    const user = await getUser(userId);
    await processUserData(user);
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger.warn(`User ${userId} not found`);
      return;
    }
    throw error; // Re-throw unexpected errors
  }
}
```

---

## Testing

### Jest Configuration

```javascript
// jest.config.js
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Test Structure

```typescript
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UserService } from "../src/services/userService";

describe("UserService", () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  describe("getUser", () => {
    it("should return user when found", async () => {
      // Arrange
      const userId = 123;

      // Act
      const result = await service.getUser(userId);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(userId);
    });

    it("should return null when user not found", async () => {
      const result = await service.getUser(999);
      expect(result).toBeNull();
    });
  });
});
```

### Mocking

```typescript
import { jest } from "@jest/globals";

// Mock module
jest.mock("../src/db", () => ({
  query: jest.fn(),
}));

// Mock implementation
const mockQuery = jest.mocked(db.query);
mockQuery.mockResolvedValue([{ id: 1, name: "Test" }]);

// Spy on method
const spy = jest.spyOn(service, "validate");
expect(spy).toHaveBeenCalledWith(data);
```

---

## Common Patterns

### Dependency Injection

```typescript
interface UserRepository {
  findById(id: number): Promise<User | null>;
  save(user: User): Promise<User>;
}

class UserService {
  constructor(private readonly repository: UserRepository) {}

  async getUser(id: number): Promise<User | null> {
    return this.repository.findById(id);
  }
}

// Usage with real implementation
const service = new UserService(new PostgresUserRepository());

// Usage in tests with mock
const mockRepo: UserRepository = {
  findById: jest.fn(),
  save: jest.fn(),
};
const service = new UserService(mockRepo);
```

### Builder Pattern

```typescript
class QueryBuilder<T> {
  private filters: Array<(item: T) => boolean> = [];
  private sortFn?: (a: T, b: T) => number;
  private limitCount?: number;

  where(predicate: (item: T) => boolean): this {
    this.filters.push(predicate);
    return this;
  }

  orderBy(compareFn: (a: T, b: T) => number): this {
    this.sortFn = compareFn;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  execute(items: T[]): T[] {
    let result = items.filter((item) => this.filters.every((f) => f(item)));
    if (this.sortFn) result = result.sort(this.sortFn);
    if (this.limitCount) result = result.slice(0, this.limitCount);
    return result;
  }
}
```

### Factory Pattern

```typescript
interface Logger {
  log(message: string): void;
}

function createLogger(type: "console" | "file" | "remote"): Logger {
  switch (type) {
    case "console":
      return new ConsoleLogger();
    case "file":
      return new FileLogger();
    case "remote":
      return new RemoteLogger();
    default:
      throw new Error(`Unknown logger type: ${type}`);
  }
}
```

---

## Anti-Patterns to Avoid

| Anti-Pattern             | Problem               | Better Approach                   |
| ------------------------ | --------------------- | --------------------------------- |
| `any` type               | No type safety        | Use `unknown` or specific types   |
| Non-null assertion (`!`) | Hides potential nulls | Use proper null checks            |
| `== null`                | Confusing equality    | Use `=== null \|\| === undefined` |
| `var` keyword            | Hoisting issues       | Use `const` or `let`              |
| Callback hell            | Hard to read          | Use async/await                   |
| Implicit returns         | Unclear intent        | Use explicit returns              |

### Examples

```typescript
// ❌ Non-null assertion (dangerous)
function getUser(id: number): User {
  const user = findUser(id);
  return user!; // Assumes user exists
}

// ✅ Explicit null handling
function getUser(id: number): User {
  const user = findUser(id);
  if (!user) {
    throw new NotFoundError("User", id);
  }
  return user;
}
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint --ext .ts,.tsx .",
    "lint:fix": "eslint --ext .ts,.tsx . --fix",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "prepare": "husky install"
  }
}
```

---

## Tools Summary

| Tool       | Purpose            | Command                  |
| ---------- | ------------------ | ------------------------ |
| Prettier   | Formatting         | `prettier --write .`     |
| ESLint     | Linting            | `eslint .`               |
| TypeScript | Type checking      | `tsc --noEmit`           |
| Jest       | Testing            | `jest`                   |
| tsx        | Development runner | `tsx watch src/index.ts` |
| npm audit  | Security           | `npm audit`              |

---

_See [../POLICIES/testing.md](../POLICIES/testing.md) for general testing policy._
_See [../POLICIES/error-handling.md](../POLICIES/error-handling.md) for error handling patterns._
