import { router } from "..";
import { wikiRouter } from "./wiki";
import { userRouter } from "./user";
import { searchRouter } from "./search";
import { assetsRouter } from "./assets";
import { permissionsRouter } from "./permissions";
import { groupsRouter } from "./groups";
import { usersRouter } from "./users";
import { authRouter } from "./auth";
import { tagsRouter } from "./tags";

export const appRouter = router({
  wiki: wikiRouter,
  user: userRouter,
  users: usersRouter,
  search: searchRouter,
  assets: assetsRouter,
  permissions: permissionsRouter,
  groups: groupsRouter,
  auth: authRouter,
  tags: tagsRouter,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
