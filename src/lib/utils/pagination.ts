/**
 * Pagination input interface
 * @description Standard pagination parameters for list endpoints
 */
export interface PaginationInput {
  page: number;
  pageSize: number;
}

/**
 * Pagination metadata interface
 * @description Provides pagination context for paginated responses
 */
export interface PaginationMeta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated response interface
 * @description Standard response structure for paginated data
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Calculates pagination parameters for database queries
 * @param pagination Pagination input
 * @returns take and skip parameters for the database query
 */
export function getPaginationParams(pagination: PaginationInput): {
  take: number;
  skip: number;
} {
  const page = pagination.page < 1 ? DEFAULT_PAGE : pagination.page;
  const pageSize =
    pagination.pageSize < 1
      ? DEFAULT_PAGE_SIZE
      : pagination.pageSize > MAX_PAGE_SIZE
      ? MAX_PAGE_SIZE
      : pagination.pageSize;

  return {
    take: pageSize,
    skip: (page - 1) * pageSize,
  };
}

/**
 * Creates pagination metadata
 * @param pagination Pagination input
 * @param totalItems Total number of items
 * @param itemCount Optional count of items in the current page
 * @returns Pagination metadata
 */
export function createPaginationMeta(
  pagination: PaginationInput,
  totalItems: number,
  itemCount?: number
): PaginationMeta {
  const { page, pageSize } = pagination;
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    currentPage: page,
    itemCount:
      itemCount !== undefined
        ? itemCount
        : Math.min(pageSize, totalItems - (page - 1) * pageSize),
    itemsPerPage: pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Creates a paginated response
 * @param items Array of items for the current page
 * @param pagination Pagination input
 * @param totalItems Total number of items
 * @returns Paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  pagination: PaginationInput,
  totalItems: number
): PaginatedResponse<T> {
  return {
    items,
    meta: createPaginationMeta(pagination, totalItems, items.length),
  };
}

/**
 * Zod schema for pagination input validation
 */
export const paginationSchema = () => ({
  page: z
    .number()
    .int()
    .min(1)
    .default(DEFAULT_PAGE)
    .describe("Page number (starts from 1)"),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE)
    .describe("Number of items per page"),
});

// Need to import zod at the top
import { z } from "zod";
