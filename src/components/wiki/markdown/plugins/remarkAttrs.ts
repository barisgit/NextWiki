/**
 * Custom remark plugin to handle attributes like {.class-name}
 */
function remarkAttrs() {
  return (tree) => {
    visit(tree, (node) => {
      // Look for text nodes containing {.class-name} pattern
      if (node.type === "paragraph" && node.children) {
        const lastChild = node.children[node.children.length - 1];

        if (lastChild && lastChild.type === "text") {
          const text = lastChild.value;
          const match = text.match(/\s*\{([.#][^}]+)\}\s*$/);

          if (match) {
            // Remove the {.class-name} from the text
            lastChild.value = text.replace(/\s*\{([.#][^}]+)\}\s*$/, "");

            // Parse classes and IDs
            const attrs = match[1].split(/\s+/);
            const classes = [];
            let id = null;

            attrs.forEach((attr) => {
              if (attr.startsWith(".")) {
                classes.push(attr.slice(1));
              } else if (attr.startsWith("#")) {
                id = attr.slice(1);
              }
            });

            // Apply to previous element if it exists (typically for lists, headers, etc.)
            const prevNode = findPreviousBlockNode(tree, node);
            if (prevNode) {
              if (!prevNode.data) prevNode.data = {};
              if (!prevNode.data.hProperties) prevNode.data.hProperties = {};

              if (classes.length) {
                prevNode.data.hProperties.className = classes;
              }

              if (id) {
                prevNode.data.hProperties.id = id;
              }

              // Remove the paragraph containing only the attributes
              if (node.children.length === 1 && lastChild.value === "") {
                return null; // This will remove the node
              }
            }
          }
        }
      }

      return undefined;
    });
  };
}

// Helper function to find previous block level node
function findPreviousBlockNode(tree, currentNode) {
  let found = false;
  let prevNode = null;

  visit(tree, (node) => {
    if (node === currentNode) {
      found = true;
      return false; // Stop traversal
    }

    if (!found && isBlockNode(node)) {
      prevNode = node;
    }

    return undefined;
  });

  return prevNode;
}

// Helper function to identify block nodes
function isBlockNode(node) {
  return ["heading", "list", "table", "blockquote", "code"].includes(node.type);
}

// We need to import visit from unist-util-visit
import { visit } from "unist-util-visit";

export default remarkAttrs;
