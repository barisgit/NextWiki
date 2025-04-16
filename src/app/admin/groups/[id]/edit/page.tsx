import { Metadata } from "next";
import { getServerAuthSession } from "~/lib/auth";
import { redirect } from "next/navigation";
import { dbService } from "~/lib/services";
import GroupForm from "../../group-form";
import { notFound } from "next/navigation";

interface EditGroupPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: EditGroupPageProps): Promise<Metadata> {
  const group = await dbService.groups.getById(parseInt(params.id));
  return {
    title: `Edit ${group?.name ?? "Group"} | NextWiki`,
    description: "Edit user group settings and permissions",
  };
}

export default async function EditGroupPage({ params }: EditGroupPageProps) {
  const session = await getServerAuthSession();

  // Redirect if not logged in
  if (!session?.user) {
    redirect("/login");
  }

  // Redirect if not admin
  if (!session.user.isAdmin) {
    redirect("/");
  }

  const group = await dbService.groups.getById(parseInt(params.id));
  if (!group) {
    notFound();
  }

  // Get all permissions
  const permissions = await dbService.permissions.getAll();

  // Get group permissions
  const groupPermissions = await dbService.groups.getGroupPermissions(group.id);
  const groupPermissionIds = groupPermissions.map((p) => p.id);

  // Get module restrictions
  const moduleRestrictions = await dbService.groups.getModuleRestrictions(
    group.id
  );
  const moduleRestrictionModules = moduleRestrictions.map((r) => r.module);

  // Get action restrictions
  const actionRestrictions = await dbService.groups.getActionRestrictions(
    group.id
  );
  const actionRestrictionActions = actionRestrictions.map((r) => r.action);

  return (
    <div className="container p-6 mx-auto">
      <h1 className="mb-6 text-3xl font-bold">Edit Group</h1>

      <div className="p-6 rounded-lg shadow-sm bg-card">
        <p className="mb-6 text-muted-foreground">
          Edit group settings and configure its permissions. Changes will affect
          all users in this group.
        </p>

        <GroupForm
          group={group}
          permissions={permissions}
          groupPermissions={groupPermissionIds}
          groupModuleRestrictions={moduleRestrictionModules}
          groupActionRestrictions={actionRestrictionActions}
        />
      </div>
    </div>
  );
}
