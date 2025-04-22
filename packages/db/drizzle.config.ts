import "dotenv/config"; // Load .env file
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://user:password@localhost:5432/nextwiki",
  },
  verbose: true,
  strict: true,
});
