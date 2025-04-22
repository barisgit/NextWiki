"use client";

import { useState, useEffect, useRef } from "react";
import { useTRPC } from "~/server/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { Modal } from "@repo/ui";
import {
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { ScrollArea } from "@repo/ui";

// Utility to highlight text
function highlightText(text: string, query: string) {
  if (!query || !text) return text;

  const parts = text.split(new RegExp(`(${query})`, "gi"));

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={i}
        className="p-0 mx-0 font-semibold bg-transparent text-primary dark:text-primary"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function SearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialHighlight = searchParams.get("highlight") || "";
  const inputRef = useRef<HTMLInputElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null); // Ref for the list for scrolling

  const [searchQuery, setSearchQuery] = useState(initialHighlight);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setFocusedIndex(-1); // Reset focus index on open
    }
  }, [isOpen]);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: searchData, isLoading } = useQuery(
    trpc.search.search.queryOptions(
      {
        query: searchQuery,
        page: currentPage,
        pageSize: resultsPerPage,
      },
      {
        enabled: isOpen && !!searchQuery && searchQuery.length >= 1,
        placeholderData: (prev) => prev,
        staleTime: 5 * 60 * 1000, // Keep results fresh for 5 minutes
      }
    )
  );

  const prefetchNextPage = () => {
    if (paginationMeta?.hasNextPage) {
      queryClient.prefetchQuery(
        trpc.search.search.queryOptions({
          query: searchQuery,
          page: currentPage + 1,
          pageSize: resultsPerPage,
        })
      );
    }
  };

  // Extract items and metadata from the paginated response
  const paginatedResults = searchData?.items || [];
  const paginationMeta = searchData?.meta;

  // Navigate to search result and close modal
  const handleResultClick = (path: string) => {
    router.push(`/${path}?highlight=${encodeURIComponent(searchQuery)}`);
    onClose();
  };

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
    setFocusedIndex(-1); // Reset focus on new search
  }, [searchQuery]);

  // Clear search on close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setCurrentPage(1);
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[
        focusedIndex
      ] as HTMLLIElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({
          block: "nearest",
          inline: "nearest",
        });
      }
    }
  }, [focusedIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || paginatedResults.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % paginatedResults.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex(
          (prev) =>
            (prev - 1 + paginatedResults.length) % paginatedResults.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < paginatedResults.length) {
          if (!paginatedResults[focusedIndex]) {
            throw new Error("Result is undefined");
          }
          if (!paginatedResults[focusedIndex].path) {
            throw new Error("Path is undefined");
          }
          handleResultClick(paginatedResults[focusedIndex].path);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, paginatedResults, focusedIndex]);

  // Only render the modal when isOpen is true
  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      size="lg" // Zod uses a large modal
      animation="fade" // Fade is common for command palettes
      className="p-0 flex flex-col bg-background-paper/95 dark:bg-background-level1/95 backdrop-blur-sm border border-border-default shadow-2xl max-h-[80vh] max-w-3xl"
      overlayClassName="pt-16 md:pt-20"
      position="top"
      showCloseButton={false} // Zod doesn't show a close button explicitly
    >
      {/* Search Input Area */}
      <div className="flex items-center flex-shrink-0 p-4 border-b border-border-default">
        <Search className="w-5 h-5 mr-3 text-text-secondary" />
        <input
          ref={inputRef}
          type="search"
          placeholder="Search wiki..."
          className="flex-1 text-base bg-transparent border-none focus:outline-none text-text-primary placeholder:text-text-secondary/70"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Results Area - Scrolls */}
      {/* TODO: Scrollarea doesn't work overflow-y-auto takes over */}
      <ScrollArea
        className="flex-1 min-h-0 overflow-y-auto"
        id="search-results-list"
      >
        {isLoading && !paginatedResults.length ? (
          <div className="flex items-center justify-center p-8 text-center text-text-secondary">
            {/* Simplified Loader */}
            <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        ) : paginationMeta && paginationMeta.totalItems > 0 ? (
          <ul ref={listRef} className="p-2 m-0 space-y-1 list-none">
            {" "}
            {/* Padding around list, space between items */}
            {paginatedResults.map((result, index) => (
              <li
                key={result.id}
                id={`search-result-${index}`}
                role="option"
                aria-selected={focusedIndex === index}
                className={cn(
                  "p-3 transition-colors cursor-pointer rounded-md border flex items-center justify-between gap-3",
                  focusedIndex === index
                    ? "bg-primary/10 border-primary/50"
                    : "border-transparent hover:bg-background-level1/50 hover:border-border-light"
                )}
                onClick={() => handleResultClick(result.path)}
                onMouseEnter={() => setFocusedIndex(index)} // Update focus on hover
              >
                <div className="flex items-start flex-1 min-w-0">
                  <FileText className="flex-shrink-0 w-4 h-4 mt-1 mr-3 text-text-secondary" />
                  <div className="flex-1 min-w-0">
                    {/* Path/Category */}
                    <div className="text-xs text-text-secondary/80 mb-0.5 truncate">
                      {result.path.split("/").slice(0, -1).join(" / ") ||
                        "Wiki Home"}
                    </div>
                    {/* Title */}
                    <h3 className="text-base font-medium truncate text-text-primary">
                      {highlightText(result.title, searchQuery)}
                    </h3>
                    {/* Excerpt */}
                    <p className="mt-1 text-sm text-text-secondary line-clamp-1">
                      {highlightText(result.excerpt, searchQuery)}...
                    </p>
                  </div>
                </div>
                {/* Enter Icon */}
                {focusedIndex === index && (
                  <CornerDownLeft className="flex-shrink-0 w-4 h-4 text-text-secondary" />
                )}
              </li>
            ))}
          </ul>
        ) : searchQuery.length >= 1 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-text-secondary">
            <p className="text-base">No results found</p>
            <p className="mt-1 text-sm text-text-secondary/80">
              Try narrowing your search?
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-text-secondary">
            <p className="text-base">Search for pages or content</p>
            <p className="mt-1 text-sm text-text-secondary/80">
              Start typing to see results.
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Footer / Pagination Area - Simplified */}
      {(paginationMeta && paginationMeta.totalItems > 0) || isLoading ? ( // Show footer even when loading if results were previously shown
        <div className="flex items-center justify-between flex-shrink-0 px-4 py-2 border-t border-border-default bg-background-level1/80">
          {paginationMeta && paginationMeta.totalItems > 0 ? (
            <div className="text-xs text-text-secondary">
              {paginationMeta.totalItems} result
              {paginationMeta.totalItems !== 1 ? "s" : ""}
            </div>
          ) : (
            <div className="text-xs italic text-text-secondary/70">
              Loading...
            </div>
          )}

          {/* Shortcut Info */}
          <div className="items-center hidden text-xs md:flex gap-x-2 text-text-secondary/80">
            <span>Navigate:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-background-level2 border border-border-light">
              ↑
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-background-level2 border border-border-light">
              ↓
            </kbd>
            <span>Open:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-background-level2 border border-border-light">
              ↵
            </kbd>
            <span>Close:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-background-level2 border border-border-light">
              Esc
            </kbd>
          </div>

          {paginationMeta && paginationMeta.totalPages > 1 ? (
            <div className="flex items-center gap-2">
              {/* Pagination Buttons */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={!paginationMeta.hasPreviousPage}
                className={cn(
                  "flex items-center p-1.5 text-xs rounded",
                  !paginationMeta.hasPreviousPage
                    ? "opacity-50 cursor-not-allowed text-text-secondary/50"
                    : "hover:bg-background-level2 text-text-secondary hover:text-text-primary"
                )}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-xs text-text-secondary min-w-[60px] text-center">
                Page {paginationMeta.currentPage} of {paginationMeta.totalPages}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, paginationMeta.totalPages)
                  )
                }
                onFocus={prefetchNextPage}
                onMouseEnter={prefetchNextPage}
                disabled={!paginationMeta.hasNextPage}
                className={cn(
                  "flex items-center p-1.5 text-xs rounded",
                  !paginationMeta.hasNextPage
                    ? "opacity-50 cursor-not-allowed text-text-secondary/50"
                    : "hover:bg-background-level2 text-text-secondary hover:text-text-primary"
                )}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            // Placeholder to balance the flex layout if pagination isn't shown but results are
            <div className="w-16 h-6"></div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
