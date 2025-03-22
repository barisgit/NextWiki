import { z } from 'zod';

// Schema for environment variables
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1).url(),
  
  // Auth
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  
  // OAuth providers
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Parse environment variables or throw error
function getEnv() {
  // In Node.js environments
  if (typeof process !== 'undefined') {
    return envSchema.parse(process.env);
  }
  
  // In browser environments (should never happen with sensitive values)
  return envSchema.parse({
    NODE_ENV: 'development',
  });
}

// Export environment variables
export const env = getEnv(); 