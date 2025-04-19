"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useTRPC } from "~/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { PermissionIdentifier } from "~/lib/permissions";
import { isValidPermissionId, checkPermission } from "~/lib/permissions/client";

// Define permission type with typed identifier
interface Permission {
  id: number;
  name: PermissionIdentifier;
  module: string;
  resource: string;
  action: string;
  description: string | null;
}

// Define the permissions data structure returned by the API
interface PermissionsData {
  permissions: Permission[];
  permissionNames: PermissionIdentifier[];
  permissionMap: Record<PermissionIdentifier, boolean>;
}

// Define the shape of the permission context
interface PermissionContextType {
  // Raw permissions data
  permissions: Permission[];

  // Array of permission names
  permissionNames: PermissionIdentifier[];

  // Map for easy lookup
  permissionMap: Record<PermissionIdentifier, boolean>;

  // Loading state
  isLoading: boolean;

  // Helper functions
  hasPermission: (permission: PermissionIdentifier) => boolean;
  hasAnyPermission: (permissions: PermissionIdentifier[]) => boolean;

  // Optional reload function
  reloadPermissions: () => Promise<void>;
}

// Create the context with a default empty state
const PermissionContext = createContext<PermissionContextType>({
  permissions: [],
  permissionNames: [],
  permissionMap: {} as Record<PermissionIdentifier, boolean>,
  isLoading: true,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  reloadPermissions: async () => {},
});

// Provider component
function PermissionProvider({ children }: { children: ReactNode }) {
  const [permissionsData, setPermissionsData] = useState<PermissionsData>({
    permissions: [],
    permissionNames: [],
    permissionMap: {} as Record<PermissionIdentifier, boolean>,
  });

  const [isLoading, setIsLoading] = useState(true);

  const trpc = useTRPC();

  // Query user permissions using tRPC
  const { data, refetch } = useQuery(trpc.auth.getMyPermissions.queryOptions());

  // Update state when data changes
  useEffect(() => {
    if (data) {
      setPermissionsData(data as unknown as PermissionsData);
      setIsLoading(false);
    }
  }, [data]);

  // Reload function
  const reloadPermissions = async () => {
    setIsLoading(true);
    await refetch();
  };

  // Helper function to check if user has a permission
  const hasPermission = (permission: PermissionIdentifier) => {
    // Handle loading state - if permissions haven't loaded, assume no permission
    if (isLoading) return false;

    // Use the client-side utility
    return checkPermission(permissionsData.permissionMap, permission);
  };

  // Helper function to check if user has any of the provided permissions
  const hasAnyPermission = (permissions: PermissionIdentifier[]) => {
    // Handle empty array or loading state
    if (permissions.length === 0 || isLoading) return false;

    // Check each permission, return true on first match
    return permissions.some((permission) =>
      checkPermission(permissionsData.permissionMap, permission)
    );
  };

  // Value to provide
  const value = {
    ...permissionsData,
    isLoading,
    hasPermission,
    hasAnyPermission,
    reloadPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

// Custom hook to use the context
export function usePermissions() {
  const context = useContext(PermissionContext);

  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }

  return context;
}

// Helper component for conditional rendering based on permissions
interface RequirePermissionProps {
  permission: PermissionIdentifier;
  children: ReactNode;
  fallback?: ReactNode;
}

function RequirePermission({
  permission,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const { hasPermission } = usePermissions();

  // Validate the permission using client-safe utility
  if (!isValidPermissionId(permission)) {
    console.warn(`Invalid permission identifier: ${permission}`);
    return <>{fallback}</>;
  }

  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}

// Helper component for conditional rendering based on multiple permissions
interface RequireAnyPermissionProps {
  permissions: PermissionIdentifier[];
  children: ReactNode;
  fallback?: ReactNode;
}

function RequireAnyPermission({
  permissions,
  children,
  fallback = null,
}: RequireAnyPermissionProps) {
  const { hasAnyPermission } = usePermissions();

  // Validate permissions
  if (permissions.length === 0) {
    console.warn("Empty permissions array provided to RequireAnyPermission");
    return <>{fallback}</>;
  }

  // Check if any permission is invalid
  const invalidPermissions = permissions.filter((p) => !isValidPermissionId(p));
  if (invalidPermissions.length > 0) {
    console.warn(
      `Invalid permission identifiers: ${invalidPermissions.join(", ")}`
    );
    return <>{fallback}</>;
  }

  return hasAnyPermission(permissions) ? <>{children}</> : <>{fallback}</>;
}

export { RequirePermission, RequireAnyPermission, PermissionProvider };
