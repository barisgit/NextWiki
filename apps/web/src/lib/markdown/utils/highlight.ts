/**
 * Utilities for text highlighting in the DOM
 */

/**
 * Highlights occurrences of a text within a DOM node
 * @param rootNode The root DOM node to search within
 * @param searchText The text to highlight
 * @returns The first highlighted element or null if none were created
 */
export function highlightTextInDOM(
  rootNode: HTMLElement,
  searchText: string
): HTMLElement | null {
  if (!searchText || searchText.trim() === "") return null;

  const searchTextLower = searchText.toLowerCase();
  let firstHighlight: HTMLElement | null = null;

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
            "rounded-sm bg-accent text-accent-foreground highlight-flash";
          mark.textContent = part;
          replacements.push(mark);

          // Store the first highlight we create
          if (!firstHighlight) {
            firstHighlight = mark;
          }
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

  // Replace nodes with their highlighted versions
  nodesToReplace.forEach(({ node, replacements }) => {
    if (node.parentNode) {
      // Insert all replacement nodes
      replacements.forEach((replacement) => {
        node.parentNode!.insertBefore(replacement, node);
      });
      // Remove the original node
      node.parentNode.removeChild(node);
    }
  });

  return firstHighlight;
}

/**
 * Clears all highlight marks from a DOM node
 * @param rootNode The root DOM node to clear highlights from
 */
export function clearHighlightsFromDOM(rootNode: HTMLElement) {
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
