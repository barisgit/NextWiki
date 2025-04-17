"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useTRPC } from "~/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Folder, File, Loader2, ChevronRight, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Button } from "~/components/ui/button";

interface FolderNode {
  name: string;
  path: string;
  type: "folder" | "page";
  children: FolderNode[];
  id?: number;
  title?: string;
  updatedAt?: Date | string | null;
}

// TODO: Fix vertical lines not being connected and one depth missing from compressed layout

// Constants for depth control
// FIXME: This compression is not working as expected (doesnt show right compressed folders)
const MAX_VISIBLE_DEPTH = 4; // Maximum levels to show in normal view
const COMPRESS_THRESHOLD = 3; // Min number of hidden levels to enable compression
const INDENTATION_WIDTH = 4; // Width of each indentation level

// Recursive component for tree items
function WikiTreeItem({
  item,
  activeItemPath,
  expandedFolders,
  toggleFolder,
  allNodes,
  depth = 0,
}: {
  item: FolderNode;
  activeItemPath: string | null;
  expandedFolders: Set<string>;
  toggleFolder: (e: React.MouseEvent, folder: FolderNode) => void;
  allNodes: Map<string, FolderNode>;
  depth?: number;
}) {
  const isActive = item.path === activeItemPath;
  const isExpanded = expandedFolders.has(item.path);
  const hasChildren = item.children && item.children.length > 0;

  // Check if this is the parent of the active item
  const activeParentPath = (activeItemPath ?? "")
    .split("/")
    .slice(0, (activeItemPath ?? "").split("/").length - 1)
    .join("/");
  const isParentOfActive = activeParentPath === item.path;

  // Check if this is a sibling of active item (shares same parent)
  const activeSiblingParentPath = (activeItemPath ?? "")
    .split("/")
    .slice(0, (activeItemPath ?? "").split("/").length - 1)
    .join("/");
  const itemParentPath = item.path
    .split("/")
    .slice(0, item.path.split("/").length - 1)
    .join("/");
  const isSiblingOfActive =
    itemParentPath === activeSiblingParentPath && itemParentPath !== "";

  // Child of active check
  const isChildOfActive =
    activeItemPath && item.path.startsWith(activeItemPath + "/");

  // Check if this item is in the ancestry line of the active item
  const isInActivePath = activeItemPath?.startsWith(item.path + "/") || false;

  // Determine if this node should be visible normally
  const shouldRenderNormally =
    depth < MAX_VISIBLE_DEPTH ||
    isActive ||
    isChildOfActive ||
    isParentOfActive ||
    isSiblingOfActive;

  // If not in active path and not normally visible, skip
  if (!shouldRenderNormally && !isInActivePath) {
    return null;
  }

  // Special handling for deep nesting in active path
  if (
    depth >= MAX_VISIBLE_DEPTH &&
    isInActivePath &&
    !isActive &&
    !isParentOfActive
  ) {
    // Find the next relevant node in the active path
    if (activeItemPath) {
      // Find the next visible node in the ancestry chain
      const nextVisibleAncestor = findNextVisibleAncestor(
        item,
        activeItemPath,
        allNodes
      );

      if (nextVisibleAncestor) {
        return (
          <div className="relative space-y-1">
            <div className="flex">
              <div
                className="relative flex-shrink-0"
                style={{ width: `${depth * INDENTATION_WIDTH}px` }}
              >
                {/* Add vertical connecting lines for each level of depth */}
                {Array.from({ length: depth }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-l border-border-light/50"
                    style={{
                      left: `${
                        i * INDENTATION_WIDTH + INDENTATION_WIDTH / 2
                      }px`,
                      height: "100%",
                    }}
                  />
                ))}
              </div>
              <div className="px-2 py-1.5 text-xs italic font-bold text-muted-foreground flex items-center">
                <span className="text-primary font-mono bg-primary-100 dark:bg-primary/5 px-1.5 py-0.5 rounded">
                  {/* Display the compressed path if needed */}
                  {getCompressedPath(item.path, nextVisibleAncestor.path)}
                </span>
              </div>
            </div>

            {/* Render the next visible ancestor */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center flex-1 min-w-0">
                  <WikiTreeItem
                    item={nextVisibleAncestor}
                    activeItemPath={activeItemPath}
                    expandedFolders={expandedFolders}
                    toggleFolder={toggleFolder}
                    allNodes={allNodes}
                    depth={calculateRelativeDepth(
                      item.path,
                      nextVisibleAncestor.path,
                      depth
                    )}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{nextVisibleAncestor.title || nextVisibleAncestor.name}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        );
      }
    }
  }

  return (
    <div className="relative space-y-1">
      <div className="flex items-center">
        <div
          className="relative flex-shrink-0"
          style={{ width: `${depth * INDENTATION_WIDTH}px` }}
        >
          {/* Add vertical connecting lines for each level of depth */}
          {Array.from({ length: depth }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-border-light/50"
              style={{
                left: `${i * INDENTATION_WIDTH + INDENTATION_WIDTH / 2}px`,
                height: "100%",
              }}
            />
          ))}
        </div>

        <Tooltip delayDuration={1000}>
          <TooltipTrigger asChild>
            <div className="flex items-center flex-1 min-w-0">
              {item.type === "folder" && hasChildren ? (
                <button
                  onClick={(e) => toggleFolder(e, item)}
                  className="flex items-center justify-center px-0.5 py-1.5 mr-0.5 focus:outline-none flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              ) : (
                <div className="w-4 mr-0.5 flex-shrink-0"></div>
              )}

              <Link
                href={`/${item.path}`}
                className={`flex flex-1 items-center px-2 py-1.5 text-sm rounded hover:bg-card-hover text-text-primary font-medium transition-colors min-w-0 ${
                  isActive ? "bg-primary/10 text-primary font-semibold" : ""
                }`}
              >
                {item.type === "folder" ? (
                  <Folder className="flex-shrink-0 w-4 h-4 mr-2 text-primary" />
                ) : (
                  <File className="flex-shrink-0 w-4 h-4 mr-2 text-accent-600" />
                )}
                <span className="truncate">{item.title || item.name}</span>
              </Link>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="text-xs font-bold border shadow-lg bg-background-level1 text-accent-900 dark:text-accent-50 border-border-default"
          >
            <p>{item.title || item.name}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Recursively render children if expanded */}
      {isExpanded && hasChildren && (
        <div className="mt-0.5">
          {item.children.map((child) => (
            <WikiTreeItem
              key={child.path}
              item={child}
              activeItemPath={activeItemPath}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              allNodes={allNodes}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to find the next visible ancestor in the path
function findNextVisibleAncestor(
  currentNode: FolderNode,
  activeItemPath: string,
  allNodes: Map<string, FolderNode>
): FolderNode | null {
  // Get path segments for the active item
  const activeSegments = activeItemPath.split("/");
  const currentSegments = currentNode.path.split("/");

  // Find where paths diverge
  let commonPrefixLength = 0;
  while (
    commonPrefixLength < currentSegments.length &&
    commonPrefixLength < activeSegments.length &&
    currentSegments[commonPrefixLength] === activeSegments[commonPrefixLength]
  ) {
    commonPrefixLength++;
  }

  // Look for the next meaningful node in the path to active
  // Which would be either:
  // 1. The parent of the active item
  // 2. A node that's at most 2 levels down from current
  let nextNodePath = "";

  // Try the parent of active first
  const activeParentPath = activeSegments
    .slice(0, activeSegments.length - 1)
    .join("/");
  if (
    allNodes.has(activeParentPath) &&
    activeParentPath.startsWith(currentNode.path)
  ) {
    return allNodes.get(activeParentPath)!;
  }

  // Otherwise find a node 1-2 levels down from current toward active
  const targetDepth = Math.min(
    commonPrefixLength + 2,
    activeSegments.length - 1
  );
  nextNodePath = activeSegments.slice(0, targetDepth).join("/");

  if (allNodes.has(nextNodePath)) {
    return allNodes.get(nextNodePath)!;
  }

  return null;
}

// Get a nicely formatted compressed path between two nodes
function getCompressedPath(startPath: string, endPath: string): string {
  if (!endPath.startsWith(startPath)) {
    return "...";
  }

  const startSegments = startPath.split("/");
  const endSegments = endPath.split("/");

  // Get all the segments that are skipped
  const skippedSegments = endSegments.slice(
    startSegments.length,
    endSegments.length
  );

  if (skippedSegments.length === 0) {
    return "";
  } else if (skippedSegments.length === 1) {
    // If only one segment is skipped, just show it
    return skippedSegments[0];
  } else if (skippedSegments.length <= COMPRESS_THRESHOLD) {
    // For 2-3 segments, show all of them joined with /
    return skippedSegments.join("/");
  } else {
    // For many segments, use fish shell style abbreviation
    return skippedSegments.map((s) => s[0]).join("/");
  }
}

// Calculate the relative depth for rendering the next ancestor
function calculateRelativeDepth(
  currentPath: string,
  nextPath: string,
  currentDepth: number
): number {
  const currentSegments = currentPath.split("/").length;
  const nextSegments = nextPath.split("/").length;

  // Calculate segment difference
  const segmentDifference = nextSegments - currentSegments;

  // Limit the depth increase to a maximum of 2 levels regardless of how many we've skipped
  // This keeps the indentation reasonable after compression
  const maxDepthIncrease = Math.min(2, segmentDifference);

  // Adjust depth based on how many levels we've jumped, but with a cap
  return currentDepth + maxDepthIncrease;
}

export function Sidebar() {
  const [rootItems, setRootItems] = useState<FolderNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeItemPath, setActiveItemPath] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [allNodes, setAllNodes] = useState<Map<string, FolderNode>>(new Map());
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const scrollAreaContainerRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Get current pathname and router
  const pathname = usePathname();
  const router = useRouter();

  // Remove leading slash for comparison with path values
  const currentPath = pathname?.startsWith("/")
    ? pathname.substring(1)
    : pathname;

  const trpc = useTRPC();

  // Fetch top-level folder structure
  const { data: folderStructure } = useQuery(
    trpc.wiki.getFolderStructure.queryOptions()
  );

  useEffect(() => {
    if (folderStructure) {
      // Extract top-level items (direct children of root)
      setRootItems(folderStructure.children || []);
      setIsLoading(false);

      // Highlight the current active path
      setActiveItemPath(currentPath || null);

      // Create a map of all nodes for quick lookup
      const nodeMap = new Map<string, FolderNode>();
      populateNodeMap(folderStructure, nodeMap);
      setAllNodes(nodeMap);

      // Find any parent folders of the current path to auto-expand them
      if (currentPath) {
        findAndExpandParentFolders(folderStructure, currentPath);
      }
    }
  }, [folderStructure, currentPath]);

  // Effect to check scrollability and attach scroll listener
  useEffect(() => {
    const container = scrollAreaContainerRef.current;
    if (!container) return;

    // Find the actual viewport element within the ScrollArea component
    const viewport = container.querySelector<HTMLDivElement>(
      "[data-radix-scroll-area-viewport]"
    );

    if (!viewport) {
      setIsScrollable(false);
      setIsAtBottom(true); // If no viewport, assume we are at the bottom
      return;
    }

    // Assign viewport to ref for listener attachment
    scrollViewportRef.current = viewport;

    const handleScroll = () => {
      if (!scrollViewportRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } =
        scrollViewportRef.current;

      // Check if scrollable (with tolerance)
      const canScroll = scrollHeight > clientHeight + 1;
      setIsScrollable(canScroll);

      // Check if scrolled to bottom (with tolerance)
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
      setIsAtBottom(atBottom);
    };

    // Initial check
    handleScroll();

    // Add scroll listener to the viewport
    viewport.addEventListener("scroll", handleScroll);
    // Also check on window resize as it might change scrollability/position
    window.addEventListener("resize", handleScroll);

    // Cleanup listeners
    return () => {
      viewport.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
    // Rerun when items load or change, as this affects scrollHeight
  }, [rootItems, isLoading]);

  // Build a map of all nodes for quick access
  const populateNodeMap = (node: FolderNode, map: Map<string, FolderNode>) => {
    if (node.path) {
      map.set(node.path, node);
    }

    if (node.children) {
      for (const child of node.children) {
        populateNodeMap(child, map);
      }
    }
  };

  // Find all parent folders of current path and expand them
  const findAndExpandParentFolders = (structure: FolderNode, path: string) => {
    if (!path) return;

    // Split the path by slashes to get all segments
    const pathSegments = path.split("/");
    let currentPath = "";

    // For each segment, build up the path and check if it's a folder
    for (let i = 0; i < pathSegments.length; i++) {
      if (i > 0) currentPath += "/";
      currentPath += pathSegments[i];

      // Find this node in the tree structure
      const node = findNodeByPath(structure, currentPath);

      // If it's a folder, expand it
      if (node && node.type === "folder") {
        setExpandedFolders((prev) => new Set([...prev, node.path]));
      }
    }
  };

  // Helper to find a node by path
  const findNodeByPath = (
    structure: FolderNode,
    path: string
  ): FolderNode | null => {
    if (structure.path === path) return structure;

    const findNode = (node: FolderNode): FolderNode | null => {
      if (node.path === path) return node;

      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child);
          if (found) return found;
        }
      }

      return null;
    };

    for (const item of structure.children || []) {
      const found = findNode(item);
      if (found) return found;
    }

    return null;
  };

  // Toggle folder expansion when clicking on a folder
  const toggleFolder = (e: React.MouseEvent, folder: FolderNode) => {
    e.preventDefault();
    e.stopPropagation();

    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folder.path)) {
        newSet.delete(folder.path);
      } else {
        newSet.add(folder.path);
      }
      return newSet;
    });

    // Navigate to the folder page
    router.push(`/${folder.path}`);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen p-1 border-r shadow-sm w-72 bg-background-paper border-border text-text-primary">
        <div className="p-3 mb-2">
          <Link href="/" className="text-2xl font-bold text-primary">
            NextWiki
          </Link>
        </div>

        <nav className="space-y-1">
          <Link
            href="/"
            className={`flex items-center px-4 py-2 text-sm rounded-lg hover:bg-card-hover text-text-primary font-medium transition-colors ${
              pathname === "/" ? "bg-primary/10 text-primary" : ""
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 mr-3 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Home
          </Link>
          <Link
            href="/wiki"
            className={`flex items-center px-4 py-2 text-sm rounded-lg hover:bg-card-hover text-text-primary font-medium transition-colors ${
              pathname === "/wiki" ? "bg-primary/10 text-primary" : ""
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 mr-3 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            All Pages
          </Link>
          <Link
            href="/tags"
            className={`flex items-center px-4 py-2 text-sm rounded-lg hover:bg-card-hover text-text-primary font-medium transition-colors ${
              pathname === "/tags" ? "bg-primary/10 text-primary" : ""
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 mr-3 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            Tags
          </Link>
        </nav>

        {/* Horizontal separator */}
        <hr className="my-4 border-t border-border-light" />

        {/* Top Level Wiki Structure */}
        <div
          ref={scrollAreaContainerRef}
          className={`scroll-indicator-container relative flex flex-col min-h-0 flex-1 ${
            isScrollable ? "is-scrollable" : ""
          }`}
          data-scroll-bottom={isAtBottom}
        >
          <h3 className="flex-shrink-0 mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Wiki Structure
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : rootItems.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">No pages yet</p>
          ) : (
            <ScrollArea className="flex-1 pr-4">
              <div className="pb-4 space-y-1">
                {/* File tree with smart rendering */}
                {rootItems.map((item) => (
                  <WikiTreeItem
                    key={item.path}
                    item={item}
                    activeItemPath={activeItemPath}
                    expandedFolders={expandedFolders}
                    toggleFolder={toggleFolder}
                    allNodes={allNodes}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="p-3 mt-4">
          <Link href="/create">
            <Button className="w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Page
            </Button>
          </Link>
        </div>
      </div>
    </TooltipProvider>
  );
}
