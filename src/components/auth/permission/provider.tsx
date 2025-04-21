"use client";

import { ReactNode, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTRPC } from "~/server/client";
import { useQuery } from "@tanstack/react-query";
import { checkPermission } from "~/lib/permissions/client";
import { PermissionIdentifier } from "~/lib/permissions";
import { PermissionContext, Permission } from "./utils/context";

// Define the permissions data structure returned by the API
interface PermissionsData {
  permissions: Permission[];
  permissionNames: PermissionIdentifier[];
  permissionMap: Record<PermissionIdentifier, boolean>;
}

// Provider component
export function PermissionProvider({ children }: { children: ReactNode }) {
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

    console.log("permissionsData", data);
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
    isAuthenticated: authStatus === "authenticated",
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}
