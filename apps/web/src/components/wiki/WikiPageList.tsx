"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Skeleton } from "@repo/ui";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/routers";

type RouterOutput = inferRouterOutputs<AppRouter>;
type WikiPageListItem = RouterOutput["wiki"]["list"]["pages"][number];

type SortField = "title" | "updatedAt";
type SortOrder = "asc" | "desc";

interface WikiPageListProps {
  pages: WikiPageListItem[];
  isLoading: boolean;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  onSortChange?: (field: SortField) => void;
}

export function WikiPageList({
  pages,
  isLoading,
  sortBy,
  sortOrder,
  onSortChange,
}: WikiPageListProps) {
  const handleSort = (field: SortField) => {
    if (onSortChange) {
      onSortChange(field);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-border-dark dark:border-border-light overflow-hidden rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="bg-card border-b">
              <th
                className={`text-text-primary px-4 py-3 text-left text-sm font-medium ${
                  onSortChange ? "cursor-pointer" : ""
                }`}
                onClick={() => handleSort("title")}
                aria-disabled={!onSortChange}
              >
                <div className="flex items-center">
                  Page Title
                  {onSortChange && sortBy === "title" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`ml-1 h-4 w-4 ${
                        sortOrder === "desc" ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  )}
                </div>
              </th>
              <th
                className={`text-text-primary px-4 py-3 text-left text-sm font-medium ${
                  onSortChange ? "cursor-pointer" : ""
                }`}
                onClick={() => handleSort("updatedAt")}
                aria-disabled={!onSortChange}
              >
                <div className="flex items-center">
                  Last Updated
                  {onSortChange && sortBy === "updatedAt" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`ml-1 h-4 w-4 ${
                        sortOrder === "desc" ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, index) => (
                  <tr
                    key={`skeleton-${index}`}
                    className="border-border border-b last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Skeleton className="h-6 w-40" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  </tr>
                ))
            ) : pages.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="text-text-secondary px-4 py-8 text-center"
                >
                  No pages found.
                </td>
              </tr>
            ) : (
              pages.map((page) => (
                <tr
                  key={page.id}
                  className="hover:bg-card-hover border-b last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/${page.path}`}
                      className="text-primary hover:underline"
                    >
                      {page.title}
                    </Link>
                    {page.tags && page.tags.length > 0 && (
                      <div className="mt-1 flex space-x-1">
                        {page.tags.map(
                          (tagItem: WikiPageListItem["tags"][number]) => (
                            <Link
                              key={tagItem.tag.id}
                              href={`/tags/${tagItem.tag.name}`}
                              className="bg-card hover:bg-card-hover rounded-full px-1.5 py-0.5 text-xs"
                            >
                              {tagItem.tag.name}
                            </Link>
                          )
                        )}
                      </div>
                    )}
                  </td>
                  <td className="text-text-secondary px-4 py-3 text-sm">
                    {page.updatedAt
                      ? formatDistanceToNow(new Date(page.updatedAt), {
                          addSuffix: true,
                        })
                      : "Never"}
                    {page.updatedBy ? ` by ${page.updatedBy.name}` : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
