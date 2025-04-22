import { Metadata } from "next";
import { getServerAuthSession } from "~/lib/auth";
import { redirect } from "next/navigation";
import { dbService } from "~/lib/services";
import GroupForm from "../group-form";

export const metadata: Metadata = {
  title: "Create New Group | NextWiki",
  description: "Create a new user group",
};

export default async function NewGroupPage() {
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
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Create New Group</h1>

      <div className="bg-card rounded-lg p-6 shadow-sm">
        <p className="text-muted-foreground mb-6">
          Create a new user group and configure its permissions. Groups allow
          you to organize users and assign permissions to them collectively.
        </p>

        <GroupForm permissions={permissions} />
      </div>
    </div>
  );
}
