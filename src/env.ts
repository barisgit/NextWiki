import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables schema
   * Ensures app isn't built with invalid env vars
   */
  server: {
    NODE_ENV: z.enum(["development", "production"]),
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url().optional(),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
  },

  /**
   * Client-side environment variables schema
   * Expose to client by prefixing with `NEXT_PUBLIC_`
   */
  client: {
    NEXT_PUBLIC_DEV_MODE: z.enum(["true", "false"]).default("false"),
    NEXT_PUBLIC_NODE_ENV: z
      .enum(["development", "production"])
      .default("development"),
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * Manual destructuring of process.env for Next.js edge runtimes and client-side
   */
  runtimeEnv: {
    // Server-side env vars
    NEXT_PUBLIC_DEV_MODE: process.env.NEXT_PUBLIC_DEV_MODE,
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    // Client-side env vars
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },

  /**
   * Skip env validation during build/dev with SKIP_ENV_VALIDATION
   * Useful for Docker builds
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Treat empty strings as undefined
   * `SOME_VAR: z.string()` with `SOME_VAR=''` will throw error
   */
  emptyStringAsUndefined: true,
});
