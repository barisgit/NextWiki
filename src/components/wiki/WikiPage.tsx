"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ReactNode, useState, useEffect } from "react";
import { WikiLockInfo } from "./WikiLockInfo";
import { MoveIcon, PencilIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { WikiSubfolders } from "./WikiSubfolders";
import { Breadcrumbs } from "./Breadcrumbs";
import { trpc } from "~/lib/trpc/client";
import Modal from "~/components/ui/modal";
import { PageLocationEditor } from "./PageLocationEditor";

interface WikiPageProps {
  id: number;
  title: string;
  content: ReactNode;
  createdBy?: { name: string; id: number };
  updatedBy?: { name: string; id: number };
  lockedBy?: { name: string; id: number } | null;
  lockedAt?: Date | null;
  lockExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags?: { id: number; name: string }[];
  path: string;
  currentUserId?: number;
}

export function WikiPage({
  id,
  title,
  content,
  createdBy,
  updatedBy,
  lockedBy,
  lockExpiresAt,
  createdAt,
  updatedAt,
  tags = [],
  path,
  currentUserId,
}: WikiPageProps) {
  const router = useRouter();
  const [hasSubpages, setHasSubpages] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [renameConflict, setRenameConflict] = useState(false);

  // Get utility functions for trpc
  const utils = trpc.useUtils();

  // Create a mutation for updating a wiki page
  const updateMutation = trpc.wiki.update.useMutation({
    onSuccess: () => {
      utils.wiki.getFolderStructure.invalidate();
      router.refresh();
    },
  });

  // Determine if the page is currently locked
  const isLocked = Boolean(
    lockedBy && lockExpiresAt && new Date(lockExpiresAt) > new Date()
  );

  // Determine if the current user is the lock owner
  const isCurrentUserLockOwner = Boolean(
    currentUserId && lockedBy && lockedBy.id === currentUserId
  );

  // Handle rename action
  const handleRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNewName(title);
    setRenameConflict(false);
    setShowRenameModal(true);
  };

  // Handle rename submission
  const renameNode = () => {
    if (!newName.trim()) return;
    setRenameConflict(false);

    // Check if we can update the title
    if (id) {
      updateMutation.mutate({
        id: id,
        path: path,
        title: newName,
        content: undefined, // Keep existing content
        isPublished: undefined, // Keep existing publish state
      });
    }

    setShowRenameModal(false);
  };

  // Handle move action
  const handleMove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMoveModal(true);
  };

  // Check if the current page has subpages
  const { data: folderStructure } = trpc.wiki.getFolderStructure.useQuery();

  useEffect(() => {
    // Define the FolderNode interface to match the server type
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

    // Helper function to find node by path
    const findNodeByPath = (
      nodePath: string,
      tree: FolderNode | null
    ): FolderNode | null => {
      if (!tree) return null;
      if (tree.path === nodePath) return tree;

      for (const child of tree.children || []) {
        const found = findNodeByPath(nodePath, child);
        if (found) return found;
      }

      return null;
    };

    if (folderStructure && path) {
      const node = findNodeByPath(path, folderStructure);
      setHasSubpages(
        Boolean(node && node.children && node.children.length > 0)
      );
    }
  }, [folderStructure, path]);

  return (
    <div className="flex space-x-8">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6">
        <div className="pb-4 mb-6 border-b">
          {/* Breadcrumbs */}
          <Breadcrumbs path={path} className="mb-3 text-slate-600" />

          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">{title}</h1>

            <div className="flex items-center space-x-2">
              {/* Actions dropdown */}
              <div className="relative">
                <div className="flex items-center justify-start flex-shrink-0 ml-auto">
                  <button onClick={handleRename} className="p-1" title="Rename">
                    <PencilIcon className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                  </button>
                  <button onClick={handleMove} className="p-1" title="Move">
                    <MoveIcon className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                  </button>
                </div>
              </div>

              {/* Lock status and edit controls */}
              <WikiLockInfo
                pageId={id}
                isLocked={isLocked}
                lockedByName={lockedBy?.name || null}
                lockedUntil={lockExpiresAt?.toISOString() || null}
                isCurrentUserLockOwner={isCurrentUserLockOwner}
                editPath={`/${path}?edit=true`}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Updated {formatDistanceToNow(updatedAt, { addSuffix: true })}
              {updatedBy ? ` by ${updatedBy.name}` : ""}
            </div>
            <div>
              Created {formatDistanceToNow(createdAt, { addSuffix: true })}
              {createdBy ? ` by ${createdBy.name}` : ""}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex items-center mt-3 space-x-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.name}`}
                  className="px-2 py-0.5 bg-muted text-xs rounded-full hover:bg-muted/80"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>{content}</div>
      </div>

      {/* Subfolders sidebar - only shown if page has subpages */}
      {hasSubpages && (
        <div className="w-72 shrink-0">
          <WikiSubfolders
            path={path}
            maxDepth={3}
            openDepth={1}
            showLegend={true}
          />
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <Modal
          onClose={() => setShowRenameModal(false)}
          size="sm"
          backgroundClass="bg-white"
          closeOnEscape={true}
          showCloseButton={true}
        >
          <div className="p-4">
            <h3 className="mb-4 text-lg font-medium">Rename Page</h3>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-slate-700">
                Current Name
              </label>
              <div className="px-3 py-2 text-sm border rounded-md bg-slate-50">
                {title}
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
                placeholder="New title"
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
      {showMoveModal && (
        <PageLocationEditor
          mode="move"
          isOpen={showMoveModal}
          onClose={() => {
            setShowMoveModal(false);
          }}
          initialPath={path}
          pageId={id}
          pageTitle={title}
          initialName={title.split("/").pop() || title}
        />
      )}
    </div>
  );
}
