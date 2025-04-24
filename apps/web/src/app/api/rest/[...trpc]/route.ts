import { appRouter } from "~/server/routers";
import { createContext } from "~/server/context";
import { type NextRequest } from "next/server";
import { createOpenApiFetchHandler } from "trpc-to-openapi";

export const dynamic = "force-dynamic";

const handler = (req: NextRequest) => {
  // Handle incoming OpenAPI requests
  return createOpenApiFetchHandler({
    endpoint: "/api/rest", // Match the file path
    router: appRouter,
    // @ts-ignore - Temporarily ignore type mismatch to focus on runtime error
    createContext: () => createContext(req),
    req,
  });
};

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
  handler as HEAD,
};
