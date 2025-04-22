import { PermissionGate } from "~/components/auth/permission/server";
import { Skeleton } from "@repo/ui";
import { AdminLayout } from "~/components/layout/AdminLayout";

export default async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionGate
      permission="system:settings:read" // Use this permission for general admin access
    >
      <PermissionGate.Authorized>
        <AdminLayout>{children}</AdminLayout>
      </PermissionGate.Authorized>
      <PermissionGate.Unauthorized redirectTo="/">
        <div className="flex items-center justify-center w-full h-screen">
          <div className="p-8 text-center rounded-lg shadow-md bg-red-50 dark:bg-red-900/20">
            <h2 className="mb-4 text-2xl font-bold text-red-500">
              Admin Access Denied
            </h2>
            <p>You do not have permission to access this area.</p>
          </div>
        </div>
      </PermissionGate.Unauthorized>
      <PermissionGate.NotLoggedIn redirectTo="/login">
        {/* Optional: Show a specific loading/redirect message */}
        <div className="flex items-center justify-center w-full h-screen">
          <Skeleton className="w-full h-full" />
        </div>
      </PermissionGate.NotLoggedIn>
    </PermissionGate>
  );
}
