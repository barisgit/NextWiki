import fs from "node:fs/promises";
import path from "node:path";
import { db } from "./index.js";
import { sql } from "drizzle-orm";

/**
 * Executes a raw SQL migration script from a given file path.
 *
 * @param migrationPath - The path to the SQL migration file, relative to the project root or absolute.
 * @param relativeToDir - The directory to resolve relative paths from (defaults to the current working directory).
 * @returns A promise that resolves when the migration is executed successfully.
 * @throws Will throw an error if the file cannot be read or the SQL execution fails.
 */
export async function runRawSqlMigration(
  migrationPath: string,
  relativeToDir: string = process.cwd()
): Promise<void> {
  const absolutePath = path.resolve(relativeToDir, migrationPath);
  try {
    console.log(`Reading migration file: ${absolutePath}`);
    const migrationSql = await fs.readFile(absolutePath, "utf-8");

    if (!migrationSql.trim()) {
      console.log(`Migration file is empty: ${absolutePath}. Skipping.`);
      return;
    }

    console.log(`Executing raw SQL migration from: ${absolutePath}`);
    // Use db.execute for drivers like pg, mysql2, neon
    // Use db.run for drivers like better-sqlite3
    // Assuming a PostgreSQL-compatible driver here based on pg_trgm usage seen elsewhere.
    await db.execute(sql.raw(migrationSql));

    console.log(`Successfully executed migration: ${absolutePath}`);
  } catch (error) {
    console.error(
      `Failed to execute raw SQL migration from ${absolutePath}:`,
      error
    );
    throw new Error(
      `Migration failed for ${absolutePath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
