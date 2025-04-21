/**
 * Testing utilities for markdown rendering consistency
 */

import { createClientMarkdownProcessor } from "../client-factory";
import { renderMarkdownToHtml } from "../server";
import { logger } from "~/lib/utils/logger";

/**
 * Normalizes HTML structure to account for differences between server-rendered HTML
 * and React component output (e.g., extra attributes, whitespace).
 * Relies on the JSDOM environment provided by Jest.
 * @param html The raw HTML string
 * @returns A normalized HTML string
 */
export function normalizeHtml(html: string): string {
  if (typeof document === "undefined") {
    // This should not happen in a Jest JSDOM environment
    // but provides a safeguard
    logger.warn("normalizeHtml called outside of JSDOM environment");
    return html.trim();
  }

  // Create a temporary div to parse and normalize the HTML
  const container = document.createElement("div");
  container.innerHTML = html;

  // Function to recursively clean attributes and normalize whitespace
  const cleanNode = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as globalThis.Element; // Use globalThis.Element to avoid ambiguity
      // Remove potentially problematic/inconsistent attributes
      ["data-reactroot", "style", "class"].forEach((attr) => {
        if (!element.hasAttribute(attr) || element.getAttribute(attr) === "") {
          element.removeAttribute(attr);
        }
      });
      // Remove any attributes starting with data- or on (event handlers)
      const attrsToRemove = Array.from(element.attributes).filter(
        (attr) => attr.name.startsWith("data-") || attr.name.startsWith("on")
      );
      attrsToRemove.forEach((attr) => element.removeAttribute(attr.name));

      // Sort attributes for consistency (optional but helpful)
      const sortedAttrs = Array.from(element.attributes).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      // Remove all current attributes before adding sorted ones
      while (element.attributes.length > 0) {
        element.removeAttribute(element.attributes[0].name);
      }
      // Add attributes back in sorted order
      sortedAttrs.forEach((attr) =>
        element.setAttribute(attr.name, attr.value)
      );
    } else if (node.nodeType === Node.TEXT_NODE) {
      // Normalize whitespace in text nodes
      node.nodeValue = node.nodeValue?.replace(/\s+/g, " ").trim() || "";
      // Remove empty text nodes
      if (!node.nodeValue) {
        node.parentNode?.removeChild(node);
        return; // Skip to next node after removal
      }
    } else if (node.nodeType === Node.COMMENT_NODE) {
      // Remove comments
      node.parentNode?.removeChild(node);
      return; // Skip to next node after removal
    }

    // Recursively clean child nodes
    Array.from(node.childNodes).forEach(cleanNode);
  };

  cleanNode(container);

  // Return the cleaned innerHTML, potentially trimming leading/trailing whitespace
  return container.innerHTML.trim();
}

/**
 * Compares server-rendered and client-rendered markdown output for consistency
 *
 * @param markdown The markdown content to test
 * @returns Object containing both outputs and whether they are consistent
 */
export async function compareRenderedOutput(markdown: string) {
  // Get server-rendered HTML
  const serverHtml = await renderMarkdownToHtml(markdown);

  // Get the configuration used for client rendering
  const clientConfig = createClientMarkdownProcessor();

  return {
    serverOutput: normalizeHtml(serverHtml),
    // This is a placeholder - in real tests you would render the actual component
    clientOutput: `Client would render with: ${clientConfig.remarkPlugins.length} remark plugins`,
    // In real tests, you would compare the normalized outputs
    isConsistent: false, // Placeholder

    // Instructions for real test implementation
    testImplementationNotes: `
    In actual tests, use:
    1. jest-dom or testing-library to render the React component 
    2. Extract HTML using container.innerHTML
    3. Use the normalizeHtml function to prepare both outputs
    4. Compare the normalized HTML strings
    `,
  };
}

/**
 * Test cases covering different markdown features to ensure consistency
 */
export const consistencyTestCases = [
  {
    name: "Basic text formatting",
    markdown: "**Bold text** and *italic text* and ~~strikethrough~~",
  },
  {
    name: "Headings",
    markdown: "# Heading 1\n## Heading 2\n### Heading 3",
  },
  {
    name: "Links",
    markdown: "[Link text](https://example.com) and [Internal link](/page)",
  },
  {
    name: "Lists",
    markdown:
      "- Item 1\n- Item 2\n  - Nested item\n1. Ordered item 1\n2. Ordered item 2",
  },
  {
    name: "Code blocks",
    markdown: "```typescript\nconst x: number = 42;\n```",
  },
  {
    name: "Tables",
    markdown:
      "| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |",
  },
  {
    name: "Custom class attributes",
    markdown:
      "# Heading with class {.custom-class}\n\nParagraph with class {.text-class}",
  },
];
