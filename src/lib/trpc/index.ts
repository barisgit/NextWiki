import { initTRPC, TRPCError } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getServerAuthSession } from "~/lib/auth";
import type { Session } from "next-auth";

// Initialize context for tRPC
export async function createContext(opts: FetchCreateContextFnOptions) {
  void opts;
  // Get user session from NextAuth
  const session = await getServerAuthSession();

  return {
    session,
  };
}

// Context type
export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC server instance
const t = initTRPC.context<Context>().create();

// Create middlewares, procedures, and routers
export const middleware = t.middleware;
export const router = t.router;
export const publicProcedure = t.procedure;

// Create protected procedure that requires authentication
const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  return next({
    ctx: {
      session: ctx.session as Session,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);
