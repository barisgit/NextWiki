"use client";

import { useEffect, useRef, useState } from "react";
// Import React Markdown using require syntax, or dynamic import if needed
import ReactMarkdown, { type Options } from "react-markdown";
// Handle ESM modules
// Instead of static imports, we'll use these modules dynamically
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { MarkdownProse } from "./MarkdownProse";
import { markdownPlugins } from "./markdown/plugins";
import { markdownComponents } from "./markdown/components";
import {
  highlightTextInDOM,
  clearHighlightsFromDOM,
} from "./markdown/utils/highlight";

interface HighlightedMarkdownProps {
  content: string;
}

export function HighlightedMarkdown({ content }: HighlightedMarkdownProps) {
  // Add state for dynamic imports
  const [plugins, setPlugins] = useState<Options["remarkPlugins"]>([]);
  const [rehypePlugins, setRehypePlugins] = useState<Options["rehypePlugins"]>(
    []
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const highlightTerm = searchParams.get("highlight");
  const router = useRouter();

  // Load the plugins dynamically
  useEffect(() => {
    async function loadPlugins() {
      // Import all plugins dynamically
      const [
        remarkGfm,
        remarkBreaks,
        rehypeHighlight,
        remarkEmoji,
        remarkDirective,
        remarkDirectiveRehype,
      ] = await Promise.all([
        import("remark-gfm").then((m) => m.default),
        import("remark-breaks").then((m) => m.default),
        import("rehype-highlight").then((m) => m.default),
        import("remark-emoji").then((m) => m.default),
        import("remark-directive").then((m) => m.default),
        import("remark-directive-rehype").then((m) => m.default),
      ]);

      setPlugins([
        remarkGfm,
        remarkBreaks,
        remarkEmoji,
        remarkDirective,
        remarkDirectiveRehype,
        ...markdownPlugins,
      ]);

      setRehypePlugins([rehypeHighlight]);
    }

    loadPlugins();
  }, []);

  // Add CSS for the flashing highlight
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes highlightFlash {
        0% { background-color: var(--color-accent-500); }
        50% { background-color: var(--color-accent-200); }
        100% { background-color: var(--color-accent-500); }
      }
      .highlight-flash {
        animation: highlightFlash 2s ease-in-out;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
            remarkPlugins={plugins}
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
