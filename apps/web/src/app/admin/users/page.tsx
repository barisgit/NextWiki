"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Input,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui";
import { useTRPC } from "~/server/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  usePermissions,
  ClientRequirePermission,
} from "~/components/auth/permission/client";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { logger } from "~/lib/utils/logger";

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { hasPermission } = usePermissions();

  // Fetch users
  const trpc = useTRPC();
  const { data: users, isLoading: usersLoading } = useQuery(
    trpc.users.getAll.queryOptions()
  );

  // Infer user type from the fetched data
  type FetchedUser = NonNullable<typeof users>[number];

  const [selectedUser, setSelectedUser] = useState<FetchedUser | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);

  // Fetch all groups
  const { data: groups, isLoading: groupsLoading } = useQuery(
    trpc.groups.getAll.queryOptions()
  );

  // Mutations
  const addToGroupMutation = useMutation(
    trpc.groups.addUsers.mutationOptions({
      onSuccess: () => {
        toast.success("User groups updated successfully");
        //   refetchUserGroups(); // Consider refetching user data here if needed
      },
      onError: (error) => {
        toast.error(`Failed to update groups: ${error.message}`);
      },
    })
  );

  const removeFromGroupMutation = useMutation(
    trpc.groups.removeUsers.mutationOptions({
      onSuccess: () => {
        toast.success("User removed from group successfully");
        //   refetchUserGroups(); // Consider refetching user data here if needed
      },
      onError: (error) => {
        toast.error(`Failed to remove from group: ${error.message}`);
      },
    })
  );

  // Set initial selected groups when user is selected
  useEffect(() => {
    if (selectedUser) {
      setSelectedGroups(
        selectedUser.userGroups.map((group) => group.groupId) || []
      );
    } else {
      setSelectedGroups([]);
    }
  }, [selectedUser]);

  // Filter users based on search term
  const filteredUsers =
    users?.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Update function signature to use inferred type
  const handleUserSelect = (user: FetchedUser) => {
    setSelectedUser(user);
  };

  // Handle group checkbox change
  const handleGroupChange = (groupId: number, checked: boolean) => {
    setSelectedGroups((prev) =>
      checked ? [...prev, groupId] : prev.filter((id) => id !== groupId)
    );
  };

  // Save group assignments
  const handleSaveGroupAssignments = async () => {
    if (!selectedUser) return;

    const currentGroups = selectedUser.userGroups.map((g) => g.groupId) || [];
    const groupsToAdd = selectedGroups.filter(
      (id) => !currentGroups.includes(id)
    );
    const groupsToRemove = currentGroups.filter(
      (id) => !selectedGroups.includes(id)
    );

    try {
      if (groupsToAdd.length > 0) {
        await Promise.all(
          groupsToAdd.map((groupId) =>
            addToGroupMutation.mutateAsync({
              groupId,
              userIds: [selectedUser.id],
            })
          )
        );
      }

      if (groupsToRemove.length > 0) {
        await Promise.all(
          groupsToRemove.map((groupId) =>
            removeFromGroupMutation.mutateAsync({
              groupId,
              userIds: [selectedUser.id],
            })
          )
        );
      }
      // Optional: Refetch user data after successful save
      // await utils.users.getAll.invalidate(); // Or invalidate specific user
      // handleUserSelect(updatedUserData); // Update selectedUser if data structure changes significantly post-save
    } catch (error) {
      // Errors are handled by individual mutation's onError, but you could add general handling here
      logger.error("Failed to save group assignments:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">User Management</h1>
          <ClientRequirePermission permission="system:users:create">
            <Button
              onClick={() => toast.info("Create user not implemented yet.")}
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              Create User
            </Button>
          </ClientRequirePermission>
        </div>
        <p className="text-text-secondary">
          Manage users and group assignments
        </p>
      </div>

      <div className="flex space-x-4">
        <div className="w-2/3">
          <Card className="p-6">
            <div className="mb-4">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                className="w-full"
              />
            </div>

            <div className="overflow-x-auto">
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="border-primary inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-border-default border-b">
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Admin</th>
                      <th className="px-4 py-2 text-left">Groups</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={`border-border-light hover:bg-background-level3 cursor-pointer border-b ${
                          selectedUser?.id === user.id ? "bg-primary/10" : ""
                        }`}
                        onClick={() => handleUserSelect(user)} // This should now work
                      >
                        <td className="px-4 py-3">{user.name}</td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3">
                          {/* Use groupId for the check */}
                          {user.userGroups.some(
                            (group) => group.groupId === 1 // Assuming Admin group ID is 1
                          ) ? (
                            <span className="bg-primary-100 text-primary-800 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
                              Admin
                            </span>
                          ) : (
                            <span className="bg-background-level2 text-text-secondary inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
                              User
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {/* Access group name correctly */}
                            {user.userGroups?.map((ug) => (
                              <span
                                key={ug.groupId}
                                className="bg-accent-100 text-accent-800 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                              >
                                {ug.group.name}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

        <div className="w-1/3">
          {selectedUser ? (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-medium">User Details</h2>

              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="groups">Groups</TabsTrigger>
                  {/* <TabsTrigger value="permissions">Permissions</TabsTrigger> */}
                </TabsList>

                <TabsContent value="details" className="mt-4 space-y-4">
                  <div>
                    <p className="text-text-secondary text-sm">Name</p>
                    <p className="font-medium">{selectedUser.name}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm">Role</p>
                    <p className="font-medium">
                      {/* Use groupId for the check */}
                      {selectedUser.userGroups.some(
                        (group) => group.groupId === 1 // Assuming Admin group ID is 1
                      )
                        ? "Administrator"
                        : "Regular User"}
                    </p>
                  </div>
                  <div className="space-y-2 pt-4">
                    <ClientRequirePermission permission="system:users:update">
                      <Button
                        className="w-full"
                        variant="outlined"
                        onClick={() =>
                          toast.info("Password reset not implemented yet.")
                        }
                      >
                        Reset Password
                      </Button>
                    </ClientRequirePermission>
                    <ClientRequirePermission permission="system:users:delete">
                      <Button
                        className="w-full"
                        variant="destructive"
                        onClick={() =>
                          toast.info("Delete user not implemented yet.")
                        }
                      >
                        <TrashIcon className="mr-2 h-5 w-5" />
                        Delete User
                      </Button>
                    </ClientRequirePermission>
                  </div>
                </TabsContent>

                <TabsContent value="groups" className="mt-4">
                  <p className="text-text-secondary mb-2 text-sm">
                    User Group Memberships
                  </p>

                  {groupsLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="border-primary inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    </div>
                  ) : (
                    <div className="mb-4 space-y-2">
                      {groups?.map((group) => (
                        <div key={group.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`group-${group.id}`}
                            // Use selectedGroups state which holds IDs
                            checked={selectedGroups.includes(group.id)}
                            className="mr-2"
                            onChange={(e) =>
                              handleGroupChange(group.id, e.target.checked)
                            }
                            disabled={
                              !hasPermission("system:users:update") ||
                              (group.isSystem ?? false)
                            }
                          />
                          <label
                            htmlFor={`group-${group.id}`}
                            className={`flex flex-col ${
                              group.isSystem
                                ? "cursor-not-allowed opacity-60"
                                : ""
                            }`}
                          >
                            <span>{group.name}</span>
                            {group.description && (
                              <span className="text-text-secondary text-xs">
                                {group.description}
                              </span>
                            )}
                            {group.isSystem && (
                              <span className="text-destructive text-xs">
                                (Locked)
                              </span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  <ClientRequirePermission
                    permission="system:users:update"
                    fallback={
                      <Button
                        variant="default"
                        className="w-full"
                        disabled={true}
                      >
                        Save Group Assignments
                      </Button>
                    }
                  >
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={handleSaveGroupAssignments}
                      disabled={
                        addToGroupMutation.isPending ||
                        removeFromGroupMutation.isPending ||
                        JSON.stringify(selectedGroups.sort()) ===
                          JSON.stringify(
                            selectedUser.userGroups.map((g) => g.groupId).sort()
                          )
                      }
                    >
                      {addToGroupMutation.isPending ||
                      removeFromGroupMutation.isPending
                        ? "Saving..."
                        : "Save Group Assignments"}
                    </Button>
                  </ClientRequirePermission>
                </TabsContent>

                <TabsContent value="permissions" className="mt-4">
                  <p className="mb-4 text-sm">
                    Permissions are assigned through groups. Assign this user to
                    the appropriate groups to grant permissions.
                  </p>

                  <div className="bg-background-level1 rounded p-3">
                    <h3 className="mb-2 font-medium">
                      Current Permissions (via Groups)
                    </h3>
                    {selectedUser.userGroups?.length ? (
                      <div className="space-y-3">
                        {selectedUser.userGroups.map((ug) => (
                          <div key={ug.groupId}>
                            <h4 className="text-sm font-medium">
                              {ug.group.name}
                            </h4>
                            <p className="text-text-secondary pl-2 text-xs italic">
                              (Permissions must be viewed on the Groups page or
                              fetched separately)
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-text-secondary text-sm">
                        No permissions assigned via groups
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          ) : (
            <Card className="text-text-secondary flex h-full flex-col items-center justify-center p-6 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="text-muted-foreground mb-4 h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <p>Select a user to view and edit details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
