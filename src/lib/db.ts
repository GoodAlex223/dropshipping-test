import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || "";

  if (!connectionString) {
    return new PrismaClient({
      log: ["error", "warn"],
    });
  }

  // Add Neon-compatible connection parameters
  const url = appendConnectionParams(connectionString);

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: { url },
    },
  });
}

// Add serverless-friendly connection params for Neon
function appendConnectionParams(url: string): string {
  if (!url) return url;

  const separator = url.includes("?") ? "&" : "?";
  // Optimized for Neon serverless: single connection, extended timeouts
  return `${url}${separator}connection_limit=1&pool_timeout=30&connect_timeout=30`;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
