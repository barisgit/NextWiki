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
// Import the Vercel Postgres *client* which can read DATABASE_URL
import { createPool as createVercelPool } from "@vercel/postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

// Load environment variables from .env file if present
dotenv.config({ path: [".env.local", ".env"] });

// Database connection string - Rely solely on DATABASE_URL
const connectionString = process.env.DATABASE_URL;

// Validate connection string
if (!connectionString) {
  console.error("DATABASE_URL environment variable must be set!");
  throw new Error(
    "Please set DATABASE_URL in your environment (e.g., in .env file)."
  );
}

// Define a union type for all possible database types
export type DatabaseType =
  | VercelPgDatabase<typeof schema> // Keep Vercel type
  | NeonHttpDatabase<typeof schema>
  | NodePgDatabase<typeof schema>;

let db: DatabaseType;
const runningOnVercel = !!process.env.VERCEL;

// Determine which driver to use
if (runningOnVercel) {
  // --- If on Vercel, use Vercel adapter with DATABASE_URL ---
  // Note: @vercel/postgres createPool uses DATABASE_URL by default if POSTGRES_URL is absent
  const vercelPool = createVercelPool({ connectionString: connectionString });
  db = drizzleVercel(vercelPool, { schema });
  console.log("Using Vercel Postgres driver (detected Vercel environment)");
} else if (connectionString.includes(".neon.tech")) {
  // --- If not on Vercel, check for Neon ---
  neonConfig.fetchConnectionCache = true;
  const sql = neon(connectionString);
  db = drizzleNeon(sql, { schema });
  console.log("Using Neon database driver (detected .neon.tech URL)");
} else {
  // --- Otherwise (not on Vercel, not Neon), use standard node-postgres ---
  const poolSize = 10;
  console.log(
    `Using standard PostgreSQL driver with pool size ${poolSize} (DATABASE_URL)`
  );
  const pool = new pg.Pool({
    connectionString: connectionString,
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
