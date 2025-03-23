import { z } from "zod";
import { assetService } from "~/lib/services";
import { protectedProcedure, router } from "~/lib/trpc";

export const assetsRouter = router({
  getAll: protectedProcedure.input(z.object({}).optional()).query(async () => {
    return assetService.getAll();
  }),

  getByPageId: protectedProcedure
    .input(z.object({ pageId: z.number() }))
    .query(async ({ input }) => {
      return assetService.getByPageId(input.pageId);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return assetService.getById(input.id);
    }),

  delete: protectedProcedure
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
