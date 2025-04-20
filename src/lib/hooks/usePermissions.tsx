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
import { useSession } from "next-auth/react";

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

  // Guest state (not authenticated)
  isGuest: boolean;

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
  isGuest: false,
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
  const { status: authStatus } = useSession();
  const trpc = useTRPC();

  // Determine if user is a guest
  const isGuest = authStatus === "unauthenticated";

  // Query user permissions using tRPC
  const { data: authUserData, refetch: refetchAuthUser } = useQuery(
    trpc.auth.getMyPermissions.queryOptions()
  );

  // Combine data and refetch based on auth status
  const data = authUserData;
  const refetch = refetchAuthUser;

  // Update state when data changes
  useEffect(() => {
    if (data) {
      setPermissionsData(data as unknown as PermissionsData);
      setIsLoading(false);
    }
  }, [data]);

  // Reload function - will fetch either guest or user permissions based on auth state
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
    isLoading: isLoading || authStatus === "loading",
    isGuest,
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
  allowGuests?: boolean;
}

function RequirePermission({
  permission,
  children,
  fallback = null,
  allowGuests = false,
}: RequirePermissionProps) {
  const { hasPermission, isGuest } = usePermissions();

  // Validate the permission using client-safe utility
  if (!isValidPermissionId(permission)) {
    console.warn(`Invalid permission identifier: ${permission}`);
    return <>{fallback}</>;
  }

  // If user is a guest and guests are not allowed, show fallback
  if (isGuest && !allowGuests) {
    return <>{fallback}</>;
  }

  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}

// Helper component for conditional rendering based on multiple permissions
interface RequireAnyPermissionProps {
  permissions: PermissionIdentifier[];
  children: ReactNode;
  fallback?: ReactNode;
  allowGuests?: boolean;
}

function RequireAnyPermission({
  permissions,
  children,
  fallback = null,
  allowGuests = false,
}: RequireAnyPermissionProps) {
  const { hasAnyPermission, isGuest } = usePermissions();

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

  // If user is a guest and guests are not allowed, show fallback
  if (isGuest && !allowGuests) {
    return <>{fallback}</>;
  }

  return hasAnyPermission(permissions) ? <>{children}</> : <>{fallback}</>;
}

export { RequirePermission, RequireAnyPermission, PermissionProvider };
