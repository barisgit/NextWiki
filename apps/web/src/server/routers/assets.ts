import { z } from "zod";
import { assetService } from "~/lib/services";
import { permissionProtectedProcedure, router } from "~/server";
import { TRPCError } from "@trpc/server";
import { paginationSchema } from "~/lib/utils/pagination";
import { logger } from "@repo/logger";

const FILE_SIZE_LIMIT_MB = 100; // 100MB

const AssetDTO = z.object({
  id: z.string().uuid(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  uploadedById: z.number(),
  createdAt: z.date(),
});

export const assetsRouter = router({
  /**
   * Get all assets
   * @deprecated Use getPaginated instead - this endpoint will be removed in a future version
   */
  getAll: permissionProtectedProcedure("assets:asset:read")
    .input(z.object({}).optional())
    .output(z.array(AssetDTO))
    .query(async () => {
      logger.warn(
        "Deprecated endpoint 'getAll' called - migrate to 'getPaginated'"
      );
      const assets = await assetService.getAll();
      return assets.map((asset) => AssetDTO.parse(asset));
    }),

  getPaginated: permissionProtectedProcedure("assets:asset:read")
    .input(
      z.object({
        ...paginationSchema(),
        search: z.string().optional(),
        fileType: z.string().optional(),
        pageId: z.number().nullable().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, search, fileType, pageId } = input;

      return assetService.getPaginated(
        { page, pageSize },
        { search, fileType, pageId }
      );
    }),

  getByPageId: permissionProtectedProcedure("assets:asset:read")
    .input(z.object({ pageId: z.number() }))
    .query(async ({ input }) => {
      return assetService.getByPageId(input.pageId);
    }),

  getById: permissionProtectedProcedure("assets:asset:read")
    .input(z.object({ id: z.string().uuid() }))
    .output(AssetDTO.nullable())
    .query(async ({ input }) => {
      const asset = await assetService.getById(input.id);
      return asset ? AssetDTO.parse(asset) : null;
    }),

  upload: permissionProtectedProcedure("assets:asset:create")
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
        data: z.string(), // Base64 encoded data
        name: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        pageId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = parseInt(ctx.session.user.id as string, 10);

        // Size validation
        if (input.fileSize > FILE_SIZE_LIMIT_MB * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `File size exceeds ${FILE_SIZE_LIMIT_MB}MB limit`,
          });
        }

        // Strip data URI prefix if present
        let base64Data = input.data;
        const prefixMatch = input.data.match(/^data:.*;base64,/);
        if (prefixMatch) {
          base64Data = input.data.substring(prefixMatch[0].length);
        }

        const asset = await assetService.create({
          fileName: input.fileName,
          fileType: input.fileType,
          fileSize: input.fileSize,
          data: base64Data,
          name: input.name,
          description: input.description,
          uploadedById: userId,
          pageId: input.pageId,
        });

        return asset;
      } catch (error) {
        logger.error("[ASSET UPLOAD ERROR]", error);

        // If the error is already a TRPCError, re-throw it to preserve the specific code/message
        if (error instanceof TRPCError) {
          throw error;
        }

        // Otherwise, wrap it in a generic internal server error
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload asset",
          cause: error,
        });
      }
    }),

  update: permissionProtectedProcedure("assets:asset:update")
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = parseInt(ctx.session.user.id as string, 10);
      const isAdmin = ctx.session.user.isAdmin === true;

      // Check if the user has permission to update this asset
      const asset = await assetService.getById(input.id);
      if (!asset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Asset not found",
        });
      }

      // Only allow the user who uploaded the asset or admins to update it
      if (!isAdmin && asset.uploadedById !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this asset",
        });
      }

      try {
        const updatedAsset = await assetService.update(input.id, {
          name: input.name,
          description: input.description,
        });
        return updatedAsset;
      } catch (error) {
        logger.error("[ASSET UPDATE ERROR]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update asset",
          cause: error,
        });
      }
    }),

  delete: permissionProtectedProcedure("assets:asset:delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = parseInt(ctx.session.user.id as string, 10);
      const isAdmin = ctx.session.user.isAdmin === true;

      // Check if the user has permission to delete this asset
      const asset = await assetService.getById(input.id);
      if (!asset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Asset not found",
        });
      }

      // Only allow the user who uploaded the asset or admins to delete it
      if (!isAdmin && asset.uploadedById !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this asset",
        });
      }

      return assetService.delete(input.id);
    }),
});
