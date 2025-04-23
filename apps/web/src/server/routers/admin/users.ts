import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, permissionProtectedProcedure } from "~/server";
import { dbService } from "~/lib/services";

export const usersRouter = router({
  /**
   * Get all users
   * @requires system:users:read
   * @deprecated Implement pagination and search
   */
  getAll: permissionProtectedProcedure("system:users:read").query(async () => {
    const users = await dbService.users.getAll();
    return users;
  }),

  /**
   * Get the total count of users
   * @requires system:users:read
   */
  count: permissionProtectedProcedure("system:users:read").query(async () => {
    return await dbService.users.count();
  }),

  /**
   * Get a single user by ID
   * @requires system:users:read
   */
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

  /**
   * Get user groups by ID
   * @requires system:users:read
   */
  getUserGroups: permissionProtectedProcedure("system:users:read")
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const userGroups = await dbService.users.getUserGroups(input.id);
      return userGroups;
    }),
});
