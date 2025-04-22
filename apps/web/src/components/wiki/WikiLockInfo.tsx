"use client";

import { useRouter } from "next/navigation";
import { useTRPC } from "~/server/client";
import { useMutation } from "@tanstack/react-query";
import { useNotification } from "~/lib/hooks/useNotification";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@repo/ui";

interface WikiLockInfoProps {
  pageId: number;
  isLocked: boolean;
  lockedByName: string | null;
  lockedUntil?: string | null;
  isCurrentUserLockOwner: boolean;
  editPath: string;
}

export function WikiLockInfo({
  pageId,
  isLocked,
  lockedByName,
  lockedUntil,
  isCurrentUserLockOwner,
  editPath,
}: WikiLockInfoProps) {
  const router = useRouter();
  const notification = useNotification();
  const trpc = useTRPC();

  // Force lock release mutation
  const releaseLockMutation = useMutation(
    trpc.wiki.releaseLock.mutationOptions({
      onSuccess: () => {
        notification.success("Lock released successfully");
        router.refresh();
      },
      onError: (error) => {
        notification.error(`Failed to release lock: ${error.message}`);
      },
    })
  );

  // Handle edit button click
  const handleEdit = () => {
    router.push(editPath);
  };

  // Handle release lock button click
  const handleReleaseLock = () => {
    releaseLockMutation.mutate({ id: pageId });
  };

  if (!isLocked) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <span className="flex items-center text-green-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-1 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
            />
          </svg>
          Unlocked
        </span>
        <Button onClick={handleEdit} variant="outlined" size="sm">
          Edit
        </Button>
      </div>
    );
  }

  // If locked, render the lock status and relevant actions
  return (
    <div className="border-border flex items-center gap-3 rounded-md border p-2 shadow-md">
      <div className="flex-grow">
        <h4 className="text-text-primary flex items-center text-sm font-medium">
          {isCurrentUserLockOwner
            ? "You are currently editing this page"
            : `This page is being edited by ${lockedByName || "another user"}`}
        </h4>
        {lockedUntil && new Date(lockedUntil) > new Date() && (
          <p className="text-text-secondary mt-1 text-xs">
            Lock expires{" "}
            {formatDistanceToNow(new Date(lockedUntil), { addSuffix: true })}
          </p>
        )}
      </div>

      <div className="flex flex-shrink-0 gap-2">
        {isCurrentUserLockOwner ? (
          <>
            <Button
              onClick={handleEdit}
              variant="outlined"
              size="sm"
              className="m-0 py-0"
            >
              Continue Editing
            </Button>
            <Button
              onClick={handleReleaseLock}
              variant="destructive"
              size="sm"
              className="m-0 py-0"
            >
              Release Lock
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
