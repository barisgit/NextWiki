"use client";

import Link from "next/link";
import {
  usePermissions,
  ClientRequirePermission,
} from "~/components/auth/permission/client";

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
          className="bg-primary hover:bg-primary-600 flex items-center rounded-md px-3 py-2 text-sm font-medium text-white transition-colors"
        >
          View Wiki
        </Link>
      )}

      {canEditOrCreatePages && (
        <Link
          href="/create"
          className="bg-secondary hover:bg-secondary-600 flex items-center rounded-md px-3 py-2 text-sm font-medium text-white transition-colors"
        >
          Edit or Create Pages
        </Link>
      )}

      {/* Using the component approach */}
      <ClientRequirePermission permission="system:settings:read">
        <Link
          href="/admin/settings"
          className="bg-accent hover:bg-accent-600 flex items-center rounded-md px-3 py-2 text-sm font-medium text-white transition-colors"
        >
          Settings
        </Link>
      </ClientRequirePermission>

      <ClientRequirePermission
        permissions={["system:users:read", "system:groups:read"]}
      >
        <Link
          href="/admin/users"
          className="bg-warning hover:bg-warning-600 flex items-center rounded-md px-3 py-2 text-sm font-medium text-white transition-colors"
        >
          User Management
        </Link>
      </ClientRequirePermission>
    </div>
  );
}
