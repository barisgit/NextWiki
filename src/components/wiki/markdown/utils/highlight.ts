// Utility to highlight occurrences of a text
export function highlightTextInDOM(rootNode: HTMLElement, searchText: string) {
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
            "rounded-sm bg-accent text-accent-foreground highlight-flash";
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
