"use client";

import { useState } from "react";
import { UserPlus, Loader2, Search } from "lucide-react";
import { Button, Modal, Input, Checkbox } from "@repo/ui";
import { useTRPC } from "~/server/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface AddUsersModalProps {
  groupId: number;
  groupName: string;
}

export default function AddUsersModal({
  groupId,
  groupName,
}: AddUsersModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const trpc = useTRPC();

  // Get all users
  const { data: allUsers, isLoading: loadingUsers } = useQuery(
    trpc.users.getAll.queryOptions(undefined, {
      enabled: isModalOpen,
    })
  );

  // Get existing group users to exclude them
  const { data: groupUsers } = useQuery(
    trpc.groups.getGroupUsers.queryOptions(
      { groupId },
      {
        enabled: isModalOpen,
      }
    )
  );

  // Filter users that are not in the group already and match the search query
  const filteredUsers = allUsers?.filter((user) => {
    // Filter out users already in the group
    const alreadyInGroup = groupUsers?.some(
      (groupUser) => groupUser.id === user.id
    );
    if (alreadyInGroup) return false;

    // Filter by search query
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      false ||
      user.email.toLowerCase().includes(query)
    );
  });

  const addUsersMutation = useMutation(
    trpc.groups.addUsers.mutationOptions({
      onSuccess: () => {
        toast.success("Users added to group successfully");
        setIsModalOpen(false);
        // Refresh the page to update the user list
        window.location.reload();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to add users to group");
        setIsAdding(false);
      },
    })
  );

  const handleAddUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setIsAdding(true);
    try {
      await addUsersMutation.mutate({
        groupId,
        userIds: selectedUsers,
      });
    } catch {
      setIsAdding(false);
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCloseModal = () => {
    if (!isAdding) {
      setIsModalOpen(false);
      setSelectedUsers([]);
      setSearchQuery("");
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-primary text-primary-foreground rounded-md px-4 py-2"
      >
        <UserPlus className="mr-2 h-4 w-4" /> Add Users
      </Button>

      {isModalOpen && (
        <Modal
          onClose={handleCloseModal}
          size="lg"
          position="center"
          animation="fade"
          closeOnEscape={!isAdding}
          showCloseButton={!isAdding}
        >
          <div>
            <h3 className="mb-4 text-lg font-medium">
              Add Users to {groupName}
            </h3>

            <div className="relative mb-6">
              <Search className="text-text-secondary absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                className="pl-10"
                placeholder="Search users by name or email"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
              />
            </div>

            <div className="mb-4">
              {loadingUsers ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="text-primary h-6 w-6 animate-spin" />
                </div>
              ) : filteredUsers && filteredUsers.length > 0 ? (
                <div className="max-h-[50vh] overflow-auto rounded-md border">
                  <table className="w-full">
                    <thead className="bg-background-paper sticky top-0 z-10">
                      <tr className="border-b">
                        <th className="p-3"></th>
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b">
                          <td className="p-3 text-center">
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                            />
                          </td>
                          <td className="p-3 font-medium">{user.name}</td>
                          <td className="p-3">{user.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-text-secondary py-6 text-center">
                  {searchQuery
                    ? "No matching users found"
                    : "No users available to add to this group"}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-text-secondary text-sm">
                {selectedUsers.length} users selected
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleCloseModal}
                  disabled={isAdding}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={handleAddUsers}
                  disabled={isAdding || selectedUsers.length === 0}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Users...
                    </>
                  ) : (
                    "Add Users"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
