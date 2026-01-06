# DevContainer Setup

This project includes a DevContainer configuration for VS Code, providing a consistent development environment with all required services.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [VS Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

## Quick Start

1. Open VS Code
2. Press `F1` and select **Dev Containers: Open Folder in Container...**
3. Select the project folder
4. Wait for the container to build (first time takes a few minutes)

## Included Services

| Service    | Internal URL            | External Port | Description            |
| ---------- | ----------------------- | ------------- | ---------------------- |
| PostgreSQL | `postgres:5432`         | 5432          | Database               |
| Redis      | `redis:6379`            | 6379          | Cache & job queue      |
| Adminer    | `http://localhost:8080` | 8080          | Database management UI |

## Environment Variables

The following environment variables are automatically configured:

```bash
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/dropshipping?schema=public
REDIS_URL=redis://redis:6379
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production-min-32-chars
```

## Getting Started

After the container starts:

```bash
# Run database migrations
npm run db:migrate

# Seed the database with test data
npm run db:seed

# Start the development server
npm run dev
```

## Useful Commands

```bash
# Open Prisma Studio (database GUI)
npm run db:studio

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Run linting
npm run lint

# Format code
npm run format
```

## VS Code Extensions

The following extensions are automatically installed:

- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- Docker
- GitLens
- Playwright Test

## Ports

| Port | Service       |
| ---- | ------------- |
| 3000 | Next.js App   |
| 5432 | PostgreSQL    |
| 6379 | Redis         |
| 8080 | Adminer       |
| 5555 | Prisma Studio |

## Troubleshooting

### Container fails to start

1. Ensure Docker Desktop is running
2. Try rebuilding: `F1` → **Dev Containers: Rebuild Container**

### Database connection issues

1. Wait for PostgreSQL health check to pass
2. Check logs: `docker logs dropshipping-postgres`

### Permission issues

If you encounter permission issues with node_modules:

```bash
sudo chown -R node:node /workspace/node_modules
```
