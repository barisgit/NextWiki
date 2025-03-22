"use client";

import { useState, useEffect, useRef } from "react";
import { trpc } from "~/lib/trpc/client";
import Link from "next/link";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

// Utility to highlight text
function highlightText(text: string, query: string) {
  if (!query || !text) return text;

  const parts = text.split(new RegExp(`(${query})`, "gi"));

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 text-black px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function SearchBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const initialHighlight = searchParams.get("highlight") || "";

  const [searchQuery, setSearchQuery] = useState(initialHighlight);
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Update search query if URL highlight parameter changes
  useEffect(() => {
    const highlight = searchParams.get("highlight");
    if (highlight) {
      setSearchQuery(highlight);
    }
  }, [searchParams]);

  const { data: searchResults, isLoading } = trpc.search.search.useQuery(
    searchQuery,
    {
      enabled: !!searchQuery && searchQuery.length >= 2,
    }
  );

  // Update URL when search query changes
  const updateHighlightParam = (query: string) => {
    setSearchQuery(query);

    // If search is cleared, remove highlight parameter
    if (!query || query.length < 2) {
      // Use Next.js searchParams to handle URL properly
      const params = new URLSearchParams(searchParams.toString());
      params.delete("highlight");

      // Get the current path and construct a new URL without the highlight parameter
      const newUrl =
        pathname + (params.toString() ? `?${params.toString()}` : "");

      // Use router.push to ensure the page updates properly
      router.push(newUrl);
    }
  };

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-5xl">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground"
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
        placeholder="Search wiki..."
        className="w-full py-2 pl-10 pr-4 text-sm transition-colors border rounded-lg bg-input border-border hover:border-border-hover focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
        value={searchQuery}
        onChange={(e) => updateHighlightParam(e.target.value)}
        onFocus={() => setShowResults(true)}
      />

      {showResults && searchQuery.length >= 2 && (
        <div
          ref={resultsRef}
          className="absolute left-0 right-0 z-10 mt-1 overflow-y-auto border rounded-lg shadow-lg top-full max-h-96 bg-background border-border"
        >
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <svg className="w-5 h-5 mx-auto animate-spin" viewBox="0 0 24 24">
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
              <span className="block mt-2">Searching...</span>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div>
              <div className="px-4 py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">
                  {searchResults.length} results found
                </span>
              </div>
              <ul className="divide-y divide-border">
                {searchResults.map((result) => (
                  <li key={result.id} className="p-4 hover:bg-muted">
                    <Link
                      href={`${result.path}?highlight=${encodeURIComponent(
                        searchQuery
                      )}`}
                      className="block"
                      onClick={() => setShowResults(false)}
                    >
                      <h3 className="mb-1 font-medium text-primary">
                        {highlightText(result.title, searchQuery)}
                      </h3>
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-sm">
                          {result.updatedAt &&
                            new Date(result.updatedAt).toLocaleDateString()}
                        </span>
                      </p>
                      <p className="text-sm text-foreground">
                        {highlightText(result.excerpt, searchQuery)}...
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="p-4 text-center text-muted-foreground">
              No results found for &quot;{searchQuery}&quot;
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
