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
import { trpc } from "~/lib/trpc/client";
import Modal from "~/components/ui/modal";
import { PageLocationEditor } from "./PageLocationEditor";

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

  const utils = trpc.useUtils();

  // Fetch the complete folder structure
  const { data: folderStructure, isLoading } =
    trpc.wiki.getFolderStructure.useQuery();

  // Helper function to get parent path
  const getParentPath = (path: string): string => {
    if (!path) return "";
    const pathParts = path.split("/");
    return pathParts.slice(0, -1).join("/");
  };

  const parentPathForRename = renamingNode
    ? getParentPath(renamingNode.path)
    : "";

  const getSubfoldersForRenameQuery = trpc.wiki.getSubfolders.useQuery(
    { path: parentPathForRename },
    { enabled: showRenameModal && renamingNode !== null }
  );

  // Create a mutation for updating a wiki page
  const updateMutation = trpc.wiki.update.useMutation({
    onSuccess: () => {
      utils.wiki.getFolderStructure.invalidate();
    },
  });

  // Auto-expand folders in the current path
  useEffect(() => {
    if (currentPath) {
      const pathParts = currentPath.split("/").filter(Boolean);
      let currentPathBuild = "";

      // Create an updated expanded folders object
      const newExpandedFolders = { ...expandedFolders };

      // For each part of the path, expand its parent folder
      for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i]) {
          currentPathBuild = currentPathBuild
            ? `${currentPathBuild}/${pathParts[i]}`
            : pathParts[i];

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
            className="p-1 mr-1 rounded focus:outline-none hover:bg-slate-200"
            title={isExpanded ? "Collapse folder" : "Expand folder"}
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-slate-500" />
            )}
          </button>
        )}

        {(!hasChildren || isWithinOpenDepth) && <span className="w-7"></span>}

        {isFolder ? (
          <FolderIcon
            className={`w-5 h-5 mr-2 flex-shrink-0 ${
              node.id ? "text-amber-500" : "text-amber-300"
            }`}
            aria-label={
              node.id
                ? "Real folder with content"
                : "Virtual folder (no content)"
            }
          />
        ) : (
          <FileTextIcon className="flex-shrink-0 w-5 h-5 mr-2 text-slate-500" />
        )}

        <div className="flex flex-row items-center flex-grow min-w-0 gap-2">
          <span className="font-medium truncate">
            {node.title || node.name}
          </span>
          <span className="text-xs truncate text-slate-400 max-w-[30%]">
            {node.path}
          </span>

          {isFolder && (
            <div className="flex flex-shrink-0 space-x-1 text-xs text-slate-500">
              {showPageCount && pageCount > 0 && (
                <span
                  title={`${pageCount} page${pageCount !== 1 ? "s" : ""}`}
                  className="px-1.5 py-0.5 rounded-full bg-slate-100"
                >
                  {pageCount}p
                </span>
              )}
              {folderCount > 0 && (
                <span
                  title={`${folderCount} folder${folderCount !== 1 ? "s" : ""}`}
                  className="px-1.5 py-0.5 rounded-full bg-slate-100"
                >
                  {folderCount}f
                </span>
              )}
            </div>
          )}
        </div>

        {showActions && node.path !== "" && (
          <div className="flex items-center justify-end flex-shrink-0 ml-1 space-x-1">
            <button
              onClick={(e) => handleRename(node, e)}
              className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Rename"
            >
              <PencilIcon className="w-4 h-4 text-slate-400 hover:text-slate-700" />
            </button>
            <button
              onClick={(e) => handleMove(node, e)}
              className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Move"
            >
              <MoveIcon className="w-4 h-4 text-slate-400 hover:text-slate-700" />
            </button>

            <button
              onClick={(e) => handleNewFolder(node.path, e)}
              className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Create new folder"
            >
              <PlusCircleIcon className="w-4 h-4 text-slate-400 hover:text-slate-700" />
            </button>
          </div>
        )}
      </>
    );

    return (
      <div key={node.path} className="wiki-folder-node">
        <div className="relative group">
          {mode === "navigation" ? (
            <Link
              href={`/${node.path}`}
              className={`flex items-center py-2 px-2 rounded-md hover:bg-slate-100 group ${
                isCurrent
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-700"
              }`}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              title={fullPath}
            >
              {childElements}
            </Link>
          ) : (
            <div
              className={`flex items-center py-2 px-2 rounded-md hover:bg-slate-100 group cursor-pointer ${
                isSelected
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-700"
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
      className={`wiki-folder-tree border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      {!hideHeader && (
        <div className="flex items-center justify-between p-3 border-b bg-slate-50">
          <h3 className="font-medium text-md text-slate-700">{title}</h3>
          {showActions && (
            <button
              onClick={(e) => handleNewFolder("", e)}
              className="p-1 rounded-md hover:bg-slate-200"
              title="Create new root folder"
            >
              <PlusCircleIcon className="w-4 h-4 text-slate-600" />
            </button>
          )}
        </div>
      )}
      <div className="p-2 overflow-y-auto">
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
        <div className="px-3 py-2 text-xs border-t bg-slate-50 text-slate-600">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center px-2 py-1 bg-white rounded-md">
              <FolderIcon className="w-3.5 h-3.5 mr-1 text-amber-500" />
              <span>Real folder</span>
            </div>
            <div className="flex items-center px-2 py-1 bg-white rounded-md">
              <FolderIcon className="w-3.5 h-3.5 mr-1 text-amber-300" />
              <span>Virtual folder</span>
            </div>
            <div className="flex items-center px-2 py-1 bg-white rounded-md">
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-slate-100 mr-1">
                1p
              </span>
              <span>Page count</span>
            </div>
            <div className="flex items-center px-2 py-1 bg-white rounded-md">
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-slate-100 mr-1">
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
          utils.wiki.getFolderStructure.invalidate();
        }}
        initialPath={newFolderPath}
      />

      {/* Rename Modal */}
      {showRenameModal && renamingNode && (
        <Modal
          onClose={() => setShowRenameModal(false)}
          size="sm"
          backgroundClass="bg-white"
          closeOnEscape={true}
          showCloseButton={true}
        >
          <div className="p-4">
            <h3 className="mb-4 text-lg font-medium">
              Rename {renamingNode.type === "folder" ? "Folder" : "Page"}
            </h3>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-slate-700">
                Current Name
              </label>
              <div className="px-3 py-2 text-sm border rounded-md bg-slate-50">
                {renamingNode.title || renamingNode.name}
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="newName"
                  className="block mb-1 text-sm font-medium text-slate-700"
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
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
                className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={renameNode}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary-dark transition-colors"
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
