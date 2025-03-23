import { db } from "../db";
import { assets } from "../db/schema";
import { eq } from "drizzle-orm";

export const assetService = {
  /**
   * Get an asset by ID
   */
  async getById(id: number) {
    return db.query.assets.findFirst({
      where: eq(assets.id, id),
    });
  },

  /**
   * Get all assets
   */
  async getAll() {
    return db.query.assets.findMany({
      orderBy: (assets, { desc }) => [desc(assets.createdAt)],
      with: {
        uploadedBy: true,
      },
    });
  },

  /**
   * Get assets for a page
   */
  async getByPageId(pageId: number) {
    return db.query.assets.findMany({
      where: eq(assets.pageId, pageId),
      orderBy: (assets, { desc }) => [desc(assets.createdAt)],
      with: {
        uploadedBy: true,
      },
    });
  },

  /**
   * Create a new asset
   */
  async create(data: {
    fileName: string;
    fileType: string;
    fileSize: number;
    data: string;
    uploadedById: number;
    pageId?: number | null;
  }) {
    const [asset] = await db.insert(assets).values(data).returning();
    return asset;
  },

  /**
   * Delete an asset
   */
  async delete(id: number) {
    return db.delete(assets).where(eq(assets.id, id));
  },
};
