// Import dotenv first and configure it
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Get project root directory
const projectRoot = process.cwd();
const envPath = path.join(projectRoot, ".env");

// Check if .env file exists and log its path
console.log("Looking for .env file at:", envPath);
console.log(".env file exists:", fs.existsSync(envPath));

// Explicitly load .env file with absolute path
const result = dotenv.config({ path: envPath });

// Log dotenv result
if (result.error) {
  console.error("Error loading .env file:", result.error);
} else {
  console.log(".env file loaded successfully");
  console.log(
    "DATABASE_URL from process.env:",
    process.env.DATABASE_URL ? "Found" : "Not found"
  );
}

// Then import other dependencies
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema/index.js";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import pg from "pg";

// Create database connection locally instead of importing from index.ts
const getDb = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is still not set after loading .env!"
    );
  }

  console.log("Connection string found in process.env");

  // Create database client based on connection string
  if (
    connectionString.includes("pooler.internal.neon") ||
    connectionString.includes(".neon.tech")
  ) {
    const sql = neon(connectionString);
    return drizzleNeon(sql, { schema });
  } else {
    const pool = new pg.Pool({ connectionString });
    return drizzlePg(pool, { schema });
  }
};

// This is the migration function that will run all pending migrations
async function runMigrations(force = false) {
  try {
    console.log("Running migrations...");

    // Get database connection
    const db = getDb();

    // Get connection string for detection
    const connectionString = process.env.DATABASE_URL || "";
    console.log(
      "Migration script using connection string (sanitized):",
      connectionString.replace(
        /postgresql:\/\/([^:]+):([^@]+)@/,
        "postgresql://$1:****@"
      )
    );

    let migrationsResult; // To store the result of migrate()

    try {
      if (
        connectionString.includes("pooler.internal.neon") ||
        connectionString.includes(".neon.tech")
      ) {
        console.log("Using Neon migrator...");
        migrationsResult = await migrateNeon(
          db as NeonHttpDatabase<typeof schema>,
          {
            migrationsFolder: "drizzle",
          }
        );
        console.log("Migrations completed successfully using Neon driver");
      } else {
        console.log("Using PostgreSQL migrator...");
        migrationsResult = await migratePg(
          db as NodePgDatabase<typeof schema>,
          {
            migrationsFolder: "drizzle",
          }
        );
        console.log(
          "Migrations completed successfully using PostgreSQL driver"
        );
      }

      console.log("Migration result:", migrationsResult);
    } catch (error: unknown) {
      const migrationError = error as { message?: string };

      if (
        migrationError.message &&
        migrationError.message.includes("already exists")
      ) {
        console.warn(
          "Some relations already exist. This likely means migrations were already applied."
        );
        console.warn("Original error:", migrationError.message);

        if (force) {
          console.log(
            "Force flag is set, attempting to continue with other migrations..."
          );
        } else {
          console.log(
            "Use the --force flag to attempt running migrations anyway."
          );
          console.log(
            "Or manually check your database schema to ensure it matches your migrations."
          );
        }
      } else {
        throw error;
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    console.error("Error details:", error);
    process.exit(1);
  }
}

// Run migrations if file is executed directly
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const forceFlag = process.argv.includes("--force");
  runMigrations(forceFlag);
}

export default runMigrations;
