import { router } from "..";
import { wikiRouter } from "./wiki";
import { usersRouter } from "./users";
import { searchRouter } from "./search";
import { assetsRouter } from "./assets";
import { authRouter } from "./auth";
import { tagsRouter } from "./tags";
import { adminRouter } from "./admin";

export const appRouter = router({
  admin: adminRouter,
  wiki: wikiRouter,
  users: usersRouter,
  search: searchRouter,
  assets: assetsRouter,
  auth: authRouter,
  tags: tagsRouter,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
