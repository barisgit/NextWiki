"use client";

import { createContext, useContext } from "react";
import { PermissionIdentifier } from "@repo/db/client";

// Define permission type with typed identifier
export interface Permission {
  id: number;
  name: PermissionIdentifier;
  module: string;
  resource: string;
  action: string;
  description: string | null;
}

// Define the permissions data structure
export interface PermissionContextValue {
  // Raw permissions data
  permissions: Permission[];

  // Array of permission names
  permissionNames: PermissionIdentifier[];

  // Map for easy lookup
  permissionMap: Record<PermissionIdentifier, boolean>;

  // Loading state
  isLoading: boolean;

  // Authenticated state
  isAuthenticated: boolean;

  // Guest state (not authenticated)
  isGuest: boolean;

  // Helper functions
  hasPermission: (permission: PermissionIdentifier) => boolean;
  hasAnyPermission: (permissions: PermissionIdentifier[]) => boolean;

  // Optional reload function
  reloadPermissions: () => Promise<void>;
}

// Create the context with a default empty state
export const PermissionContext = createContext<PermissionContextValue>({
  permissions: [],
  permissionNames: [],
  permissionMap: {} as Record<PermissionIdentifier, boolean>,
  isLoading: true,
  isAuthenticated: false,
  isGuest: false,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  reloadPermissions: async () => {},
});

// Custom hook to use the context
export function usePermissionContext() {
  const context = useContext(PermissionContext);

  if (context === undefined) {
    throw new Error(
      "usePermissionContext must be used within a PermissionProvider"
    );
  }

  return context;
}
