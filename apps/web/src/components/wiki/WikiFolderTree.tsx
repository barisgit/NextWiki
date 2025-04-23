"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FolderIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileTextIcon,
  PlusCircleIcon,
  PencilIcon,
  MoveIcon,
  InfoIcon,
} from "lucide-react";
import { useTRPC } from "~/server/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent, cn, Modal } from "@repo/ui";
import { PageLocationEditor } from "./PageLocationEditor";
import { ClientRequirePermission } from "../auth/permission/client";

const DOUBLE_CLICK_THRESHOLD = 500; // milliseconds

// Recursive interface for folder structure
interface FolderNode {
  name: string;
  path: string;
  type: "folder" | "page";
  children: FolderNode[];
  id?: number;
  title?: string;
  updatedAt?: Date | string | null;
  isPublished?: boolean | null;
}

interface WikiFolderTreeProps {
  /**
   * The initially selected path
   */
  currentPath?: string;

  /**
   * Maximum depth to render (0 = unlimited)
   */
  maxDepth?: number;

  /**
   * Show root folder node
   */
  showRoot?: boolean;

  /**
   * Custom class for the container
   */
  className?: string;

  /**
   * Title for the component
   */
  title?: string;

  /**
   * Show only immediate children of the current path
   */
  showOnlyChildren?: boolean;

  /**
   * Hide the header
   */
  hideHeader?: boolean;

  /**
   * Show page count in folders
   */
  showPageCount?: boolean;

  /**
   * Depth to which folders are automatically open and cannot be closed
   */
  openDepth?: number;

  /**
   * Show the legend explaining the icons
   */
  showLegend?: boolean;

  /**
   * Mode of operation: "navigation" (default) or "selection"
   */
  mode?: "navigation" | "selection";

  /**
   * Callback for when a path is selected (used in selection mode)
   */
  onSelectPath?: (path: string) => void;

  /**
   * Show action buttons for folder/page operations
   */
  showActions?: boolean;

  /**
   * Show move button. Separate because sometimes we don't want to show the move button.
   * Needs both showActions and showMove to be true to show the move button.
   */
  showMove?: boolean;

  /**
   * Show the folder tree in a card
   */
  card?: boolean;

  /**
   * Selected path in selection mode
   */
  selectedPath?: string;
}

