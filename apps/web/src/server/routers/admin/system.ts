import { router, permissionProtectedProcedure } from "~/server";
import { dbService } from "~/lib/services";

export const systemRouter = router({
  getStats: permissionProtectedProcedure("system:general:read").query(
    async () => {
      const stats = await dbService.system.getStats();
      return stats;
    }
  ),
});
