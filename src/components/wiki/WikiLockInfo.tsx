"use client";

import { useRouter } from "next/navigation";
import { useTRPC } from "~/lib/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useNotification } from "~/lib/hooks/useNotification";

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
            className="w-4 h-4 mr-1"
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
        <button
          onClick={handleEdit}
          className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 mb-4 border rounded bg-amber-50 text-amber-800">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="flex items-center font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            </svg>
            {isCurrentUserLockOwner
              ? "You are currently editing this page"
              : `This page is being edited by ${
                  lockedByName || "another user"
                }`}
          </h4>

          <p className="mt-1 text-sm">Software lock with 30-minute timeout</p>

          {lockedUntil && (
            <p className="mt-1 text-xs text-amber-700">
              Lock expires: {new Date(lockedUntil).toLocaleString()}
            </p>
          )}
        </div>

        <div className="space-x-2">
          {isCurrentUserLockOwner ? (
            <>
              <button
                onClick={handleEdit}
                className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Continue Editing
              </button>
              <button
                onClick={handleReleaseLock}
                className="px-3 py-1 text-sm rounded bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Release Lock
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
