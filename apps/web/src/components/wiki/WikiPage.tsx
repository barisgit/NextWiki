"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ReactNode, useState, useEffect } from "react";
import { WikiLockInfo } from "./WikiLockInfo";
import { MoveIcon, PencilIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { WikiSubfolders } from "./WikiSubfolders";
import { Breadcrumbs } from "./Breadcrumbs";
import { useTRPC } from "~/server/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Modal } from "@repo/ui";
import { PageLocationEditor } from "./PageLocationEditor";
import { ClientRequirePermission } from "~/components/auth/permission/client";
import { ScrollArea } from "@repo/ui";
import { Button } from "@repo/ui";
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
  const trpc = useTRPC();

  // Check specific page permissions if needed
  const { data: hasPageUpdatePermission } = useQuery(
    trpc.auth.hasPagePermission.queryOptions(
      { pageId: id, permission: "wiki:page:update" },
      { enabled: !!id }
    )
  );

  // Get utility functions for trpc
  // const utils = trpc.useUtils();

  // Create a mutation for updating a wiki page
  const updateMutation = useMutation(
    trpc.wiki.update.mutationOptions({
      onSuccess: () => {
        // utils.wiki.getFolderStructure.invalidate();
        router.refresh();
      },
    })
  );

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
  const { data: folderStructure } = useQuery(
    trpc.wiki.getFolderStructure.queryOptions()
  );

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
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="flex space-x-8 p-4">
        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-6">
          <div className="mb-6 border-b pb-4">
            {/* Breadcrumbs */}
            <Breadcrumbs path={path} className="mb-3 text-slate-600" />

            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-3xl font-bold">{title}</h1>

              {/* Combined Actions and Lock Info Area */}
              <div className="flex items-center space-x-4">
                {" "}
                {/* Rename/Move Icons */}
                <ClientRequirePermission permission="wiki:page:update">
                  {hasPageUpdatePermission && (
                    <div className="flex items-center space-x-1">
                      {" "}
                      {/* Container for icons */}
                      <Button
                        onClick={handleRename}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-muted rounded p-1"
                        title="Rename"
                      >
                        <PencilIcon className="h-4 w-4 text-slate-500 hover:text-slate-700" />
                      </Button>
                      <Button
                        onClick={handleMove}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-muted rounded p-1"
                        title="Move"
                      >
                        <MoveIcon className="h-4 w-4 text-slate-500 hover:text-slate-700" />
                      </Button>
                    </div>
                  )}
                </ClientRequirePermission>
                {/* Lock status - Moved here */}
                <ClientRequirePermission permission="wiki:page:update">
                  {hasPageUpdatePermission && (
                    <WikiLockInfo
                      pageId={id}
                      isLocked={isLocked}
                      lockedByName={lockedBy?.name || null}
                      lockedUntil={lockExpiresAt?.toISOString() || null}
                      isCurrentUserLockOwner={isCurrentUserLockOwner}
                      editPath={`/${path}?edit=true`}
                    />
                  )}
                </ClientRequirePermission>
              </div>
            </div>

            <div className="text-muted-foreground flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1 h-4 w-4"
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
              <div className="mt-3 flex items-center space-x-2">
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${tag.name}`}
                    className="bg-muted hover:bg-muted/80 rounded-full px-2 py-0.5 text-xs"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* FIXME: Temporary fix for content overflow */}
          <div className="max-w-[calc(100vw-20rem)]">{content}</div>
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
            size="md"
            closeOnEscape={true}
            showCloseButton={true}
            className="w-full"
          >
            <div className="p-4">
              <h3 className="mb-4 text-lg font-medium">Rename Page</h3>
              <div className="mb-4">
                <label className="text-text-secondary mb-1 block text-sm font-medium">
                  Current Name
                </label>
                <div className="border-border-light bg-background-paper text-text-secondary/50 rounded-md border px-3 py-2 text-sm">
                  {title}
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="newName"
                    className="text-text-secondary mb-1 block text-sm font-medium"
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
                  className={`border-border-light bg-background-level1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
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
                  className="text-text-secondary hover:bg-background-level2 border-border-light rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={renameNode}
                  className="bg-primary hover:bg-primary-600 text-primary-foreground hover:bg-primary-dark rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
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
    </ScrollArea>
  );
}
