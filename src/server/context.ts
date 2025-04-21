import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"; // Import Fetch options
import { getServerSession, Session } from "next-auth";

// import type { IncomingMessage } from "http"; // Not currently used
// Socket type might be needed later for WS handling, keep for now
// import type { Socket } from "net";
import { authOptions, getServerAuthSession } from "~/lib/auth";
import { logger } from "~/lib/utils/logger";

/**
 * Creates context for an incoming request
 * @see https://trpc.io/docs/v11/context
 */
export const createContext = async (
  opts:
    | CreateNextContextOptions
    | CreateWSSContextFnOptions
    | FetchCreateContextFnOptions // Add Fetch options
): Promise<{ session: Session | null }> => {
  // Add explicit return type promise
  let session: Session | null = null;

  // Check for Next.js API route context (has req, res, and req.query)
  // Note: instanceof Object check might be needed if req could be primitive
  if (
    "req" in opts &&
    "res" in opts &&
    typeof opts.req === "object" &&
    opts.req !== null &&
    "query" in opts.req
  ) {
    logger.log("Creating context for Next.js Pages API route");
    // Type assertion needed as we've confirmed the structure
    session = await getServerAuthSession();
    // Check for Fetch API context (has req but not res, used in App Router)
  } else if ("req" in opts && !("res" in opts)) {
    logger.log("Creating context for Fetch API (App Router)");
    // In App Router Route Handlers, getServerSession(authOptions) usually works
    session = await getServerSession(authOptions);
    // If session is null, you might need to manually extract/verify cookies/headers
    // from opts.req (type Request) if authOptions alone isn't sufficient.
    // Check for WebSocket context (has req and res, but req lacks typical NextApiRequest props)
  } else if ("req" in opts && "res" in opts) {
    logger.warn(
      "Creating context for WebSocket connection (Session retrieval not implemented)"
    );
    // Placeholder for WebSocket session logic
    // Needs specific handling (e.g., cookie parsing from opts.req which is http.IncomingMessage)
  } else {
    logger.error("Unknown context type:", opts);
    // Optionally throw an error or return a default context
    // throw new Error("Could not determine context type");
  }

  logger.log(
    "createContext created for",
    session?.user?.name ?? "unknown user"
  );

  return {
    session,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
