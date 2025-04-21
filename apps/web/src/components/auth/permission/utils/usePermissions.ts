"use client";

import { usePermissionContext } from "./context";

/**
 * Custom hook to access and check permissions on the client side.
 * Must be used within a component that is a descendant of the PermissionProvider.
 *
 * @returns Permission context with helper functions
 */
export function usePermissions() {
  return usePermissionContext();
}
