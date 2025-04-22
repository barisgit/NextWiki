"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { WikiFolderTree } from "./WikiFolderTree";
import { SearchIcon, PlusIcon } from "lucide-react";
import { useTRPC } from "~/server/client";
import { useQuery } from "@tanstack/react-query";
import { PageLocationEditor } from "./PageLocationEditor";
import { Button } from "@repo/ui";
import { SkeletonText } from "@repo/ui";
import { ClientRequirePermission } from "../auth/permission/client";

interface WikiBrowserProps {
  /**
   * Initial search query
   */
  initialSearch?: string;
}

export function WikiBrowser({ initialSearch = "" }: WikiBrowserProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Debounce search input
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  const trpc = useTRPC();

  // Fetch search results if search is active
  const { data: searchResults, isLoading: isSearching } = useQuery(
    trpc.wiki.list.queryOptions(
      {
        limit: 20,
        search: debouncedSearch,
        sortBy: "title",
        sortOrder: "asc",
      },
      {
        enabled: debouncedSearch.length > 0,
      }
    )
  );

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="mb-6 flex items-center">
        <div className="relative max-w-md flex-1">
          <SearchIcon className="text-text-secondary absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
          <input
            type="search"
            placeholder="Search wiki..."
            className="border-border-default focus:ring-primary w-full rounded-md border py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <ClientRequirePermission permission="wiki:page:create">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="ml-4"
            size="default"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            New Page
          </Button>
        </ClientRequirePermission>
      </div>

      {/* Search results */}
      {debouncedSearch && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-medium">Search Results</h2>

          {isSearching ? (
            <div className="py-6">
              <SkeletonText lines={3} className="mb-2" />
              <SkeletonText lines={3} className="mb-2" />
              <SkeletonText lines={3} className="mb-2" />
            </div>
          ) : searchResults?.pages.length === 0 ? (
            <div className="py-6 text-center text-slate-500">
              No results found for &ldquo;{debouncedSearch}&rdquo;
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border shadow-sm">
              <ul className="divide-y">
                {searchResults?.pages.map((page) => (
                  <li key={page.id}>
                    <Link
                      href={`/${page.path}`}
                      className="block px-5 py-4 hover:bg-slate-50"
                    >
                      <div className="text-primary text-lg font-medium">
                        {page.title}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        /{page.path}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Wiki folder structure */}
      {!debouncedSearch && (
        <div className="w-full">
          <WikiFolderTree
            title="Wiki Structure"
            showRoot={true}
            showPageCount={true}
            openDepth={2}
            className="w-full"
            showActions={true}
          />
        </div>
      )}

      {/* Page Location Editor Modal */}
      <PageLocationEditor
        mode="create"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
