import { PrismaClient } from "../generated/prisma";

// Create a global instance of PrismaClient
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Initialize Prisma client with proper configuration for Supabase
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

// In development, save the prisma instance to global to avoid multiple instances
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handler
process.on("beforeExit", async () => {
  console.log("🔌 Disconnecting Prisma Client...");
  await prisma.$disconnect();
});

export default prisma;
