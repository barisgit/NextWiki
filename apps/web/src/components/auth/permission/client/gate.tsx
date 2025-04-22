"use client";

import { ReactNode, Children, isValidElement, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PermissionIdentifier } from "@repo/db/client";
import { usePermissions } from "../utils/usePermissions";
import { isPublicPath } from "../utils/path-utils";
import { logger } from "~/lib/utils/logger";

// Define prop types for each slot component
interface AuthorizedProps {
  children: ReactNode;
}

interface UnauthorizedProps {
  children: ReactNode;
  redirectTo?: string;
}

interface NotLoggedInProps {
  children: ReactNode;
  redirectTo?: string;
}

// Main component props
interface ClientPermissionGateProps {
  /**
   * The permission to check for.
   */
  permission?: PermissionIdentifier;

  /**
   * The permissions to check for, needs any to be true.
   */
  permissions?: PermissionIdentifier[];

  /**
   * Paths that are exempt from the permission check.
   */
  publicPaths?: string[];

  /**
   * Whether to allow guest access (non-authenticated users)
   */
  allowGuests?: boolean;

  /**
   * The children to render
   */
  children: ReactNode;
}

/**
 * Client-side permission gate component that checks user permissions
 * and renders appropriate content based on authorization status.
 * This creates UI-level access control but does not provide actual security.
 */
export function ClientPermissionGate({
  permission,
  permissions,
  publicPaths,
  allowGuests = false,
  children,
}: ClientPermissionGateProps) {
  // Get permission state from context
  const { hasPermission, hasAnyPermission, isGuest, isLoading } =
    usePermissions();
  const pathname = usePathname();
  const router = useRouter();

  // Initialize variables to store content and redirects
  let authorizedContent: ReactNode = null;
  let unauthorizedContent: ReactNode | null = null;
  let unauthorizedRedirect: string | undefined;
  let notLoggedInContent: ReactNode | null = null;
  let notLoggedInRedirect: string | undefined;
  let shouldRender = true;
  let isAuthorized = false;
  const isLoggedIn = !isGuest;

  // Process each child to find the appropriate slot components
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    // Type assertion with specific component types
    if (child.type === Authorized) {
      const props = child.props as AuthorizedProps;
      authorizedContent = props.children;
    } else if (child.type === Unauthorized) {
      const props = child.props as UnauthorizedProps;
      unauthorizedContent = props.children;
      unauthorizedRedirect = props.redirectTo;
    } else if (child.type === NotLoggedIn) {
      const props = child.props as NotLoggedInProps;
      notLoggedInContent = props.children;
      notLoggedInRedirect = props.redirectTo;
    }
  });

  // Validate parameters - we set a flag but don't return early
  if (permission && permissions) {
    logger.error(
      "ClientPermissionGate requires either 'permission' or 'permissions' prop, not both."
    );
    shouldRender = false;
  }
  if (!permission && !permissions) {
    logger.error(
      "ClientPermissionGate requires either 'permission' or 'permissions' prop."
    );
    shouldRender = false;
  }

  // Check if path is public
  const isPublic = isPublicPath(pathname, publicPaths);

  // Determine if user is authorized
  if (isPublic) {
    isAuthorized = true;
  } else if (isGuest && !allowGuests) {
    isAuthorized = false;
  } else if (permission) {
    isAuthorized = hasPermission(permission);
  } else if (permissions) {
    isAuthorized = hasAnyPermission(permissions);
  }

  // Handle redirects with useEffect - this is now unconditional
  useEffect(() => {
    if (!isLoading && shouldRender) {
      if (!isLoggedIn && notLoggedInRedirect) {
        router.push(notLoggedInRedirect);
      } else if (isLoggedIn && !isAuthorized && unauthorizedRedirect) {
        router.push(unauthorizedRedirect);
      }
    }
  }, [
    isLoading,
    shouldRender,
    isLoggedIn,
    isAuthorized,
    notLoggedInRedirect,
    unauthorizedRedirect,
    router,
  ]);

  // Return early if validation failed
  if (!shouldRender) {
    return null;
  }

  // Return the appropriate content based on authorization status
  if (isLoading) {
    // Optional: Return a loading state or early null to prevent flashes
    return null;
  } else if (isAuthorized) {
    return <>{authorizedContent}</>;
  } else if (isLoggedIn) {
    return unauthorizedContent ? <>{unauthorizedContent}</> : null;
  } else {
    return notLoggedInContent ? <>{notLoggedInContent}</> : null;
  }
}

// Slot components for ClientPermissionGate
function Authorized({ children }: AuthorizedProps) {
  return <>{children}</>;
}

function Unauthorized({ children }: UnauthorizedProps) {
  return <>{children}</>;
}

function NotLoggedIn({ children }: NotLoggedInProps) {
  return <>{children}</>;
}

// Attach slot components to ClientPermissionGate
ClientPermissionGate.Authorized = Authorized;
ClientPermissionGate.Unauthorized = Unauthorized;
ClientPermissionGate.NotLoggedIn = NotLoggedIn;
