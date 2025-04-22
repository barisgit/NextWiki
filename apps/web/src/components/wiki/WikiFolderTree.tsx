"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileTextIcon,
  PlusCircleIcon,
  PencilIcon,
  MoveIcon,
} from "lucide-react";
import { useTRPC } from "~/server/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@repo/ui";
import { PageLocationEditor } from "./PageLocationEditor";
import { ClientRequirePermission } from "../auth/permission/client";

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
  mode = "navigation",
  onSelectPath,
  showActions = false,
  showMove = true,
  selectedPath,
}: WikiFolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});
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
  const toggleFolder = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // Handle node selection
  const handleSelect = (node: FolderNode, e: React.MouseEvent) => {
    if (mode === "selection" && onSelectPath) {
      e.preventDefault();
      onSelectPath(node.path);
    }
  };

  // Open the new folder modal
  const handleNewFolder = (parentPath: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNewFolderPath(parentPath);
    setShowPageLocationEditor(true);
  };

  // Open the rename modal
  const handleRename = (node: FolderNode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    e.stopPropagation();
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
    const isCurrent = currentPath === node.path;
    const isSelected = selectedPath === node.path;

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
        {hasChildren && !isWithinOpenDepth && (
          <button
            onClick={(e) => toggleFolder(node.path, e)}
            className="hover:bg-background-level2 mr-1 rounded p-1 focus:outline-none"
            title={isExpanded ? "Collapse folder" : "Expand folder"}
          >
            {isExpanded ? (
              <ChevronDownIcon className="text-text-secondary h-5 w-5" />
            ) : (
              <ChevronRightIcon className="text-text-secondary h-5 w-5" />
            )}
          </button>
        )}

        {(!hasChildren || isWithinOpenDepth) && <span className="w-7"></span>}

        {isFolder ? (
          <FolderIcon
            className={`mr-2 h-5 w-5 flex-shrink-0 ${
              node.id ? "text-amber-500" : "text-amber-300"
            }`}
            aria-label={
              node.id
                ? "Real folder with content"
                : "Virtual folder (no content)"
            }
          />
        ) : (
          <FileTextIcon className="mr-2 h-5 w-5 flex-shrink-0 text-slate-500" />
        )}

        <div className="flex min-w-0 flex-grow flex-row items-center gap-2">
          <span className="truncate font-medium">
            {node.title || node.name}
          </span>
          <span className="max-w-[30%] truncate text-xs text-slate-400">
            {node.path}
          </span>

          {isFolder && (
            <div className="flex flex-shrink-0 space-x-1 text-xs text-slate-500">
              {showPageCount && pageCount > 0 && (
                <span
                  title={`${pageCount} page${pageCount !== 1 ? "s" : ""}`}
                  className="rounded-full bg-slate-100 px-1.5 py-0.5"
                >
                  {pageCount}p
                </span>
              )}
              {folderCount > 0 && (
                <span
                  title={`${folderCount} folder${folderCount !== 1 ? "s" : ""}`}
                  className="rounded-full bg-slate-100 px-1.5 py-0.5"
                >
                  {folderCount}f
                </span>
              )}
            </div>
          )}
        </div>

        {showActions && node.path !== "" && (
          <div className="ml-1 flex flex-shrink-0 items-center justify-end space-x-1">
            <ClientRequirePermission permission="wiki:page:update">
              <button
                onClick={(e) => handleRename(node, e)}
                className="p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                title="Rename"
              >
                <PencilIcon className="h-4 w-4 text-slate-400 hover:text-slate-700" />
              </button>
            </ClientRequirePermission>
            <ClientRequirePermission permission="wiki:page:move">
              {showMove && (
                <button
                  onClick={(e) => handleMove(node, e)}
                  className="p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                  title="Move"
                >
                  <MoveIcon className="h-4 w-4 text-slate-400 hover:text-slate-700" />
                </button>
              )}
            </ClientRequirePermission>

            <ClientRequirePermission permission="wiki:page:create">
              <button
                onClick={(e) => handleNewFolder(node.path, e)}
                className="p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                title="Create new folder"
              >
                <PlusCircleIcon className="h-4 w-4 text-slate-400 hover:text-slate-700" />
              </button>
            </ClientRequirePermission>
          </div>
        )}
      </>
    );

    return (
      <div key={node.path} className="wiki-folder-node">
        <div className="group relative">
          {mode === "navigation" ? (
            <Link
              href={`/${node.path}`}
              className={`hover:bg-background-level2 group flex items-center rounded-md px-2 py-2 ${
                isCurrent
                  ? "bg-background-level3 text-text-primary font-medium"
                  : "text-text-secondary"
              }`}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              title={fullPath}
            >
              {childElements}
            </Link>
          ) : (
            <div
              className={`hover:bg-background-level2 group flex cursor-pointer items-center rounded-md px-2 py-2 ${
                isSelected
                  ? "bg-background-level3 text-text-primary font-medium"
                  : "text-text-secondary"
              }`}
              onClick={(e) => handleSelect(node, e)}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              title={fullPath}
            >
              {childElements}
            </div>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="wiki-folder-children">
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
              <div className="px-3 py-2 text-sm text-slate-500">
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
    return (
      <div className={`wiki-folder-tree ${className}`}>
        <div className="p-3 text-sm text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className={`wiki-folder-tree border-border-default overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {!hideHeader && (
        <div className="border-border-default bg-background-level1 flex items-center justify-between border-b p-3">
          <h3 className="text-md text-text-primary font-medium">{title}</h3>
          <ClientRequirePermission permission="wiki:page:create">
            {showActions && (
              <button
                onClick={(e) => handleNewFolder("", e)}
                className="hover:bg-background-level2 rounded-md p-1"
                title="Create new root folder"
              >
                <PlusCircleIcon className="text-text-secondary h-4 w-4" />
              </button>
            )}
          </ClientRequirePermission>
        </div>
      )}
      <div className="overflow-y-auto p-2">
        {renderFolderStructure()}
        {(!folderStructure ||
          (folderStructure.children.length === 0 && !showOnlyChildren)) && (
          <div className="px-3 py-2 text-sm text-slate-500">
            No content found
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="bg-background-level1 text-text-secondary border-t px-3 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-background-level2 flex items-center rounded-md px-2 py-1">
              <FolderIcon className="mr-1 h-3.5 w-3.5 text-amber-500" />
              <span>Real folder</span>
            </div>
            <div className="bg-background-level2 flex items-center rounded-md px-2 py-1">
              <FolderIcon className="mr-1 h-3.5 w-3.5 text-amber-300" />
              <span>Virtual folder</span>
            </div>
            <div className="bg-background-level2 flex items-center rounded-md px-2 py-1">
              <span className="bg-background-level1 mr-1 rounded-full px-1.5 py-0.5 text-xs">
                1p
              </span>
              <span>Page count</span>
            </div>
            <div className="bg-background-level2 flex items-center rounded-md px-2 py-1">
              <span className="bg-background-level1 mr-1 rounded-full px-1.5 py-0.5 text-xs">
                1f
              </span>
              <span>Subfolder count</span>
            </div>
          </div>
        </div>
      )}

      {/* New Folder/Page Editor using PageLocationEditor */}
      <PageLocationEditor
        mode="create"
        isOpen={showPageLocationEditor}
        onClose={() => {
          setShowPageLocationEditor(false);
          // Make sure to expand the folder where the new content is created
          if (newFolderPath) {
            setExpandedFolders((prev) => ({
              ...prev,
              [newFolderPath]: true,
            }));
          }
          // Refresh the folder structure after creation
          queryClient.invalidateQueries({
            queryKey: folderStructureQueryKey,
          });
        }}
        initialPath={newFolderPath}
      />

      {/* Rename Modal */}
      {showRenameModal && renamingNode && (
        <Modal
          onClose={() => setShowRenameModal(false)}
          size="sm"
          closeOnEscape={true}
          showCloseButton={true}
        >
          <div className="p-4">
            <h3 className="mb-4 text-lg font-medium">
              Rename {renamingNode.type === "folder" ? "Folder" : "Page"}
            </h3>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Current Name
              </label>
              <div className="border-border-default bg-background-level1 rounded-md border px-3 py-2 text-sm">
                {renamingNode.title || renamingNode.name}
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="newName"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  New Name
                </label>
                {renameConflict && (
                  <span className="text-sm text-red-500">
                    Name already exists
                  </span>
                )}
              </div>
              <input
                id="newName"
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setRenameConflict(false);
                }}
                className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${
                  renameConflict
                    ? "border-red-500 focus:ring-red-200"
                    : "focus:ring-primary"
                }`}
                placeholder="new-name"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowRenameModal(false)}
                className="text-text-secondary hover:bg-background-level2 border-border-default rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={renameNode}
                className="bg-primary hover:bg-primary-dark rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors"
                disabled={!newName.trim() || renameConflict}
              >
                Rename
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Move Modal using PageLocationEditor */}
      {movingNode && (
        <PageLocationEditor
          mode="move"
          isOpen={showMoveModal}
          onClose={() => {
            setShowMoveModal(false);
            setMovingNode(null);
          }}
          initialPath={movingNode.path}
          pageId={movingNode.id}
          pageTitle={movingNode.title || movingNode.name}
          initialName={movingNode.name}
        />
      )}
    </div>
  );
}
