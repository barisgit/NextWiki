import { z } from "zod";
import { router, protectedProcedure } from "..";
import { dbService } from "~/lib/services";

export const searchRouter = router({
  search: protectedProcedure.input(z.string()).query(async ({ input }) => {
    const results = await dbService.search.search(input);
    return results;
  }),
});
