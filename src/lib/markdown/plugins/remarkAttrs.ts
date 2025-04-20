/**
 * Custom remark plugin to handle attributes like {.class-name}
 */
import type { Node } from "unist";
import { visit } from "unist-util-visit";

interface NodeWithData extends Node {
  data?: {
    hProperties?: {
      className?: string[];
      id?: string;
    };
  };
}

function remarkAttrs() {
  return (tree: Node) => {
    visit(tree, (node: NodeWithData) => {
      // Look for text nodes containing {.class-name} pattern
      if (node.type === "paragraph" && "children" in node) {
        if (!Array.isArray(node.children)) return;
        const lastChild = node.children[node.children.length - 1];

        if (lastChild && lastChild.type === "text") {
          const text = lastChild.value;
          const match = text.match(/\s*\{([.#][^}]+)\}\s*$/);

          if (match) {
            // Remove the {.class-name} from the text
            lastChild.value = text.replace(/\s*\{([.#][^}]+)\}\s*$/, "");

            // Parse classes and IDs
            const attrs = match[1].split(/\s+/);
            const classes: string[] = [];
            let id: string | null = null;

            attrs.forEach((attr: string) => {
              if (attr.startsWith(".")) {
                classes.push(attr.slice(1));
              } else if (attr.startsWith("#")) {
                id = attr.slice(1);
              }
            });

            // Apply to previous element if it exists (typically for lists, headers, etc.)
            const prevNode = findPreviousBlockNode(tree, node);
            if (prevNode) {
              const prevBlock = prevNode as NodeWithData;

              if (!prevBlock.data) prevBlock.data = {};
              if (!prevBlock.data.hProperties) prevBlock.data.hProperties = {};

              if (classes.length) {
                prevBlock.data.hProperties.className = classes;
              }

              if (id) {
                prevBlock.data.hProperties.id = id;
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
function findPreviousBlockNode(tree: Node, currentNode: Node): Node | null {
  let found = false;
  let prevNode: Node | null = null;

  visit(tree, (node: Node) => {
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
function isBlockNode(node: Node): boolean {
  return ["heading", "list", "table", "blockquote", "code"].includes(node.type);
}

export default remarkAttrs;
