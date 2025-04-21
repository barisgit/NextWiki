import { Metadata } from "next";
import { getServerAuthSession } from "~/lib/auth";
import { redirect } from "next/navigation";
import { dbService } from "~/lib/services";
import PermissionsTable from "./permissions-table";

export const metadata: Metadata = {
  title: "Admin - Permissions | NextWiki",
  description: "Manage system permissions",
};

export default async function PermissionsPage() {
  const session = await getServerAuthSession();

  // Redirect if not logged in
  if (!session?.user) {
    redirect("/login");
  }

  // Redirect if not admin
  if (!session.user.isAdmin) {
    redirect("/");
  }

  const permissions = await dbService.permissions.getAll();

  return (
    <div className="container p-6 mx-auto">
      <h1 className="mb-6 text-3xl font-bold">Permissions Management</h1>

      <div className="p-6 rounded-lg shadow-sm bg-background-level1">
        <h2 className="mb-4 text-xl font-semibold">System Permissions</h2>
        <p className="mb-6 text-sm text-text-secondary">
          View and manage the permissions available in the system. Permissions
          can be assigned to groups to control access to various features and
          resources.
        </p>

        <PermissionsTable permissions={permissions} />
      </div>
    </div>
  );
}
