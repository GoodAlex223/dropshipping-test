import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: appendConnectionParams(process.env.DATABASE_URL || ""),
      },
    },
  });
}

// Add serverless-friendly connection params for Neon
function appendConnectionParams(url: string): string {
  if (!url) return url;

  const separator = url.includes("?") ? "&" : "?";
  // Limit connections for serverless, increase pool timeout
  return `${url}${separator}connection_limit=1&pool_timeout=20&connect_timeout=30`;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
