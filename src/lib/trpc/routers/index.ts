import { router } from "..";
import { wikiRouter } from "./wiki";
import { userRouter } from "./user";
import { searchRouter } from "./search";
import { assetsRouter } from "./assets";

export const appRouter = router({
  wiki: wikiRouter,
  user: userRouter,
  search: searchRouter,
  assets: assetsRouter,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
