/**
 * Server-only permissions exports
 * This file should ONLY be imported in server components or API routes
 */

// Export validation functions that access the database
export {
  validatePermissionsDatabase,
  fixPermissionsDatabase,
  logValidationResults,
} from "./validation";
