"use client";

import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Pencil, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "~/lib/trpc/providers";

interface GroupsListProps {
  groups: {
    id: number;
    name: string;
    description: string | null;
    isLocked: boolean;
  }[];
}

export default function GroupsList({ groups: initialGroups }: GroupsListProps) {
  const deleteGroup = api.groups.delete.useMutation({
    onSuccess: () => {
      toast.success("Group deleted successfully");
      // Refresh the page to get updated data
      window.location.reload();
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    },
  });

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      await deleteGroup.mutate({ id });
    }
  };

  return (
    <div className="border rounded-md">
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
          {/* TODO: Later when we have a way to update the groups list, we can use the useState hook to update the groups list */}
          {initialGroups.map((group) => (
            <TableRow key={group.id}>
              <TableCell className="font-medium">{group.name}</TableCell>
              <TableCell>{group.description}</TableCell>
              <TableCell>
                {group.isLocked ? (
                  <Badge variant="secondary">System Group</Badge>
                ) : (
                  <Badge variant="outline">Custom Group</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/admin/groups/${group.id}/users`}>
                    <Button variant="ghost" size="icon">
                      <Users className="w-4 h-4" />
                    </Button>
                  </Link>
                  {!group.isLocked && (
                    <>
                      <Link href={`/admin/groups/${group.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(group.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
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
