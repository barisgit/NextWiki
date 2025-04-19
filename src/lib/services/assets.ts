import { db } from "../db";
import { assets, assetsToPages } from "../db/schema";
import { eq, like, ilike, and, sql, SQL } from "drizzle-orm";
import {
  PaginationInput,
  getPaginationParams,
  createPaginatedResponse,
} from "../utils/pagination";

export interface AssetSearchFilters {
  search?: string;
  fileType?: string;
  pageId?: number | null;
}

export const assetService = {
  /**
   * Get an asset by ID
   */
  async getById(id: string) {
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
   * Get paginated assets with optional search and filters
   */
  async getPaginated(
    pagination: PaginationInput,
    filters?: AssetSearchFilters
  ) {
    const { take, skip } = getPaginationParams(pagination);

    // Build where conditions
    const whereConditions: SQL[] = [];

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      whereConditions.push(
        sql`(${ilike(assets.fileName, searchTerm)} OR 
             ${ilike(assets.name || "", searchTerm)} OR 
             ${ilike(assets.description || "", searchTerm)})`
      );
    }

    if (filters?.fileType) {
      whereConditions.push(like(assets.fileType, `${filters.fileType}%`));
    }

    // Handle pageId filtering using assetsToPages junction table if needed
    // Currently commented out as the schema suggests many-to-many relationship
    // This would require a join on the assetsToPages table

    // Get total count
    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const totalItems = await db
      .select({ count: sql<number>`count(*)` })
      .from(assets)
      .where(whereClause)
      .then((result) => Number(result[0].count));

    // Get paginated assets
    const items = await db.query.assets.findMany({
      where: whereClause,
      orderBy: (assets, { desc }) => [desc(assets.createdAt)],
      limit: take,
      offset: skip,
      with: {
        uploadedBy: true,
      },
    });

    return createPaginatedResponse(items, pagination, totalItems);
  },

  /**
   * Get assets for a page using the junction table
   */
  async getByPageId(pageId: number) {
    // Using the junction table to get assets for a page
    const assetsForPage = await db
      .select()
      .from(assets)
      .innerJoin(assetsToPages, eq(assets.id, assetsToPages.assetId))
      .where(eq(assetsToPages.pageId, pageId))
      .orderBy(assets.createdAt);

    // Map the results to return just the assets
    return assetsForPage.map((row) => row.assets);
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
    name?: string | null;
    description?: string | null;
    pageId?: number | null;
  }) {
    // Extract pageId to handle separately
    const { pageId, ...assetData } = data;

    // Insert asset
    const [asset] = await db.insert(assets).values(assetData).returning();

    // If pageId is provided, create relationship in junction table
    if (pageId) {
      await db.insert(assetsToPages).values({
        assetId: asset.id,
        pageId: pageId,
      });
    }

    return asset;
  },

  /**
   * Update an asset
   */
  async update(
    id: string,
    data: {
      name?: string | null;
      description?: string | null;
    }
  ) {
    const [updatedAsset] = await db
      .update(assets)
      .set(data)
      .where(eq(assets.id, id))
      .returning();

    return updatedAsset;
  },

  /**
   * Delete an asset
   */
  async delete(id: string) {
    // First delete entries from junction table if any
    await db.delete(assetsToPages).where(eq(assetsToPages.assetId, id));

    // Then delete the asset
    return db.delete(assets).where(eq(assets.id, id));
  },
};