export function WikiFolderTree({
  currentPath = "",
  maxDepth = 0,
  showRoot = true,
  className = "",
  title = "Wiki Structure",
  showOnlyChildren = false,
  hideHeader = false,
  showPageCount = false,
  openDepth = 0,
  showLegend = true,
  mode = "selection",
  onSelectPath,
  showActions = false,
  showMove = true,
  card = true,
  selectedPath,
}: WikiFolderTreeProps) {
  const router = useRouter();
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});
  const [internalSelectedPath, setInternalSelectedPath] = useState<
    string | null
  >(selectedPath || null);
  const [lastClickInfo, setLastClickInfo] = useState<{
    path: string;
    timestamp: number;
  } | null>(null);
  const [showPageLocationEditor, setShowPageLocationEditor] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState("");
  const [renamingNode, setRenamingNode] = useState<FolderNode | null>(null);
  const [newName, setNewName] = useState("");
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [movingNode, setMovingNode] = useState<FolderNode | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [renameConflict, setRenameConflict] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch the complete folder structure
  const { data: folderStructure, isLoading } = useQuery(
    trpc.wiki.getFolderStructure.queryOptions()
  );

  // Helper function to get parent path
  const getParentPath = (path: string): string => {
    if (!path) return "";
    const pathParts = path.split("/");
    return pathParts.slice(0, -1).join("/");
  };

  const parentPathForRename = renamingNode
    ? getParentPath(renamingNode.path)
    : "";

  const getSubfoldersForRenameQuery = useQuery(
    trpc.wiki.getSubfolders.queryOptions(
      { path: parentPathForRename },
      { enabled: showRenameModal && renamingNode !== null }
    )
  );

  const folderStructureQueryKey = trpc.wiki.getFolderStructure.queryKey();

  // Create a mutation for updating a wiki page
  const updateMutation = useMutation(
    trpc.wiki.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: folderStructureQueryKey,
        });
      },
    })
  );

  // Update internal state if external prop changes
  useEffect(() => {
    setInternalSelectedPath(selectedPath || null);
  }, [selectedPath]);

  // Auto-expand folders in the current path
  useEffect(() => {
    if (currentPath) {
      const pathParts = currentPath.split("/").filter(Boolean);
      let currentPathBuild = "";

      // Create an updated expanded folders object
      const newExpandedFolders = { ...expandedFolders };

      // For each part of the path, expand its parent folder
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        if (part) {
          // Build the path segment by segment
          currentPathBuild = currentPathBuild
            ? `${currentPathBuild}/${part}`
            : part;

          // Mark this segment as expanded
          newExpandedFolders[currentPathBuild] = true;
        }
      }

      setExpandedFolders(newExpandedFolders);
    }
  }, [currentPath]);

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // Unified click handler for nodes
  const handleNodeClick = (node: FolderNode, e: React.MouseEvent) => {
    const now = Date.now();

    // Prevent default link behavior immediately if it's a link event
    // For div/button events, this prevents potential parent handlers if stopPropagation wasn't used
    e.preventDefault();

    // --- Shift+Click Check for immediate navigation ---
    if (e.shiftKey) {
      setInternalSelectedPath(node.path); // Select visually
      setLastClickInfo(null); // Reset double-click tracking
      router.push(`/${node.path}`); // Navigate immediately
      return; // Skip normal logic
    }
    // --- End Shift+Click Check ---

    // Check for double click
    if (
      mode === "navigation" &&
      lastClickInfo &&
      lastClickInfo.path === node.path &&
      now - lastClickInfo.timestamp < DOUBLE_CLICK_THRESHOLD
    ) {
      // Double click detected: Navigate
      setLastClickInfo(null); // Reset click info
      setInternalSelectedPath(node.path); // Ensure it's selected visually
      router.push(`/${node.path}`); // Navigate
    } else {
      // Single click: Select and potentially expand folder
      setLastClickInfo({ path: node.path, timestamp: now });
      setInternalSelectedPath(node.path);

      // If it's a folder, toggle its expansion
      const isFolder = node.type === "folder" || node.children?.length > 0;
      if (isFolder) {
        toggleFolder(node.path);
      }

      // If in selection mode, also call the callback
      if (mode === "selection" && onSelectPath) {
        onSelectPath(node.path);
      }
    }
  };

  // Handle node selection (legacy, kept for potential mode="selection" usage outside clicks)
  const handleSelect = (node: FolderNode, e: React.MouseEvent) => {
    if (mode === "selection" && onSelectPath) {
      e.preventDefault(); // Still prevent default if called directly
      e.stopPropagation();
      onSelectPath(node.path);
      setInternalSelectedPath(node.path); // Keep selection state consistent
    }
  };

  // Open the new folder modal
  const handleNewFolder = (parentPath: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Important: Prevent node click
    setNewFolderPath(parentPath);
    setShowPageLocationEditor(true);
  };

  // Open the rename modal
  const handleRename = (node: FolderNode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Important: Prevent node click
    setRenamingNode(node);
    setNewName(node.title || node.name);
    setRenameConflict(false);
    setShowRenameModal(true);
  };

  // Handle rename
  const renameNode = () => {
    if (!renamingNode || !newName.trim()) return;
    setRenameConflict(false);

    // Check for naming conflicts using subfolders query
    if (getSubfoldersForRenameQuery.data) {
      const subfolders = getSubfoldersForRenameQuery.data;
      const hasConflict = subfolders.some(
        (item) =>
          item.id !== renamingNode.id &&
          item.name.toLowerCase() === newName.toLowerCase()
      );

      if (hasConflict) {
        setRenameConflict(true);
        return;
      }
    }

    if (renamingNode.id) {
      // Update just the title field while keeping the same path
      updateMutation.mutate({
        id: renamingNode.id,
        path: renamingNode.path,
        title: newName,
        // We don't have the content here, pass undefined to keep existing
        content: undefined,
        // Leave isPublished state as is
        isPublished: undefined,
      });
    }

    setShowRenameModal(false);
    setRenamingNode(null);
  };

  // Open the move modal
  const handleMove = (node: FolderNode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Important: Prevent node click
    setMovingNode(node);
    setShowMoveModal(true);
  };

  // Find a specific node in the tree by path
  const findNodeByPath = (
    path: string,
    tree: FolderNode
  ): FolderNode | null => {
    if (tree.path === path) return tree;

    for (const child of tree.children) {
      const found = findNodeByPath(path, child);
      if (found) return found;
    }

    return null;
  };

  // Recursively render a folder node
  const renderNode = (
    node: FolderNode,
    depth = 0
  ): React.ReactElement | null => {
    // Skip rendering if we've reached max depth
    if (maxDepth > 0 && depth > maxDepth) return null;

    const isWithinOpenDepth = depth < openDepth;
    // If within open depth, force expanded regardless of state
    const isExpanded = isWithinOpenDepth || expandedFolders[node.path] || false;
    const hasChildren = node.children && node.children.length > 0;
    const isFolder = node.type === "folder" || hasChildren;
    // const isCurrent = currentPath === node.path; // Not directly used for styling anymore
    // Update isSelected to use internal state
    const isSelected = internalSelectedPath === node.path;

    // Count the direct children by type
    const pageCount = node.children.filter((c) => c.type === "page").length;
    const folderCount = node.children.filter(
      (c) => c.type === "folder" || c.children.length > 0
    ).length;

    // Get full path for tooltip
    const fullPath = node.path ? `/${node.path}` : "/";

    // Create common child elements for both navigation and selection modes
    const childElements = (
      <>
        {/* Expansion chevron button - now handled within the main clickable div */}
        {/* Folder/File Icon */}
        {isFolder ? (
          <FolderIcon
            className={`mr-2 h-5 w-5 flex-shrink-0 ${
              node.id ? "text-primary" : "text-secondary-700"
            }`}
            aria-label={
              node.id
                ? "Real folder with content"
                : "Virtual folder (no content)"
            }
          />
        ) : (
          <FileTextIcon className="text-text-secondary mr-2 h-5 w-5 flex-shrink-0" />
        )}

        {/* Name, Path, Counts */}
        <div className="flex min-w-0 flex-grow flex-row items-center gap-2">
          <span className="truncate font-medium">
            {node.title || node.name}
          </span>
          {/* Re-enable path display */}
          <span className="text-text-tertiary max-w-[40%] truncate text-xs">
            /{node.path} {/* Added leading slash */}
          </span>
          {isFolder && (
            <div className="text-text-primary flex flex-shrink-0 space-x-1 text-xs font-bold">
              {showPageCount && pageCount > 0 && (
                <span
                  title={`${pageCount} page${pageCount !== 1 ? "s" : ""}`}
                  className="bg-complementary/30 rounded-md px-1.5 py-0.5"
                >
                  {pageCount}p
                </span>
              )}
              {folderCount > 0 && (
                <span
                  title={`${folderCount} folder${folderCount !== 1 ? "s" : ""}`}
                  className="bg-complementary/30 rounded-md px-1.5 py-0.5"
                >
                  {folderCount}f
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons (ensure stopPropagation is handled by callers) */}
        {showActions && node.path !== "" && (
          <div className="ml-auto flex flex-shrink-0 items-center justify-end space-x-1 pl-2 opacity-0 transition-opacity group-hover:opacity-100">
            <ClientRequirePermission permission="wiki:page:update">
              <button
                onClick={(e) => handleRename(node, e)} // stopPropagation is inside handleRename now
                className="hover:bg-background-level2 rounded p-0.5"
                title="Rename"
              >
                <PencilIcon className="text-text-tertiary hover:text-text-primary h-4 w-4" />
              </button>
            </ClientRequirePermission>
            <ClientRequirePermission permission="wiki:page:move">
              {showMove && (
                <button
                  onClick={(e) => handleMove(node, e)} // stopPropagation is inside handleMove now
                  className="hover:bg-background-level2 rounded p-0.5"
                  title="Move"
                >
                  <MoveIcon className="text-text-tertiary hover:text-text-primary h-4 w-4" />
                </button>
              )}
            </ClientRequirePermission>

            <ClientRequirePermission permission="wiki:page:create">
              <button
                onClick={(e) => handleNewFolder(node.path, e)} // stopPropagation is inside handleNewFolder now
                className="hover:bg-background-level2 rounded p-0.5"
                title="Create new page/folder inside"
              >
                <PlusCircleIcon className="text-text-tertiary hover:text-text-primary h-4 w-4" />
              </button>
            </ClientRequirePermission>
          </div>
        )}
      </>
    );

    // Common class string including selection highlight
    const nodeClasses = `group flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm hover:bg-background-level2 ${
      // Adjusted py padding
      isSelected
        ? "bg-primary/10 text-text-primary font-medium" // Highlight selected
        : "text-text-secondary"
    }`;

    return (
      <div key={node.path} className="wiki-folder-node">
        <div className="group relative">
          {/* Use a div with onClick instead of Link or the selection mode div */}
          <div
            className={nodeClasses}
            onClick={(e) => handleNodeClick(node, e)}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            title={fullPath}
            role="button" // Accessibility
            tabIndex={0} // Accessibility
            onKeyDown={(e) => {
              // Allow activation with Enter/Space
              if (e.key === "Enter" || e.key === " ") {
                handleNodeClick(node, e as unknown as React.MouseEvent); // Cast needed for event type mismatch
              }
            }}
          >
            {/* Expansion chevron button */}
            {hasChildren && !isWithinOpenDepth ? (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent node click
                  toggleFolder(node.path);
                }}
                className="hover:bg-background-level2 mr-1 rounded p-0.5 focus:outline-none"
                title={isExpanded ? "Collapse folder" : "Expand folder"}
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <ChevronDownIcon className="text-text-tertiary h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="text-text-tertiary h-4 w-4" />
                )}
              </button>
            ) : (
              /* Spacer if no chevron needed or forced open */
              <span className="mr-1 w-[16px] shrink-0"></span>
            )}
            {childElements}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="wiki-folder-children">
            {" "}
            {/* Indent children slightly more */}
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render the folder structure based on props
  const renderFolderStructure = () => {
    if (!folderStructure) return null;

    // If we need to show only children of current path
    if (showOnlyChildren && currentPath) {
      const currentNode =
        currentPath === ""
          ? folderStructure
          : findNodeByPath(currentPath, folderStructure);

      if (currentNode) {
        return (
          <>
            {currentNode.children.map((child) => renderNode(child))}
            {currentNode.children.length === 0 && (
              <div className="text-text-tertiary px-3 py-2 text-sm">
                No subpages found
              </div>
            )}
          </>
        );
      }
    }

    // Otherwise show the full structure
    return (
      <>
        {showRoot && renderNode(folderStructure)}
        {!showRoot &&
          folderStructure.children.map((child) => renderNode(child))}
      </>
    );
  };

  if (isLoading) {
    // Basic loading state
    return (
      <div className={className}>
        {!hideHeader && (
          <h3 className="text-text-primary mb-2 text-base font-medium">
            {title}
          </h3>
        )}
        <div className="space-y-1 px-2 py-4">
          <div className="bg-background-level2 h-5 w-3/4 animate-pulse rounded"></div>
          <div className="bg-background-level2 ml-4 h-5 w-2/3 animate-pulse rounded"></div>
          <div className="bg-background-level2 h-5 w-1/2 animate-pulse rounded"></div>
          <div className="bg-background-level2 ml-4 h-5 w-5/6 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card
        className={cn(
          "border-border-light bg-transparent",
          !card ? "border-0 shadow-none" : "shadow-md"
        )}
      >
        <CardContent className={cn(card ? "p-3" : "m-0 p-0")}>
          {!hideHeader && (
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-text-primary text-base font-medium">
                {title}
              </h3>
              {showActions && (
                <ClientRequirePermission permission="wiki:page:create">
                  <button
                    onClick={(e) => handleNewFolder("", e)} // Create at root
                    className="text-primary hover:text-primary/80 text-xs"
                    title="Create new root folder/page"
                  >
                    + New Root Item
                  </button>
                </ClientRequirePermission>
              )}
            </div>
          )}
          {renderFolderStructure()}

          {showLegend && !hideHeader && (
            <div className="text-text-secondary border-border-light mt-2 grid grid-cols-1 gap-2 border-t pt-2 text-xs">
              <div className="bg-background-level1 hover:bg-background-level2 flex items-center rounded-md px-2 py-1">
                <FolderIcon className="text-primary mr-1 h-4 w-4" /> = Folder
                with Content
              </div>
              <div className="bg-background-level1 hover:bg-background-level2 flex items-center rounded-md px-2 py-1">
                <FolderIcon className="text-secondary-700 mr-1 h-4 w-4" /> =
                Virtual Folder
              </div>
              <div className="bg-background-level1 hover:bg-background-level2 flex items-center rounded-md px-2 py-1">
                <FileTextIcon className="mr-1 h-4 w-4" /> = Page
              </div>
              {mode === "navigation" && (
                <>
                  <div className="bg-background-level1 hover:bg-background-level2 flex items-center rounded-md px-2 py-1">
                    <InfoIcon className="text-text-tertiary mr-1 h-4 w-4" />
                    Double click a folder to navigate
                  </div>
                  <div className="bg-background-level1 hover:bg-background-level2 flex items-center rounded-md px-2 py-1">
                    <InfoIcon className="text-text-tertiary mr-1 h-4 w-4" />
                    <kbd className="text-text-tertiary bg-background-level3 border-border dark:border-border-light rounded-md border-b px-1 py-0.5 text-xs font-bold shadow-sm">
                      Shift
                    </kbd>
                    + Click a folder to navigate immediately
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showPageLocationEditor && (
        <PageLocationEditor
          mode="create"
          initialPath={newFolderPath}
          isOpen={showPageLocationEditor}
          onClose={() => setShowPageLocationEditor(false)}
        />
      )}

      {showRenameModal && renamingNode && (
        <Modal onClose={() => setShowRenameModal(false)}>
          <div className="p-4">
            <label
              htmlFor="newNameInput"
              className="mb-2 block text-sm font-medium"
            >
              New name for &quot;{renamingNode.title || renamingNode.name}
              &quot;:
            </label>
            <input
              id="newNameInput"
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setRenameConflict(false); // Reset conflict on change
              }}
              className={`border-border-default w-full rounded border p-2 ${
                renameConflict ? "border-error" : ""
              }`}
            />
            {renameConflict && (
              <p className="text-error mt-1 text-xs">
                A page or folder with this name already exists here.
              </p>
            )}
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                onClick={() => setShowRenameModal(false)}
                variant="destructive"
              >
                Cancel
              </Button>
              <Button
                variant="outlined"
                onClick={renameNode}
                disabled={!newName.trim() || renameConflict}
              >
                Rename
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showMoveModal && movingNode && (
        <PageLocationEditor
          mode="move"
          isOpen={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          pageId={movingNode.id}
          initialPath={movingNode.path}
          pageTitle={movingNode.title || movingNode.name}
          initialName={movingNode.name}
        />
      )}
    </div>
  );
}
