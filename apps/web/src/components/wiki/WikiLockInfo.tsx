"use client";

import { useRouter } from "next/navigation";
import { useTRPC } from "~/server/client";
import { useMutation } from "@tanstack/react-query";
import { useNotification } from "~/lib/hooks/useNotification";
import { formatDistanceToNow } from "date-fns";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui";
import { LockIcon, UnlockIcon, XCircleIcon } from "lucide-react";

interface WikiLockInfoProps {
  pageId: number;
  isLocked: boolean;
  lockedByName: string | null;
  lockedUntil?: string | null;
  isCurrentUserLockOwner: boolean;
  editPath: string;
  displayMode?: "full" | "header";
}

export function WikiLockInfo({
  pageId,
  isLocked,
  lockedByName,
  lockedUntil,
  isCurrentUserLockOwner,
  displayMode = "full",
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

  // Handle release lock button click
  const handleReleaseLock = () => {
    releaseLockMutation.mutate({ id: pageId });
  };

  const lockTooltipContent = `Locked by ${lockedByName || "another user"}${lockedUntil ? ` (expires ${formatDistanceToNow(new Date(lockedUntil), { addSuffix: true })})` : ""}`;

  // Header display mode
  if (displayMode === "header") {
    if (!isLocked) {
      return null;
    }

    const lockText = isCurrentUserLockOwner ? "Editing" : "Locked";
    const iconColor = isCurrentUserLockOwner
      ? "text-blue-500"
      : "text-orange-500";

    return (
      <div className="flex items-center space-x-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`flex cursor-help items-center space-x-1 ${iconColor}`}
              >
                <LockIcon className="h-4 w-4" />
                <span className="text-xs font-medium">{lockText}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{lockTooltipContent}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {isCurrentUserLockOwner && (
          <div className="ml-1 flex items-center space-x-0.5">
            <button
              onClick={handleReleaseLock}
              className="hover:bg-destructive/10 text-destructive hover:text-destructive/80 rounded p-0.5"
              title="Release Lock"
            >
              <XCircleIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full display mode (original logic)
  if (!isLocked) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <span className="flex items-center text-green-600">
          <UnlockIcon className="mr-1 h-4 w-4" />
          Unlocked
        </span>
      </div>
    );
  }

  // If locked, render the full lock status and relevant actions
  return (
    <div className="border-border flex items-center gap-3 rounded-md border p-2 shadow-sm">
      <div className="flex-grow">
        <h4 className="text-text-primary flex items-center text-sm font-medium">
          <LockIcon className="mr-1.5 h-4 w-4 text-orange-500" />
          {isCurrentUserLockOwner
            ? "You are currently editing this page"
            : `This page is being edited by ${lockedByName || "another user"}`}
        </h4>
        {lockedUntil && new Date(lockedUntil) > new Date() && (
          <p className="text-text-secondary pl-5.5 mt-1 text-xs">
            Lock expires{" "}
            {formatDistanceToNow(new Date(lockedUntil), { addSuffix: true })}
          </p>
        )}
      </div>

      <div className="flex flex-shrink-0 gap-2">
        {isCurrentUserLockOwner ? (
          <>
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
