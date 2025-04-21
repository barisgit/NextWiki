/**
 * Server-only permissions exports
 * This file should ONLY be imported in server components or API routes
 */

// Re-export everything from the main barrel for convenience
export * from "./index";

// Export validation functions that access the database
export {
  validatePermissionsDatabase,
  fixPermissionsDatabase,
  logValidationResults,
} from "./validation";
