import { ReactNode, Children, isValidElement } from "react";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/lib/auth";
import { authorizationService } from "~/lib/services";
import { PermissionIdentifier } from "@repo/db";
import { isPublicPath } from "../utils/path-utils";
import { headers } from "next/headers";

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
interface PermissionGateProps {
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
 * Server-side permission gate component that checks user permissions
 * and renders appropriate content based on authorization status.
 * This component completely handles permission checking on the server.
 */
export async function PermissionGate({
  permission,
  permissions,
  publicPaths,
  allowGuests = false,
  children,
}: PermissionGateProps) {
  // Validate parameters
  if (permission && permissions) {
    throw new Error(
      "PermissionGate requires either 'permission' or 'permissions' prop, not both."
    );
  }
  if (!permission && !permissions) {
    throw new Error(
      "PermissionGate requires either 'permission' or 'permissions' prop."
    );
  }

  let isPublic = false;

  if (publicPaths) {
    // Get the current pathname from the request headers
    const headersList = await headers();
    // Try to get the path from various headers
    const referer = headersList.get("referer") || "";
    const xUrl = headersList.get("x-url") || "";
    const pathname = referer ? new URL(referer).pathname : xUrl ? xUrl : "/";

    isPublic = isPublicPath(pathname, publicPaths);
  }

  // Get session and check auth status
  const session = await getServerAuthSession();
  const isLoggedIn = !!session?.user;
  let isAuthorized = false;

  // If path is public, user is authorized
  if (isPublic) {
    isAuthorized = true;
  }
  // If user is logged in, check permissions normally
  else if (isLoggedIn && session?.user) {
    const userId = parseInt(session.user.id);
    if (permission) {
      isAuthorized = await authorizationService.hasPermission(
        userId,
        permission
      );
    } else if (permissions) {
      isAuthorized = await authorizationService.hasAnyPermission(
        userId,
        permissions
      );
    }
  }
  // If guests are allowed, check permissions for the guest user
  else if (allowGuests) {
    if (permission) {
      isAuthorized = await authorizationService.hasPermission(
        undefined,
        permission
      );
    } else if (permissions) {
      isAuthorized = await authorizationService.hasAnyPermission(
        undefined,
        permissions
      );
    }
  }

  // Find and render the appropriate child component
  let authorizedContent: ReactNode = null;
  let unauthorizedContent: ReactNode | null = null;
  let unauthorizedRedirect: string | undefined;
  let notLoggedInContent: ReactNode | null = null;
  let notLoggedInRedirect: string | undefined;

  // Process each child to find the appropriate slot components
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    // Type checking with specific component types
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

  // Return the appropriate content based on authorization status
  if (isAuthorized) {
    return <>{authorizedContent}</>;
  } else if (isLoggedIn) {
    if (unauthorizedRedirect) {
      redirect(unauthorizedRedirect);
    }
    return unauthorizedContent ? <>{unauthorizedContent}</> : null;
  } else {
    if (notLoggedInRedirect) {
      redirect(notLoggedInRedirect);
    }
    return notLoggedInContent ? <>{notLoggedInContent}</> : null;
  }
}

// Slot components for PermissionGate
function Authorized({ children }: AuthorizedProps) {
  return <>{children}</>;
}

function Unauthorized({ children }: UnauthorizedProps) {
  return <>{children}</>;
}

function NotLoggedIn({ children }: NotLoggedInProps) {
  return <>{children}</>;
}

// Attach slot components to PermissionGate
PermissionGate.Authorized = Authorized;
PermissionGate.Unauthorized = Unauthorized;
PermissionGate.NotLoggedIn = NotLoggedIn;
