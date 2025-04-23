import { router } from "~/server";
import { groupsRouter } from "./groups";
import { permissionsRouter } from "./permissions";
import { usersRouter } from "./users";

/**
 * Main router for admin-specific procedures.
 * Sub-routers for different admin areas (e.g., users, groups) should be merged here.
 */
export const adminRouter = router({
  groups: groupsRouter,
  permissions: permissionsRouter,
  users: usersRouter,
});

export type AdminRouter = typeof adminRouter;
