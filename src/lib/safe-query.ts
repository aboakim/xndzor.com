import { Prisma } from "@prisma/client";

/** Prisma errors that mean the DB/schema is missing or unreachable (common on Vercel+SQLite). */
export function isPrismaUnavailableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientRustPanicError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return (
      error.code === "P2021" || // table does not exist
      error.code === "P2022" || // column does not exist
      error.code === "P1001" || // can't reach DB
      error.code === "P1003" || // database does not exist
      error.code === "P1017" // server closed connection
    );
  }
  return false;
}

/**
 * Run a Prisma query; on missing schema / unreachable DB return `fallback`
 * so Next.js prerender and cold deploys don't crash the whole build.
 */
export async function safeQuery<T>(
  query: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await query();
  } catch (error) {
    if (isPrismaUnavailableError(error)) return fallback;
    throw error;
  }
}
