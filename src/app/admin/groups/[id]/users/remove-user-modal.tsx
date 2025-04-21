"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import Modal from "~/components/ui/modal";
import { useTRPC } from "~/server/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface RemoveUserModalProps {
  groupId: number;
  userId: number;
  userName: string;
}

export default function RemoveUserModal({
  groupId,
  userId,
  userName,
}: RemoveUserModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const trpc = useTRPC();

  const removeUserMutation = useMutation(
    trpc.groups.removeUsers.mutationOptions({
      onSuccess: () => {
        toast.success("User removed from group successfully");
        setIsModalOpen(false);
        // Refresh the page to update the user list
        window.location.reload();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to remove user from group");
        setIsRemoving(false);
      },
    })
  );

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeUserMutation.mutate({
        groupId,
        userIds: [userId],
      });
    } catch {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive"
        onClick={() => setIsModalOpen(true)}
      >
        <Trash2 className="w-4 h-4 mr-1" /> Remove
      </Button>

      {isModalOpen && (
        <Modal
          onClose={() => !isRemoving && setIsModalOpen(false)}
          size="sm"
          position="center"
          animation="fade"
          closeOnEscape={!isRemoving}
          showCloseButton={!isRemoving}
        >
          <div className="text-center">
            <h3 className="mb-4 text-lg font-medium">Remove User from Group</h3>
            <p className="mb-6 text-text-secondary">
              Are you sure you want to remove{" "}
              <span className="font-semibold">{userName}</span> from this group?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                disabled={isRemoving}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemove}
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove User"
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
