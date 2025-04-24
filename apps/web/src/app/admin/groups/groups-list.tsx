"use client";

import { Button } from "@repo/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import { Badge } from "@repo/ui";
import { Eye, Pencil, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTRPC } from "~/server/client";
import { useMutation } from "@tanstack/react-query";
import { ClientRequirePermission } from "~/components/auth/permission/client";

interface GroupsListProps {
  groups: {
    id: number;
    name: string;
    description: string | null;
    isSystem: boolean;
    isEditable: boolean;
    allowUserAssignment: boolean;
  }[];
}

export default function GroupsList({ groups: initialGroups }: GroupsListProps) {
  const trpc = useTRPC();

  const deleteGroup = useMutation(
    trpc.admin.groups.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Group deleted successfully");
        // Refresh the page to get updated data
        window.location.reload();
      },
    })
  );

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      await deleteGroup.mutate({ id });
    }
  };

  return (
    <div className="border-border rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialGroups.map((group) => (
            <TableRow key={group.id}>
              <TableCell className="font-medium">{group.name}</TableCell>
              <TableCell>{group.description}</TableCell>
              <TableCell>
                {group.isSystem ? (
                  <Badge
                    variant="outline"
                    color={group.name === "Administrators" ? "primary" : "info"}
                  >
                    System Group
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    color={group.name === "Viewers" ? "accent" : undefined}
                  >
                    Custom Group
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <ClientRequirePermission permission="system:groups:update">
                    {group.allowUserAssignment && (
                      <Link href={`/admin/groups/${group.id}/users`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Manage Users"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </ClientRequirePermission>
                  <ClientRequirePermission permission="system:groups:update">
                    <Link href={`/admin/groups/${group.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={
                          group.name === "Administrators" ? "View" : "Edit"
                        }
                      >
                        {group.name === "Administrators" ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <Pencil className="h-4 w-4" />
                        )}
                      </Button>
                    </Link>
                  </ClientRequirePermission>
                  {!group.isSystem && (
                    <ClientRequirePermission permission="system:groups:delete">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(group.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </ClientRequirePermission>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
