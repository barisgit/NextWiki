"use client";

import Link from "next/link";
import {
  usePermissions,
  RequirePermission,
  RequireAnyPermission,
} from "~/lib/hooks/usePermissions";

export function PermissionsExample() {
  const { hasPermission, hasAnyPermission, isLoading } = usePermissions();

  // Example permissions
  const canViewWikiPages = hasPermission("wiki:page:read");
  const canEditOrCreatePages = hasAnyPermission([
    "wiki:page:create",
    "wiki:page:update",
  ]);

  // If still loading permissions, show a loading state
  if (isLoading) {
    return <div className="text-sm">Loading permissions...</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Using the hooks directly */}
      {canViewWikiPages && (
        <Link
          href="/wiki"
          className="flex items-center px-3 py-2 text-sm font-medium text-white transition-colors rounded-md bg-primary hover:bg-primary-600"
        >
          View Wiki
        </Link>
      )}

      {canEditOrCreatePages && (
        <Link
          href="/create"
          className="flex items-center px-3 py-2 text-sm font-medium text-white transition-colors rounded-md bg-secondary hover:bg-secondary-600"
        >
          Edit or Create Pages
        </Link>
      )}

      {/* Using the component approach */}
      <RequirePermission permission="system:settings:read">
        <Link
          href="/admin/settings"
          className="flex items-center px-3 py-2 text-sm font-medium text-white transition-colors rounded-md bg-accent hover:bg-accent-600"
        >
          Settings
        </Link>
      </RequirePermission>

      <RequireAnyPermission
        permissions={["system:users:read", "system:groups:read"]}
      >
        <Link
          href="/admin/users"
          className="flex items-center px-3 py-2 text-sm font-medium text-white transition-colors rounded-md bg-warning hover:bg-warning-600"
        >
          User Management
        </Link>
      </RequireAnyPermission>
    </div>
  );
}
