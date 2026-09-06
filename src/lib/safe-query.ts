import { Prisma } from "@prisma/client";

/** Prisma errors that mean the DB/schema is missing or unreachable (common on Vercel without Postgres). */
export function isPrismaUnavailableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientRustPanicError) return true;
  if (error instanceof Prisma.PrismaClientUnknownRequestError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return (
      error.code === "P2021" || // table does not exist
      error.code === "P2022" || // column does not exist
      error.code === "P1001" || // can't reach DB
      error.code === "P1003" || // database does not exist
      error.code === "P1017" || // server closed connection
      error.code === "P1000" || // authentication failed / unreachable
      error.code === "P1010" || // user denied access
      error.code === "P1011" || // TLS error
      error.code === "P1012" // schema engine error
    );
  }
  // Engine / filesystem noise from SQLite on read-only serverless, or driver mismatches
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("can't reach database") ||
      msg.includes("database `") ||
      msg.includes("does not exist") ||
      msg.includes("no such table") ||
      msg.includes("readonly database") ||
      msg.includes("unable to open the database") ||
      msg.includes("error code 14") || // SQLITE_CANTOPEN
      msg.includes("error code 8") || // SQLITE_READONLY
      msg.includes("datasource url") ||
      msg.includes("the table") ||
      msg.includes("connection") ||
      msg.includes("econnrefused") ||
      msg.includes("enotfound") ||
      msg.includes("ssl") ||
      msg.includes("postgres") ||
      msg.includes("sqlite")
    ) {
      return true;
    }
  }
  return false;
}

let loggedOnce = false;

/**
 * Run a Prisma query; on missing schema / unreachable DB return `fallback`
 * so Next.js SSR and cold deploys don't crash the whole page with a 500.
 *
 * In production, any unexpected DB error also falls back (empty state)
 * so a misconfigured DATABASE_URL never takes down the homepage.
 */
export async function safeQuery<T>(
  query: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await query();
  } catch (error) {
    const soft =
      isPrismaUnavailableError(error) || process.env.NODE_ENV === "production";
    if (soft) {
      if (!loggedOnce) {
        loggedOnce = true;
        console.error(
          "[Xndzor] Database query failed — serving empty fallback. Set a Postgres DATABASE_URL (Neon/Vercel Postgres).",
          error instanceof Error ? error.message : error,
        );
      }
      return fallback;
    }
    throw error;
  }
}
