"use client";

import { useState, useEffect } from "react";
import { useTRPC } from "~/server/client";
import { useQuery } from "@tanstack/react-query";
import { WikiPageList } from "./WikiPageList";

// Define Sort types locally or import if defined elsewhere
type SortField = "title" | "updatedAt";
type SortOrder = "asc" | "desc";

// Component to fetch, manage state, and display the list of all wiki pages
export function AllPagesList() {
  const [sortBy, setSortBy] = useState<SortField>("updatedAt"); // Default sort
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc"); // Default order
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const trpc = useTRPC();

  // Fetch pages using tRPC query based on current state
  const { data, isLoading } = useQuery(
    trpc.wiki.list.queryOptions({
      limit: 50, // Or make limit dynamic/configurable if needed
      search: debouncedSearch,
      sortBy,
      sortOrder,
    })
  );

  // Handle sort changes requested by WikiPageList
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      // If already sorting by this field, reverse the order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Otherwise, switch to the new field and default to ascending order
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="mb-6 flex items-center">
        <div className="relative max-w-md flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="text-text-secondary absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform"
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
            className="border-border focus:ring-primary w-full rounded-md border py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Render the presentational list component */}
      <WikiPageList
        pages={data?.pages ?? []} // Provide pages from the query
        isLoading={isLoading} // Pass loading state
        sortBy={sortBy} // Pass current sort field
        sortOrder={sortOrder} // Pass current sort order
        onSortChange={handleSort} // Pass the sort handler
      />
    </div>
  );
}
