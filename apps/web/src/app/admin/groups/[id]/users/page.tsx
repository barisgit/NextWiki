import { Metadata } from "next";
import { getServerAuthSession } from "~/lib/auth";
import { redirect } from "next/navigation";
import { dbService } from "~/lib/services";
import Link from "next/link";
import { Button } from "@repo/ui";
import { ArrowLeft } from "lucide-react";
import RemoveUserModal from "./remove-user-modal";
import AddUsersModal from "./add-users-modal";

export const metadata: Metadata = {
  title: "Admin - Group Users | NextWiki",
  description: "Manage users in a group",
};

export default async function GroupUsersPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerAuthSession();

  // Redirect if not logged in
  if (!session?.user) {
    redirect("/login");
  }

  // Redirect if not admin
  if (!session.user.isAdmin) {
    redirect("/");
  }

  const groupId = parseInt(params.id);
  const group = await dbService.groups.getById(groupId);

  if (!group) {
    redirect("/admin/groups");
  }

  const users = await dbService.groups.getGroupUsers(groupId);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center">
        <Link href="/admin/groups">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Group Members: {group.name}</h1>
      </div>

      <div className="bg-background-level1 rounded-lg p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Users in this group</h2>
          <AddUsersModal groupId={groupId} groupName={group.name} />
        </div>
        <p className="text-text-secondary mb-6 text-sm">
          Users in this group inherit all permissions assigned to the group. You
          can add or remove users from this group.
        </p>

        {users.length > 0 ? (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3 text-right">
                      <RemoveUserModal
                        groupId={groupId}
                        userId={user.id}
                        userName={user.name || "User"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-secondary py-6 text-center">
            No users in this group yet.
          </p>
        )}
      </div>
    </div>
  );
}
