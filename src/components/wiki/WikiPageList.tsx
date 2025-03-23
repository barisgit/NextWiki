"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useState, useEffect } from "react";
import { trpc } from "~/lib/trpc/client";
import { Skeleton } from "~/components/ui/skeleton";

interface WikiPageListProps {
  initialSortBy?: "title" | "updatedAt";
  initialSortOrder?: "asc" | "desc";
  initialSearchQuery?: string;
}

export function WikiPageList({
  initialSortBy = "updatedAt",
  initialSortOrder = "desc",
  initialSearchQuery = "",
}: WikiPageListProps) {
  const [sortBy, setSortBy] = useState<"title" | "updatedAt">(initialSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSortOrder);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearchQuery);

  // Debounce search input to avoid too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch pages with server-side filtering and sorting
  const { data, isLoading } = trpc.wiki.list.useQuery({
    limit: 50,
    search: debouncedSearch,
    sortBy,
    sortOrder,
  });

  const handleSort = (field: "title" | "updatedAt") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-text-secondary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search pages..."
            className="w-full py-2 pl-10 pr-4 border rounded-md border-border focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden border rounded-md border-border-dark dark:border-border-light">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-card">
              <th
                className="px-4 py-3 text-sm font-medium text-left cursor-pointer text-text-primary"
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center">
                  Page Title
                  {sortBy === "title" && (
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
                className="px-4 py-3 text-sm font-medium text-left cursor-pointer text-text-primary"
                onClick={() => handleSort("updatedAt")}
              >
                <div className="flex items-center">
                  Last Updated
                  {sortBy === "updatedAt" && (
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
            ) : data?.pages.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-8 text-center text-text-secondary"
                >
                  No pages found.
                </td>
              </tr>
            ) : (
              data?.pages.map((page) => (
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
                        {page.tags.map((tagItem) => (
                          <Link
                            key={tagItem.tag.id}
                            href={`/tags/${tagItem.tag.name}`}
                            className="text-xs px-1.5 py-0.5 bg-card rounded-full hover:bg-card-hover"
                          >
                            {tagItem.tag.name}
                          </Link>
                        ))}
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
