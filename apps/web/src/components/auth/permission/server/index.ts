/**
 * Permission System Entry Point
 *
 * This file exports all permission-related components for server.
 */

// Re-export components with clear namespacing
import { PermissionGate } from "./gate";
import { RequirePermission } from "./require";

export { PermissionGate, RequirePermission };
