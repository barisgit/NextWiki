import { Metadata } from "next";
import { getServerAuthSession } from "~/lib/auth";
import { redirect } from "next/navigation";
import { dbService, authorizationService } from "~/lib/services";
import GroupsList from "./groups-list";
import Link from "next/link";
import { Button } from "@repo/ui";

export const metadata: Metadata = {
  title: "Admin - Groups | NextWiki",
  description: "Manage user groups",
};

export default async function GroupsPage() {
  const session = await getServerAuthSession();

  // Redirect if not logged in
  if (!session?.user) {
    redirect("/login");
  }

  // Redirect if not admin
  if (!session.user.isAdmin) {
    redirect("/");
  }

  const groups = await dbService.groups.getAll();

  // Ensure isLocked is always a boolean
  const formattedGroups = groups.map((group) => ({
    ...group,
    isSystem: group.isSystem ?? false,
    isEditable: group.isEditable ?? true,
    allowUserAssignment: group.allowUserAssignment ?? true,
  }));

  const canCreateGroups = await authorizationService.hasPermission(
    parseInt(session.user.id, 10),
    "system:groups:create"
  );

  return (
    <div className="container p-6 mx-auto">
      <h1 className="mb-6 text-3xl font-bold">Groups Management</h1>

      <div className="p-6 rounded-lg shadow-sm bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">User Groups</h2>
          {canCreateGroups && (
            <Button asChild>
              <Link href="/admin/groups/new">Create Group</Link>
            </Button>
          )}
        </div>
        <p className="mb-6 text-muted-foreground">
          User groups allow you to organize users and assign permissions to them
          collectively. Each group can have multiple permissions, and users can
          belong to multiple groups.
        </p>

        <GroupsList groups={formattedGroups} />
      </div>
    </div>
  );
}
