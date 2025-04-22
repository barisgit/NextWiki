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
        <div className="flex h-screen w-full items-center justify-center">
          <div className="rounded-lg bg-red-50 p-8 text-center shadow-md dark:bg-red-900/20">
            <h2 className="mb-4 text-2xl font-bold text-red-500">
              Admin Access Denied
            </h2>
            <p>You do not have permission to access this area.</p>
          </div>
        </div>
      </PermissionGate.Unauthorized>
      <PermissionGate.NotLoggedIn redirectTo="/login">
        {/* Optional: Show a specific loading/redirect message */}
        <div className="flex h-screen w-full items-center justify-center">
          <Skeleton className="h-full w-full" />
        </div>
      </PermissionGate.NotLoggedIn>
    </PermissionGate>
  );
}
