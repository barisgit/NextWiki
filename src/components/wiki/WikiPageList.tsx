"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Skeleton } from "~/components/ui/skeleton";
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
      <div className="overflow-hidden border rounded-md border-border-dark dark:border-border-light">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-card">
              <th
                className={`px-4 py-3 text-sm font-medium text-left text-text-primary ${
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
                      className={`h-4 w-4 ml-1 ${
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
                className={`px-4 py-3 text-sm font-medium text-left text-text-primary ${
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
                      className={`h-4 w-4 ml-1 ${
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
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Skeleton className="w-40 h-6" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="w-24 h-4" />
                    </td>
                  </tr>
                ))
            ) : pages.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-8 text-center text-text-secondary"
                >
                  No pages found.
                </td>
              </tr>
            ) : (
              pages.map((page) => (
                <tr
                  key={page.id}
                  className="border-b last:border-0 hover:bg-card-hover"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/${page.path}`}
                      className="text-primary hover:underline"
                    >
                      {page.title}
                    </Link>
                    {page.tags && page.tags.length > 0 && (
                      <div className="flex mt-1 space-x-1">
                        {page.tags.map(
                          (tagItem: WikiPageListItem["tags"][number]) => (
                            <Link
                              key={tagItem.tag.id}
                              href={`/tags/${tagItem.tag.name}`}
                              className="text-xs px-1.5 py-0.5 bg-card rounded-full hover:bg-card-hover"
                            >
                              {tagItem.tag.name}
                            </Link>
                          )
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
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
