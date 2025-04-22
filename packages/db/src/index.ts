import "server-only";

import * as dotenv from "dotenv";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

// Load environment variables from .env file
dotenv.config();

// Database connection string - should be in environment variables in a real app
const connectionString = process.env.DATABASE_URL;

// Validate connection string
if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set!");
  // For development, provide useful information rather than silently using a fallback
  throw new Error("Please set DATABASE_URL in your .env file");
}

// Define a union type for both possible database types
export type DatabaseType =
  | NeonHttpDatabase<typeof schema>
  | NodePgDatabase<typeof schema>;

let db: DatabaseType;

// Detect if we're using Neon (cloud) or regular PostgreSQL
if (
  connectionString.includes("pooler.internal.neon") ||
  connectionString.includes(".neon.tech")
) {
  // For Edge runtime compatibility with Neon
  neonConfig.fetchConnectionCache = true;

  // Create Neon SQL client with the connection string
  const sql = neon(connectionString);
  // Create Drizzle client with Neon driver
  db = drizzleNeon(sql, { schema });
  console.log("Using Neon database driver");
} else {
  // Use regular PostgreSQL driver for local or other PostgreSQL databases
  const pool = new pg.Pool({ connectionString });
  // Create Drizzle client with regular PostgreSQL driver
  db = drizzlePg(pool, { schema });
  // console.debug("Using standard PostgreSQL driver");
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
