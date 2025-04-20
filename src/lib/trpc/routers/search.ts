import { z } from "zod";
import { router, permissionGuestProcedure } from "..";
import { dbService } from "~/lib/services";
import {
  paginationSchema,
  createPaginatedResponse,
} from "~/lib/utils/pagination";

export const searchRouter = router({
  search: permissionGuestProcedure("wiki:page:read")
    .input(
      z.object({
        query: z.string().min(1),
        ...paginationSchema(), // Include page and pageSize
      })
    )
    .query(async ({ input }) => {
      const { query, page, pageSize } = input;

      // Get paginated results and total count from the service
      const { items, totalItems } = await dbService.search.searchPaginated(
        query,
        { page, pageSize }
      );

      // Create the standard paginated response
      return createPaginatedResponse(items, { page, pageSize }, totalItems);
    }),
});
