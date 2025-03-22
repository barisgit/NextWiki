"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { MarkdownProse } from "./MarkdownProse";

// Utility to highlight occurrences of a text
function highlightTextInDOM(rootNode: HTMLElement, searchText: string) {
  if (!searchText || searchText.trim() === "") return;

  const searchTextLower = searchText.toLowerCase();

  // Create a TreeWalker to iterate through all text nodes
  const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      // Skip text nodes in pre and code elements (to avoid highlighting in code blocks)
      let parent = node.parentElement;
      while (parent) {
        if (parent.tagName === "PRE" || parent.tagName === "CODE") {
          return NodeFilter.FILTER_REJECT;
        }
        parent = parent.parentElement;
      }

      // Accept node if it contains the search text
      if (node.textContent?.toLowerCase().includes(searchTextLower)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_REJECT;
    },
  });

  const nodesToReplace: Array<{ node: Node; replacements: Array<Node> }> = [];
  let currentNode: Node | null;

  // Identify nodes that need replacement
  while ((currentNode = walker.nextNode())) {
    const text = currentNode.textContent || "";
    const parts = text.split(new RegExp(`(${searchText})`, "gi"));

    if (parts.length > 1) {
      const replacements: Array<Node> = [];

      for (const part of parts) {
        if (part.toLowerCase() === searchTextLower) {
          // Create highlight span
          const mark = document.createElement("mark");
          mark.className =
            "bg-yellow-200 text-black px-0.5 rounded highlight-flash";
          mark.textContent = part;
          replacements.push(mark);
        } else if (part) {
          // Keep non-matching parts as text nodes
          replacements.push(document.createTextNode(part));
        }
      }

      nodesToReplace.push({
        node: currentNode,
        replacements,
      });
    }
  }

  // Replace identified nodes with highlighted versions
  for (const { node, replacements } of nodesToReplace) {
    const parent = node.parentNode;
    if (parent) {
      const fragment = document.createDocumentFragment();
      replacements.forEach((replacement) => fragment.appendChild(replacement));
      parent.replaceChild(fragment, node);
    }
  }

  // Scroll to first highlight if exists
  const firstHighlight = rootNode.querySelector("mark");
  if (firstHighlight) {
    // Slight delay to ensure DOM is updated
    setTimeout(() => {
      firstHighlight.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }
}

// Helper function to clear highlight marks from DOM
function clearHighlightsFromDOM(rootNode: HTMLElement) {
  // Find all mark elements
  const marks = rootNode.querySelectorAll("mark.highlight-flash");

  // Replace each mark with its text content
  marks.forEach((mark) => {
    const text = document.createTextNode(mark.textContent || "");
    if (mark.parentNode) {
      mark.parentNode.replaceChild(text, mark);
    }
  });
}

interface HighlightedMarkdownProps {
  content: string;
}

export function HighlightedMarkdown({ content }: HighlightedMarkdownProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const highlightTerm = searchParams.get("highlight");
  const router = useRouter();

  // Add CSS for the flashing highlight
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes highlightFlash {
        0% { background-color: #fef08a; }
        50% { background-color: #facc15; }
        100% { background-color: #fef08a; }
      }
      .highlight-flash {
        animation: highlightFlash 1s ease-in-out;
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
        <div className="flex items-center justify-between p-2 rounded-md bg-muted">
          <span className="text-sm">
            Showing results for: <strong>{highlightTerm}</strong>
          </span>
          <button
            onClick={clearHighlights}
            className="px-2 py-1 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Clear highlights
          </button>
        </div>
      )}
      <MarkdownProse>
        <div ref={contentRef}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
        </div>
      </MarkdownProse>
    </>
  );
}
