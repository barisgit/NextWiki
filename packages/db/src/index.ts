import * as dotenv from "dotenv";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  drizzle as drizzleVercel,
  type VercelPgDatabase,
} from "drizzle-orm/vercel-postgres";
import { createPool as createVercelPool } from "@vercel/postgres";
import pg from "pg";
import * as schema from "./schema/index.js";
import { logger } from "@repo/logger";

// Load environment variables from .env file if present
dotenv.config({ path: [".env.local", ".env"] });

// --- Configuration ---

// Define environment variables we check
const databaseUrl = process.env.DATABASE_URL;
const vercelPostgresUrl = process.env.POSTGRES_URL; // Vercel's own managed DB
const runningOnVercel = !!process.env.VERCEL;

/**
 * Enum representing the different database connection types.
 */
export enum ConnectionType {
  VERCEL_POSTGRES = "VERCEL_POSTGRES", // Vercel's managed Postgres or external pooler via POSTGRES_URL
  NEON = "NEON", // Neon DB via DATABASE_URL
  VERCEL_EXTERNAL_POOL = "VERCEL_EXTERNAL_POOL", // External DB on Vercel via DATABASE_URL (e.g., PgBouncer)
  STANDARD_POOL = "STANDARD_POOL", // Standard node-postgres pool (local/non-Vercel)
  INVALID = "INVALID", // Configuration is invalid
}

/**
 * Determines the database connection type based on environment variables.
 * @param dbUrl - The DATABASE_URL environment variable.
 * @param vercelUrl - The POSTGRES_URL environment variable.
 * @param isOnVercel - Boolean indicating if running on Vercel.
 * @returns The determined ConnectionType.
 */
const getConnectionType = (
  dbUrl: string | undefined,
  vercelUrl: string | undefined,
  isOnVercel: boolean
): ConnectionType => {
  if (vercelUrl) {
    return ConnectionType.VERCEL_POSTGRES;
  }
  if (dbUrl && dbUrl.includes(".neon.tech")) {
    return ConnectionType.NEON;
  }
  if (isOnVercel && dbUrl) {
    return ConnectionType.VERCEL_EXTERNAL_POOL;
  }
  if (dbUrl) {
    return ConnectionType.STANDARD_POOL;
  }
  return ConnectionType.INVALID;
};

// --- Database Initialization ---

// Validate *at least* one URL is set
if (!databaseUrl && !vercelPostgresUrl) {
  console.error("At least one of DATABASE_URL or POSTGRES_URL must be set!");
  throw new Error(
    "Please set DATABASE_URL or POSTGRES_URL in your environment (e.g., in .env file or in Vercel dashboard)."
  );
}

// Define a union type for all possible database types
export type DatabaseType =
  | VercelPgDatabase<typeof schema>
  | NeonHttpDatabase<typeof schema>
  | NodePgDatabase<typeof schema>;

let db: DatabaseType;
const connectionType = getConnectionType(
  databaseUrl,
  vercelPostgresUrl,
  runningOnVercel
);

// const poolSize = process.env.DATABASE_POOL_SIZE
//   ? parseInt(process.env.DATABASE_POOL_SIZE, 10)
//   : 10;

const poolSize = 10;

switch (connectionType) {
  case ConnectionType.VERCEL_POSTGRES:
    console.log("Using Vercel Postgres pool driver (POSTGRES_URL detected)");
    // Use createPool as recommended for Vercel's own Postgres
    // We know vercelPostgresUrl is defined here due to getConnectionType logic
    db = drizzleVercel(
      createVercelPool({
        connectionString: vercelPostgresUrl!,
      }),
      { schema }
    );
    break;

  case ConnectionType.NEON:
    console.log(
      "Using Neon database driver (DATABASE_URL contains .neon.tech)"
    );
    // We know databaseUrl is defined here due to getConnectionType logic
    neonConfig.fetchConnectionCache = true;
    db = drizzleNeon(neon(databaseUrl!), { schema });
    break;

  case ConnectionType.VERCEL_EXTERNAL_POOL:
    console.warn(
      "Using standard pg.Pool with external DATABASE_URL on Vercel. Ensure the URL points to a pooler."
    );
    // We know databaseUrl is defined here due to getConnectionType logic
    db = drizzlePg(
      new pg.Pool({
        connectionString: databaseUrl!,
        max: 1, // Recommended for Vercel serverless functions connecting to external DBs
      }),
      { schema }
    );
    break;

  case ConnectionType.STANDARD_POOL:
    console.log(
      "Using standard PostgreSQL driver (pg.Pool) with DATABASE_URL (Not on Vercel/Neon)"
    );
    // We know databaseUrl is defined here due to getConnectionType logic
    console.log(`Using pg.Pool with pool size: ${poolSize}`);
    db = drizzlePg(
      new pg.Pool({
        connectionString: databaseUrl!,
        max: poolSize,
      }),
      { schema }
    );
    break;

  case ConnectionType.INVALID:
  default:
    // This case should theoretically not be reached due to the initial validation
    // and the logic in getConnectionType, but it's good practice to handle it.
    logger.error("Could not determine database connection method.");
    throw new Error("Invalid database configuration state.");
}

// --- Exports ---

// Export the configured db as a named export
export { db };

// Re-export the seed function
export { seed } from "./seeds/run.js";

// Re-export the schema
export * from "./schema/index.js";

// Re-export the registry
export * from "./registry/index.js";

// Re-export the utils
export { runRawSqlMigration } from "./utils.js";
