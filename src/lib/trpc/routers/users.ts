import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, permissionProtectedProcedure } from "~/lib/trpc";
import { dbService } from "~/lib/services";

export const usersRouter = router({
  // Get all users
  getAll: permissionProtectedProcedure("system:users:read").query(async () => {
    const users = await dbService.users.getAll();
    return users;
  }),

  // Get a single user by ID
  getById: permissionProtectedProcedure("system:users:read")
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const user = await dbService.users.getById(input.id);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      return user;
    }),

  // Get user groups by ID
  getUserGroups: permissionProtectedProcedure("system:users:read")
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const userGroups = await dbService.users.getUserGroups(input.id);
      return userGroups;
    }),
});
