import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const createClient = () =>
  new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
  
}
/** Deadlock o conflicto de escritura: la transaccion se puede reintentar. */
export function isTransactionConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
  );
}
