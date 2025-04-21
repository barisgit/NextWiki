"use client";

import { useSubscription } from "@trpc/tanstack-react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import React, { useEffect, useState } from "react";
import { useTRPC } from "~/server/client";
import type { AppRouter } from "~/server/routers";
import { useNotification } from "~/lib/hooks/useNotification";
import { logger } from "~/lib/utils/logger";

/**
 * Displays a random number received from a tRPC subscription (Header Version).
 */
export function RandomNumberDisplay() {
  const [randomNumber, setRandomNumber] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string | null>(null);
  const trpc = useTRPC();
  const notification = useNotification();

  const test = useSubscription(
    trpc.wiki.randomNumber.subscriptionOptions(
      undefined, // Pass input first (undefined for this procedure)
      {
        // Pass options object second
        onData: (data: { randomNumber: number; completed: boolean }) => {
          logger.debug("Received random number:", data);
          setRandomNumber(data.randomNumber);
          if (data.completed) {
            setConnectionState("completed");
          }
          setError(null); // Clear error on successful data reception
        },
        onError: (err: TRPCClientErrorLike<AppRouter>) => {
          notification.error("Subscription error: " + err.message);
          setRandomNumber(null); // Clear number on error
          setConnectionState("error");
        },
        onStarted: () => {
          logger.debug("Subscription started");
          setError(null);
        },
      }
    )
  );

  useEffect(() => {
    // Effect for logging status changes
    logger.debug("Subscription status:", test.status);
    setConnectionState(test.status);
  }, [test.status]);

  let indicatorBgClass = "bg-muted-foreground"; // Default pending/initial
  let displayText = "...";

  if (error) {
    indicatorBgClass = "bg-error-500";
    displayText = error;
  } else if (connectionState === "completed") {
    indicatorBgClass = "bg-success-500"; // Green checkmark for completed
    displayText = "Done"; // Show checkmark when completed
  } else if (
    randomNumber !== null &&
    (connectionState === "success" || connectionState === "pending")
  ) {
    // It can be 'pending' but already received data via onData before status updates
    indicatorBgClass = "bg-success-500"; // Green for active success
    displayText = randomNumber.toFixed(2);
  } else if (
    (connectionState === "success" || connectionState === "pending") &&
    randomNumber === null
  ) {
    // Pending/Success but no data yet
    indicatorBgClass = "bg-muted-foreground"; // Use gray for pending before first data or if success but no data yet
    displayText = "...";
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-sm border rounded border-border bg-background-level1">
      <span className={`w-2 h-2 rounded-full ${indicatorBgClass}`}></span>
      <span>{displayText}</span>
    </div>
  );
}
