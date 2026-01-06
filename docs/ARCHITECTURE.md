# Architecture

System design and technical architecture.

**Last Updated**: YYYY-MM-DD

---

## Overview

[High-level description of the system architecture]

### System Diagram

```
[ASCII diagram or description of system components]

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Component  │────▶│  Component  │────▶│  Component  │
│      A      │     │      B      │     │      C      │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Layers

### [Layer Name] (e.g., Presentation Layer)

**Purpose**: [What this layer does]

**Components**:
| Component | Responsibility | Location |
|-----------|---------------|----------|
| [Component] | [What it does] | [path/to/code] |

**Key Interfaces**:

- [Interface/API description]

### [Layer Name] (e.g., Business Logic Layer)

**Purpose**: [What this layer does]

**Components**:
| Component | Responsibility | Location |
|-----------|---------------|----------|
| [Component] | [What it does] | [path/to/code] |

### [Layer Name] (e.g., Data Layer)

**Purpose**: [What this layer does]

**Components**:
| Component | Responsibility | Location |
|-----------|---------------|----------|
| [Component] | [What it does] | [path/to/code] |

---

## Data Flow

### [Flow Name] (e.g., Request Processing)

```
1. [Step 1]
   └─▶ 2. [Step 2]
       └─▶ 3. [Step 3]
           └─▶ 4. [Step 4]
```

**Description**: [Detailed description of the flow]

---

## Data Model

### Entities

| Entity   | Description          | Key Fields         |
| -------- | -------------------- | ------------------ |
| [Entity] | [What it represents] | [Important fields] |

### Relationships

```
[Entity A] ──1:N──▶ [Entity B]
[Entity B] ──M:N──▶ [Entity C]
```

### Storage

| Data Type | Storage        | Rationale |
| --------- | -------------- | --------- |
| [Type]    | [Where stored] | [Why]     |

---

## External Dependencies

### Services

| Service   | Purpose            | Integration Point |
| --------- | ------------------ | ----------------- |
| [Service] | [What it provides] | [How we connect]  |

### Libraries

| Library   | Version | Purpose              |
| --------- | ------- | -------------------- |
| [Library] | [x.y.z] | [What it's used for] |

---

## Configuration

### Environment Variables

| Variable | Purpose              | Required |
| -------- | -------------------- | -------- |
| [VAR]    | [What it configures] | Yes/No   |

### Configuration Files

| File             | Purpose              |
| ---------------- | -------------------- |
| [path/to/config] | [What it configures] |

---

## Security

### Authentication

[How authentication works]

### Authorization

[How authorization works]

### Data Protection

[How sensitive data is protected]

---

## Scalability

### Current Limits

| Resource   | Current Capacity | Bottleneck       |
| ---------- | ---------------- | ---------------- |
| [Resource] | [Limit]          | [What limits it] |

### Scaling Strategy

[How the system can be scaled]

---

## Error Handling

### Error Categories

| Category   | Handling Strategy | Example         |
| ---------- | ----------------- | --------------- |
| [Category] | [How handled]     | [Example error] |

### Logging

[Logging strategy and where logs are stored]

### Monitoring

[What is monitored and how]

---

## Development Guidelines

### Layer Boundaries

| From Layer | To Layer | Allowed? | Notes         |
| ---------- | -------- | -------- | ------------- |
| [A]        | [B]      | Yes/No   | [Constraints] |

### Adding New Components

1. [Step 1]
2. [Step 2]
3. [Step 3]

### Breaking Changes

**What constitutes a breaking change**:

- [Type of change 1]
- [Type of change 2]

**Process for breaking changes**:

1. [Step 1]
2. [Step 2]

---

## Testing Architecture

### Test Levels

| Level       | What's Tested | Location           |
| ----------- | ------------- | ------------------ |
| Unit        | [Scope]       | tests/unit/        |
| Integration | [Scope]       | tests/integration/ |
| E2E         | [Scope]       | tests/e2e/         |

---

## Deployment

### Environments

| Environment | Purpose   | Configuration      |
| ----------- | --------- | ------------------ |
| Development | [Purpose] | [Config reference] |
| Staging     | [Purpose] | [Config reference] |
| Production  | [Purpose] | [Config reference] |

### Deployment Process

[Overview of deployment process]

---

_See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for decisions and patterns._
_See [planning/TODO.md](planning/TODO.md) for planned architectural changes._
