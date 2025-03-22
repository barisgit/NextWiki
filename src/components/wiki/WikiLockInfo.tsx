"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "~/lib/trpc/client";
import { toast } from "sonner";

interface WikiLockInfoProps {
  pageId: number;
  isLocked: boolean;
  lockedByName: string | null;
  lockedUntil: string | null;
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
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // Format the time remaining until lock expiration
  useEffect(() => {
    if (!lockedUntil) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const lockExpiration = new Date(lockedUntil);

      if (lockExpiration <= now) {
        setTimeLeft(null);
        return;
      }

      const diffMs = lockExpiration.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);

      setTimeLeft(`${diffMins}m ${diffSecs}s`);
    };

    // Initial calculation
    calculateTimeLeft();

    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  // Force lock release mutation
  const releaseLockMutation = trpc.wiki.releaseLock.useMutation({
    onSuccess: () => {
      toast.success("Lock released successfully");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Failed to release lock: ${error.message}`);
    },
  });

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
        <span className="text-green-600 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
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
          className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded hover:bg-primary/90"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="border rounded p-3 bg-amber-50 text-amber-800 mb-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
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

          {timeLeft && (
            <p className="text-sm mt-1">Lock expires in: {timeLeft}</p>
          )}
        </div>

        <div className="space-x-2">
          {isCurrentUserLockOwner ? (
            <>
              <button
                onClick={handleEdit}
                className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded hover:bg-primary/90"
              >
                Continue Editing
              </button>
              <button
                onClick={handleReleaseLock}
                className="bg-destructive text-destructive-foreground text-sm px-3 py-1 rounded hover:bg-destructive/90"
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
