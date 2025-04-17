import { z } from "zod";
import { assetService } from "~/lib/services";
import { permissionProtectedProcedure, router } from "~/lib/trpc";

export const assetsRouter = router({
  getAll: permissionProtectedProcedure("assets:asset:read")
    .input(z.object({}).optional())
    .query(async () => {
      return assetService.getAll();
    }),

  getByPageId: permissionProtectedProcedure("assets:asset:read")
    .input(z.object({ pageId: z.number() }))
    .query(async ({ input }) => {
      return assetService.getByPageId(input.pageId);
    }),

  getById: permissionProtectedProcedure("assets:asset:read")
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return assetService.getById(input.id);
    }),

  delete: permissionProtectedProcedure("assets:asset:delete")
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const userId = parseInt(ctx.session.user.id as string, 10);
      const isAdmin = ctx.session.user.isAdmin === true;

      // Check if the user has permission to delete this asset
      const asset = await assetService.getById(input.id);
      if (!asset) {
        throw new Error("Asset not found");
      }

      // Only allow the user who uploaded the asset or admins to delete it
      if (!isAdmin && asset.uploadedById !== userId) {
        throw new Error("You don't have permission to delete this asset");
      }

      return assetService.delete(input.id);
    }),
});
