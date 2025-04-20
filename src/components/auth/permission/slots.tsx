"use client";

import { useRouter, usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { usePermissionContext } from "./context";

/** Helper function to check if current path is public */
function isPublicPath(pathname: string, publicPaths?: string[]): boolean {
  if (!publicPaths || publicPaths.length === 0) {
    return false;
  }

  return publicPaths.some((publicPath) => {
    if (publicPath.endsWith("*")) {
      // Wildcard match: check if pathname starts with the prefix
      const prefix = publicPath.slice(0, -1);
      // Ensure the prefix match is at a path segment boundary or exact match
      return pathname.startsWith(prefix);
    } else {
      // Exact match
      return pathname === publicPath;
    }
  });
}

// --- Authorized Slot ---
interface AuthorizedProps {
  children: ReactNode;
}

/**
 * Renders children if the user is logged in AND authorized,
 * OR if the user is a guest AND authorized,
 * OR if the current path is in publicPaths from context.
 */
export function Authorized({ children }: AuthorizedProps) {
  const { isLoggedIn, isAuthorized, isGuest, publicPaths } =
    usePermissionContext();
  const pathname = usePathname();
  const isPublic = isPublicPath(pathname, publicPaths);

  // Render if public OR if (logged in OR guest) AND authorized
  return isPublic || (isAuthorized && (isLoggedIn || isGuest)) ? (
    <>{children}</>
  ) : null;
}

// --- Unauthorized Slot ---
interface UnauthorizedProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Renders children only if the user is logged in BUT NOT authorized,
 * AND the current path is NOT in publicPaths from context.
 * Optionally redirects the user if `redirectTo` is provided.
 */
export function Unauthorized({ children, redirectTo }: UnauthorizedProps) {
  const { isLoggedIn, isAuthorized, publicPaths } = usePermissionContext();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = isPublicPath(pathname, publicPaths);

  // User is present (logged in or guest) but not authorized
  const shouldRender = !isPublic && isLoggedIn && !isAuthorized;

  useEffect(() => {
    // Redirect only applies if this component is active (shouldRender is true)
    if (shouldRender && redirectTo) {
      router.push(redirectTo);
    }
    // Dependencies need to include all factors affecting shouldRender and redirectTo
  }, [shouldRender, redirectTo, router]);

  // Render fallback content only if it should render (and maybe until redirection happens)
  return shouldRender ? <>{children}</> : null;
}

// --- NotLoggedIn Slot ---
interface NotLoggedInProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Renders children only if the user is NOT logged in AND is NOT a guest with permissions,
 * AND the current path is NOT in publicPaths from context.
 * Optionally redirects the user if `redirectTo` is provided.
 *
 * Note: This is rarely used with guest permissions, as guests would be treated similarly
 * to logged-in users if they have access permissions.
 */
export function NotLoggedIn({ children, redirectTo }: NotLoggedInProps) {
  const { isLoggedIn, isAuthorized, publicPaths } = usePermissionContext();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = isPublicPath(pathname, publicPaths);

  // Only show this if not a public path, not logged in, and the guest is not authorized
  const shouldRender = !isPublic && !isLoggedIn && !isAuthorized;

  useEffect(() => {
    // Redirect only applies if this component is active (shouldRender is true)
    if (shouldRender && redirectTo) {
      router.push(redirectTo);
    }
    // Dependencies need to include all factors affecting shouldRender and redirectTo
  }, [shouldRender, redirectTo, router]);

  // Render fallback content only if it should render (and maybe until redirection happens)
  return shouldRender ? <>{children}</> : null;
}
