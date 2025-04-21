import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "~/lib/auth";
import { authorizationService } from "~/lib/services";
import { db } from "~/lib/db";
import type { PermissionIdentifier } from "~/lib/permissions";
import { logger } from "~/lib/utils/logger";

interface PermissionCheckResult {
  authorized: boolean;
  userId?: number;
  errorResponse?: NextResponse;
}

/**
 * Checks if the current server-side session user has the specified permission.
 * Returns an object indicating authorization status, the user ID if authorized,
 * or an appropriate NextResponse object if unauthorized or forbidden.
 */
export async function checkServerPermission(
  permissionName: PermissionIdentifier
): Promise<PermissionCheckResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      authorized: false,
      errorResponse: new NextResponse("Unauthorized", { status: 401 }),
    };
  }

  const userId = parseInt(session.user.id as string, 10);

  // Validate user ID is a number
  if (isNaN(userId)) {
    logger.error("Invalid user ID in session:", session.user.id);
    return {
      authorized: false,
      errorResponse: new NextResponse("Unauthorized - Invalid User ID", {
        status: 401,
      }),
    };
  }

  const canAccess = await authorizationService.hasPermission(
    userId,
    permissionName
  );

  if (!canAccess) {
    // Check if user exists at all before denying, helps differentiate 401 vs 403
    const userExists = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
      columns: { id: true },
    });
    if (!userExists) {
      return {
        authorized: false,
        errorResponse: new NextResponse("Unauthorized", { status: 401 }),
      };
    }
    return {
      authorized: false,
      errorResponse: new NextResponse("Forbidden", { status: 403 }),
    };
  }

  // Authorized
  return {
    authorized: true,
    userId: userId,
  };
}
