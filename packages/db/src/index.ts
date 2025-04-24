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

// Load environment variables from .env file if present
dotenv.config({ path: [".env.local", ".env"] });

// Define environment variables we check
const databaseUrl = process.env.DATABASE_URL;
const vercelPostgresUrl = process.env.POSTGRES_URL; // Vercel's own managed DB
const runningOnVercel = !!process.env.VERCEL;

// Validate *at least* DATABASE_URL is set (needed as fallback or for non-Vercel/non-Neon)
if (!databaseUrl && !vercelPostgresUrl) {
  console.error("At least one of DATABASE_URL or POSTGRES_URL must be set!");
  throw new Error(
    "Please set DATABASE_URL or POSTGRES_URL in your environment (e.g., in .env file or in Vercel dashboard)."
  );
}

// Define a union type for all possible database types
export type DatabaseType =
  | VercelPgDatabase<typeof schema> // Used for Vercel managed DB OR Vercel deployment with external pooler
  | NeonHttpDatabase<typeof schema>
  | NodePgDatabase<typeof schema>; // Used for local/standard non-Vercel hosting

let db: DatabaseType;

// Determine which driver to use based on priority
if (vercelPostgresUrl) {
  // --- Priority 1: Using Vercel's integrated Postgres service ---
  console.log("Using Vercel Postgres driver (POSTGRES_URL detected)");
  const vercelPool = createVercelPool({ connectionString: vercelPostgresUrl });
  db = drizzleVercel(vercelPool, { schema });
} else if (databaseUrl && databaseUrl.includes(".neon.tech")) {
  // --- Priority 2: Using Neon DB (checked via DATABASE_URL) ---
  console.log("Using Neon database driver (DATABASE_URL contains .neon.tech)");
  neonConfig.fetchConnectionCache = true;
  const sql = neon(databaseUrl);
  db = drizzleNeon(sql, { schema });
} else if (runningOnVercel && databaseUrl) {
  // --- Priority 3: On Vercel, NOT using Vercel PG or Neon. Using external DB (likely via PgBouncer). ---
  // Use Vercel's pool utility even with a standard DATABASE_URL.
  // This is generally better suited for the serverless environment than pg.Pool.
  console.warn(
    "WARNING: Running on Vercel with external DATABASE_URL. Using Vercel/Postgres driver."
  );
  console.warn(
    "Ensure your DATABASE_URL points to a pooler (like PgBouncer) capable of handling Vercel scaling!"
  );
  // Let createVercelPool manage the connections suitable for serverless.
  const vercelPool = createVercelPool({ connectionString: databaseUrl });
  db = drizzleVercel(vercelPool, { schema });
} else if (databaseUrl) {
  // --- Priority 4: Standard/Local setup (Not on Vercel, Not Neon) ---
  // Use the standard node-postgres pool.
  console.log(
    "Using standard PostgreSQL driver (pg.Pool) with DATABASE_URL (Not on Vercel/Neon)"
  );
  // const poolSize = process.env.DATABASE_POOL_SIZE
  //   ? parseInt(process.env.DATABASE_POOL_SIZE, 10)
  //   : 10; // Default pool size
  const poolSize = 10;
  console.log(`Using pg.Pool with pool size: ${poolSize}`);
  const pool = new pg.Pool({
    connectionString: databaseUrl, // Use the main DATABASE_URL
    max: poolSize,
  });
  db = drizzlePg(pool, { schema });
} else {
  // This case should theoretically not be reached due to the initial check,
  // but provides a fallback / clear error if logic changes.
  console.error("Could not determine database connection method.");
  throw new Error("Invalid database configuration state.");
}

// Export the configured db
export { db };

// Re-export the seed function
export { seed } from "./seeds/run.js";

// Re-export the schema
export * from "./schema/index.js";

// Re-export the registry
export * from "./registry/index.js";

// Re-export the utils
export { runRawSqlMigration } from "./utils.js";
