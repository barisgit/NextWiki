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
} else if (runningOnVercel) {
  // --- Priority 3: On Vercel, but NOT using Vercel's integrated DB or Neon. ---
  // USE STANDARD pg.Pool. This simplifies setup but RISKS connection limits on Vercel.
  // User MUST ensure their DB can handle potential connections from many function instances by eg. providing a PgBouncer or other pooler.
  console.warn(
    "WARNING: Running on Vercel without Vercel Postgres or Neon DB. Using standard pg.Pool (DATABASE_URL)."
  );
  console.warn(
    "Ensure your database connection limit is high enough for potential Vercel scaling or that you have a PgBouncer or other pooler!"
  );
  const poolSize = 3; // Keep pool size very small for Vercel fallback
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: poolSize,
  });
  db = drizzlePg(pool, { schema });
} else {
  // --- Priority 4: Standard/Local setup (Not on Vercel, Not Neon) ---
  // Use the standard node-postgres pool.
  console.log(
    "Using standard PostgreSQL driver (pg.Pool) with DATABASE_URL (Not on Vercel/Neon)"
  );
  const poolSize = 10;
  const pool = new pg.Pool({
    connectionString: databaseUrl, // Use the main DATABASE_URL
    max: poolSize,
  });
  db = drizzlePg(pool, { schema });
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
