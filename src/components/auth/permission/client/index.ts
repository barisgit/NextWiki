/**
 * Permission System Entry Point
 *
 * This file exports all permission-related components for client.
 */

// Re-export components with clear namespacing
import { ClientPermissionGate } from "./gate";
import { ClientRequirePermission } from "./require";
import { PermissionProvider } from "../provider";
import { usePermissions } from "../utils/usePermissions";

// Provider components
export {
  /**
   * Context provider for client-side permission state
   * Place at the root of your app to provide permission context
   */
  PermissionProvider,

  /**
   * Hook for accessing permissions in client components
   */
  usePermissions,

  /**
   * Client-side permission gate component with slots for authorized/unauthorized states
   */
  ClientPermissionGate,

  /**
   * Client-side simplified permission check
   */
  ClientRequirePermission,
};
