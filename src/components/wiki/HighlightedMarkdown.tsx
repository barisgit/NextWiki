"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import remarkEmoji from "remark-emoji";
import remarkDirective from "remark-directive";
import remarkDirectiveRehype from "remark-directive-rehype";
import { MarkdownProse } from "./MarkdownProse";
import { markdownPlugins as customMarkdownPlugins } from "./markdown/plugins";
import { markdownComponents } from "./markdown/components";
import {
  highlightTextInDOM,
  clearHighlightsFromDOM,
} from "./markdown/utils/highlight";

interface HighlightedMarkdownProps {
  content: string;
}

// Define plugin arrays directly
const remarkPlugins = [
  remarkGfm,
  remarkBreaks,
  remarkEmoji,
  remarkDirective,
  remarkDirectiveRehype,
  ...customMarkdownPlugins,
];

const rehypePlugins = [rehypeHighlight];

export function HighlightedMarkdown({ content }: HighlightedMarkdownProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const highlightTerm = searchParams.get("highlight");
  const router = useRouter();

  useEffect(() => {
    if (contentRef.current) {
      if (highlightTerm) {
        // Execute the highlighting after rendering the markdown
        highlightTextInDOM(contentRef.current, highlightTerm);
      } else {
        // Clear highlights if the highlight parameter is removed
        clearHighlightsFromDOM(contentRef.current);
      }
    }
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
        <div className="flex items-center justify-between p-2 rounded-md bg-background-level1">
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
      <MarkdownProse>
        <div ref={contentRef}>
          <ReactMarkdown
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </div>
      </MarkdownProse>
    </>
  );
}
