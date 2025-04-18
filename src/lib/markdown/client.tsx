"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { highlightTextInDOM, clearHighlightsFromDOM } from "./utils/highlight";
import { createMarkdownProcessor } from "./factory";
import { MarkdownProse } from "~/components/wiki/MarkdownProse";

// Get client-side markdown configuration
const clientMarkdownConfig = createMarkdownProcessor("client");

interface HighlightedMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Client-side markdown renderer with highlighting capabilities
 */
export function HighlightedMarkdown({
  content,
  className,
}: HighlightedMarkdownProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const highlightTerm = searchParams.get("highlight");
  const router = useRouter();
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (contentRef.current) {
      if (highlightTerm) {
        // Execute the highlighting after rendering the markdown
        const firstHighlight = highlightTextInDOM(
          contentRef.current,
          highlightTerm
        );

        // Scroll to the first highlight with a small delay to ensure the DOM has updated
        if (
          firstHighlight &&
          (isInitialRender.current ||
            !document.activeElement?.contains(firstHighlight))
        ) {
          setTimeout(() => {
            firstHighlight.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
        }
      } else {
        // Clear highlights if the highlight parameter is removed
        clearHighlightsFromDOM(contentRef.current);
      }
    }

    isInitialRender.current = false;
  }, [highlightTerm, content]);

  // Method to clear highlights
  const clearHighlights = () => {
    // Using Next.js Router and searchParams
    const params = new URLSearchParams(searchParams.toString());
    params.delete("highlight");

    // Get the current path and construct a new URL without the highlight parameter
    const newUrl =
      pathname + (params.toString() ? `?${params.toString()}` : "");

    // Manually clear highlights from DOM to ensure immediate visual feedback
    if (contentRef.current) {
      clearHighlightsFromDOM(contentRef.current);
    }

    // Use router.push instead of replace to ensure the page updates properly
    router.push(newUrl, { scroll: false });
  };

  return (
    <>
      {highlightTerm && (
        <div className="flex items-center justify-between p-3 my-4 rounded-md bg-background-level1">
          <span className="text-sm">
            Showing results for: <strong>{highlightTerm}</strong>
          </span>
          <button
            onClick={clearHighlights}
            className="px-2 py-1 text-xs rounded-md bg-accent text-accent-foreground hover:bg-accent/80"
          >
            Clear highlights
          </button>
        </div>
      )}
      <div className={`prose max-w-none dark:prose-invert ${className || ""}`}>
        <div ref={contentRef}>
          <ReactMarkdown
            remarkPlugins={clientMarkdownConfig.remarkPlugins}
            rehypePlugins={clientMarkdownConfig.rehypePlugins}
            components={clientMarkdownConfig.components}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </>
  );
}

interface HighlightedContentProps {
  content: string;
  renderedHtml?: string | null;
  className?: string;
}

/**
 * Client-side component that handles highlighting for both pre-rendered HTML and markdown content
 */
export function HighlightedContent({
  content,
  renderedHtml,
  className,
}: HighlightedContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const highlightTerm = searchParams.get("highlight");
  const router = useRouter();
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (contentRef.current) {
      if (highlightTerm) {
        // Execute the highlighting after rendering the content
        const firstHighlight = highlightTextInDOM(
          contentRef.current,
          highlightTerm
        );

        // Scroll to the first highlight with a small delay to ensure the DOM has updated
        if (
          firstHighlight &&
          (isInitialRender.current ||
            !document.activeElement?.contains(firstHighlight))
        ) {
          setTimeout(() => {
            firstHighlight.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
        }
      } else {
        // Clear highlights if the highlight parameter is removed
        clearHighlightsFromDOM(contentRef.current);
      }
    }

    isInitialRender.current = false;
  }, [highlightTerm, content, renderedHtml]);

  // Handle internal link clicks for pre-rendered content
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Check if this is an internal link (has internal-link class)
      const isInternalLink = anchor.classList.contains("internal-link");

      // Only handle internal links with client-side navigation
      if (isInternalLink) {
        e.preventDefault();
        router.push(href);
      }
    };

    // Only add this listener if we're using pre-rendered HTML
    if (renderedHtml && contentRef.current) {
      contentRef.current.addEventListener("click", handleLinkClick);
    }

    return () => {
      if (contentRef.current) {
        contentRef.current.removeEventListener("click", handleLinkClick);
      }
    };
  }, [router, renderedHtml]);

  // Method to clear highlights
  const clearHighlights = () => {
    // Using Next.js Router and searchParams
    const params = new URLSearchParams(searchParams.toString());
    params.delete("highlight");

    // Get the current path and construct a new URL without the highlight parameter
    const newUrl =
      pathname + (params.toString() ? `?${params.toString()}` : "");

    // Manually clear highlights from DOM to ensure immediate visual feedback
    if (contentRef.current) {
      clearHighlightsFromDOM(contentRef.current);
    }

    // Use router.push instead of replace to ensure the page updates properly
    router.push(newUrl, { scroll: false });
  };

  return (
    <>
      {highlightTerm && (
        <div className="flex items-center justify-between p-3 my-4 rounded-md bg-background-level1">
          <span className="text-sm">
            Showing results for: <strong>{highlightTerm}</strong>
          </span>
          <button
            onClick={clearHighlights}
            className="px-2 py-1 text-xs rounded-md bg-accent text-accent-foreground hover:bg-accent/80"
          >
            Clear highlights
          </button>
        </div>
      )}
      <MarkdownProse className={className}>
        <div ref={contentRef}>
          {renderedHtml ? (
            <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          ) : (
            <ReactMarkdown
              remarkPlugins={clientMarkdownConfig.remarkPlugins}
              rehypePlugins={clientMarkdownConfig.rehypePlugins}
              components={clientMarkdownConfig.components}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
      </MarkdownProse>
    </>
  );
}
