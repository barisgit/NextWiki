import { router } from '..';
import { wikiRouter } from './wiki';

export const appRouter = router({
  wiki: wikiRouter,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter; 