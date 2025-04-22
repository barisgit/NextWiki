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

  // Get module permissions
  const modulePermissions = await dbService.groups.getModulePermissions(
    group.id
  );
  const modulePermissionModules = modulePermissions.map((p) => p.module);

  // Get action permissions
  const actionPermissions = await dbService.groups.getActionPermissions(
    group.id
  );
  const actionPermissionActions = actionPermissions.map((p) => p.action);

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Edit Group</h1>

      <div className="bg-card rounded-lg p-6 shadow-sm">
        <p className="text-muted-foreground mb-6">
          Edit group settings and configure its permissions. Changes will affect
          all users in this group.
        </p>

        <GroupForm
          group={{
            ...group,
            isSystem: group.isSystem === null ? undefined : group.isSystem,
            isEditable:
              group.isEditable === null ? undefined : group.isEditable,
            allowUserAssignment:
              group.allowUserAssignment === null
                ? undefined
                : group.allowUserAssignment,
          }}
          permissions={permissions}
          groupPermissions={groupPermissionIds}
          groupModulePermissions={modulePermissionModules}
          groupActionPermissions={actionPermissionActions}
        />
      </div>
    </div>
  );
}
