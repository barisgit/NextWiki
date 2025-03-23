"use client";

import { WikiFolderTree } from "./WikiFolderTree";

interface WikiSubfoldersProps {
  /**
   * Current page path
   */
  path: string;

  /**
   * Maximum depth to display (default: 2)
   */
  maxDepth?: number;

  /**
   * Custom class for container
   */
  className?: string;

  /**
   * Depth to which folders are automatically open (default: 1)
   */
  openDepth?: number;

  /**
   * Whether to show the legend (default: true)
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

export function WikiSubfolders({
  path,
  maxDepth = 2,
  className = "",
  openDepth = 1,
  showLegend = true,
  mode = "navigation",
  onSelectPath,
  showActions = false,
  selectedPath,
}: WikiSubfoldersProps) {
  return (
    <WikiFolderTree
      currentPath={path}
      maxDepth={maxDepth}
      showRoot={false}
      showOnlyChildren={true}
      title="Subpages"
      className={`${className}`}
      showPageCount={true}
      openDepth={openDepth}
      showLegend={showLegend}
      mode={mode}
      onSelectPath={onSelectPath}
      showActions={showActions}
      selectedPath={selectedPath}
    />
  );
}
