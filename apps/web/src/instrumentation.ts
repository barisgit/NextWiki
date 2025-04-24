import { sql } from "drizzle-orm";

/**
 * This function is executed once per server start in Node.js.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Ensure this only runs on the server during startup
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamically import db functions only when needed (Node.js runtime)
    const { db } = await import("@repo/db");
    const { createLogger } = await import("@repo/logger");
    const logger = createLogger("INSTRUMENTATION");

    logger.info("Performing startup checks...");

    try {
      // Check if pg_trgm extension is enabled
      const result = await db.execute(
        sql`SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'`
      );

      if (result.rows.length > 0) {
        logger.info("✅ pg_trgm extension check passed.");
      } else {
        logger.error(
          '❌ Critical: pg_trgm extension is not enabled in the database. Features like fuzzy search may not work correctly. Please ensure the extension is enabled in your PostgreSQL instance (e.g., run "CREATE EXTENSION IF NOT EXISTS pg_trgm;"). For local development using the setup script, this should be handled automatically.'
        );
      }
    } catch (error) {
      logger.error(
        "❌ Failed to check for pg_trgm extension. Database connection or permissions might be incorrect.",
        error
      );
    }

    logger.info("Startup checks completed.");
  }
}
