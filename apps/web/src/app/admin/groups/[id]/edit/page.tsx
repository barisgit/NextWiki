import { Metadata } from "next";
import { getServerAuthSession } from "~/lib/auth";
import { redirect } from "next/navigation";
import { dbService } from "~/lib/services";
import GroupForm from "../../group-form";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui";
import Link from "next/link";

interface EditGroupPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: EditGroupPageProps): Promise<Metadata> {
  const groupId = parseInt((await params).id);
  if (isNaN(groupId)) {
    return { title: "Invalid Group | NextWiki" };
  }
  const group = await dbService.groups.getById(groupId);
  return {
    title: `Edit ${group?.name ?? "Group"} | NextWiki`,
    description: "Edit user group settings and permissions",
  };
}

export default async function EditGroupPage({ params }: EditGroupPageProps) {
  const groupId = parseInt((await params).id);
  if (isNaN(groupId)) {
    notFound();
  }

  const session = await getServerAuthSession();

  // Redirect if not logged in
  if (!session?.user) {
    redirect("/login");
  }

  // Redirect if not admin
  if (!session.user.isAdmin) {
    redirect("/");
  }

  const group = await dbService.groups.getById(groupId);
  if (!group) {
    notFound();
  }

  // Get all permissions (already includes module and action names)
  const fetchedPermissions = await dbService.permissions.getAll();

  // Transform permissions to include the synthesized 'name' expected by GroupForm
  const permissionsForForm = fetchedPermissions.map((p) => ({
    ...p,
    name: `${p.module.name}:${p.resource}:${p.action.name}`, // Synthesize the name
  }));

  // Get group permissions
  const groupPermissions = await dbService.groups.getGroupPermissions(groupId);
  const groupPermissionIds = groupPermissions.map((p) => p.id);

  // Get module permissions
  const modulePermissions =
    await dbService.groups.getModulePermissions(groupId);
  const initialSelectedModuleIds = modulePermissions.map((p) => p.moduleId);

  // Get action permissions
  const actionPermissions =
    await dbService.groups.getActionPermissions(groupId);
  const initialSelectedActionIds = actionPermissions.map((p) => p.actionId);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center">
        <Link href="/admin/groups">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Group: {group.name}</h1>
      </div>

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
          permissions={permissionsForForm}
          groupPermissions={groupPermissionIds}
          initialSelectedModuleIds={initialSelectedModuleIds}
          initialSelectedActionIds={initialSelectedActionIds}
        />
      </div>
    </div>
  );
}
