"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WikiFolderTree } from "./WikiFolderTree";
import { useTRPC } from "~/server/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNotification } from "~/lib/hooks/useNotification";
import { Modal } from "@repo/ui";
import { Radio, RadioGroup } from "@repo/ui";
import { Checkbox } from "@repo/ui";
import { Button } from "@repo/ui";

interface PageLocationEditorProps {
  mode: "create" | "move";
  initialPath?: string;
  pageId?: number;
  pageTitle?: string;
  initialName?: string;
  onCancel?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function PageLocationEditor({
  mode,
  initialPath = "",
  pageId,
  pageTitle,
  initialName = "",
  onCancel,
  isOpen,
  onClose,
}: PageLocationEditorProps) {
  const [selectedPath, setSelectedPath] = useState(initialPath);
  const [pageName, setPageName] = useState(initialName);
  const [subpages, setSubpages] = useState<string[]>([]);
  const [conflict, setConflict] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasChildren, setHasChildren] = useState(false);
  const [moveRecursively, setMoveRecursively] = useState(true);
  const [creationType, setCreationType] = useState<"page" | "folder">("page");
  const router = useRouter();
  const notification = useNotification();
  const pathname = usePathname();

  const trpc = useTRPC();

  // For checking name conflicts
  const subpagesList = useQuery(
    trpc.wiki.getSubfolders.queryOptions({ path: selectedPath })
  );

  // For checking if page has children (is a folder)
  const childrenQuery = useQuery(
    trpc.wiki.getSubfolders.queryOptions(
      { path: initialPath },
      {
        enabled: mode === "move" && !!initialPath,
      }
    )
  );

  // Create folder mutation
  const createFolderMutation = useMutation(
    trpc.wiki.createFolder.mutationOptions({
      onSuccess: (data) => {
        notification.success("Folder created successfully");
        onClose();
        router.push(`/${data.path}`);
      },
      onError: (error) => {
        setIsProcessing(false);
        notification.error(`Failed to create folder: ${error.message}`);
      },
    })
  );

  // Move page mutation
  const movePageMutation = useMutation(
    trpc.wiki.movePages.mutationOptions({
      onSuccess: () => {
        notification.success("Page moved successfully");
        onClose();
        const newPath = pageName
          ? selectedPath
            ? `${selectedPath}/${pageName}`
            : pageName
          : selectedPath;
        router.push(`/${newPath}`);
      },
      onError: (error) => {
        setIsProcessing(false);
        notification.error(`Failed to move page: ${error.message}`);
      },
    })
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedPath(initialPath);
      setPageName(initialName);
    }
  }, [isOpen, initialPath, initialName]);

  useEffect(() => {
    setSubpages(
      subpagesList.data?.map((subpage) => subpage.name.toLowerCase()) || []
    );
  }, [subpagesList.data]);

  useEffect(() => {
    // Check if this page has children (is a folder)
    if (mode === "move" && childrenQuery.data) {
      const childPages = childrenQuery.data;
      setHasChildren(childPages.length > 0);
    }
  }, [childrenQuery.data, mode]);

  useEffect(() => {
    if (subpages.includes(pageName.toLowerCase())) {
      setConflict(true);
    } else {
      setConflict(false);
    }
  }, [subpages, pageName, mode]);

  const handleSubmit = () => {
    if (!pageName.trim()) return;

    setIsProcessing(true);

    if (mode === "create") {
      if (creationType === "page") {
        // Navigate to editor with the path
        const fullPath = selectedPath
          ? `${selectedPath}/${encodeURIComponent(pageName)}`
          : encodeURIComponent(pageName);

        // We don't want to trigger navigate back
        if (pathname !== "/create") {
          onClose();
        }

        router.push(`/create?path=${encodeURIComponent(fullPath)}`);
      } else {
        // Create folder directly
        const folderPath = selectedPath
          ? `${selectedPath}/${pageName}`
          : pageName;
        createFolderMutation.mutate({
          path: folderPath,
          title: pageName,
        });
      }
    } else if (mode === "move" && pageId) {
      // Handle move operation
      const sourcePath = initialPath;
      const isRename = pageName !== initialName;
      const finalTargetPath = pageName
        ? selectedPath
          ? `${selectedPath}/${pageName}`
          : pageName
        : selectedPath;

      movePageMutation.mutate({
        pageIds: [pageId],
        sourcePath,
        targetPath: finalTargetPath,
        operation: isRename ? "rename" : "move",
        recursive: moveRecursively && hasChildren,
      });
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} className="w-full max-w-6xl">
      <div className="">
        <h1 className="text-text-primary text-2xl font-bold">
          {mode === "create" ? "Create New Wiki Page" : `Move: ${pageTitle}`}
        </h1>

        <div className="bg-background-paper mb-6 rounded-lg p-2">
          <div className="grid grid-cols-[3fr_2fr] gap-6">
            <div className="pr-6">
              {mode === "move" && (
                <div className="text-text-secondary text-sm">
                  Current path: {initialPath}
                </div>
              )}

              <h2 className="text-text-primary mb-4 text-lg font-medium">
                {mode === "create"
                  ? "Select Location"
                  : "Select Destination Folder"}
              </h2>

              <div className="mb-6">
                <div className="relative">
                  <label
                    htmlFor="pageName"
                    className="text-text-primary mb-2 block text-sm font-medium"
                  >
                    {mode === "create" ? "Page Name" : "New Name"}
                  </label>
                  {conflict && (
                    <div className="text-error absolute right-0 top-0 text-sm">
                      A page already exists at this location. Please choose a
                      different name.
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  {selectedPath && (
                    <span className="text-text-secondary border-border-default bg-background-level2 inline-flex items-center rounded-l-md border border-r-0 px-3 py-2 text-sm">
                      {selectedPath}/
                    </span>
                  )}
                  <input
                    type="text"
                    id="pageName"
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value.toLowerCase())}
                    className={`border-border-default focus:ring-primary focus:border-primary block w-full min-w-0 flex-1 rounded-md border px-3 py-2 focus:outline-none ${
                      selectedPath ? "rounded-l-none" : ""
                    }`}
                    placeholder={
                      mode === "create" ? "my-new-page" : "page-name"
                    }
                  />
                </div>
              </div>
            </div>

            {/* Folder options section - only shown when moving a page with children */}
            {mode === "move" && hasChildren && (
              <div className="bg-warning-50 border-warning-200 dark:bg-warning-900/50 dark:border-warning-800 mb-6 ml-4 rounded-md border p-4">
                <h3 className="text-warning-800 dark:text-warning-200 mb-2 text-sm font-medium">
                  This page has child pages
                </h3>
                <div className="mb-2 flex items-center">
                  <Checkbox
                    id="moveRecursively"
                    checked={moveRecursively}
                    onChange={(e) => setMoveRecursively(e.target.checked)}
                    label="Move all child pages recursively"
                    color="warning"
                  />
                </div>
                <p className="text-error-800 dark:text-error-500 text-xs">
                  {moveRecursively
                    ? "All child pages will be moved to maintain the hierarchy."
                    : "Only this page will be moved, which could create gaps in your wiki structure."}
                </p>
              </div>
            )}

            {mode === "create" && (
              <div className="mb-6">
                <label className="text-text-primary mb-2 block text-sm font-medium">
                  Create Type
                </label>
                <RadioGroup
                  orientation="horizontal"
                  value={creationType}
                  onChange={(value) =>
                    setCreationType(value as "page" | "folder")
                  }
                  name="creationType"
                >
                  <Radio value="page" label="Page" color="primary" />
                  <Radio value="folder" label="Folder" color="primary" />
                </RadioGroup>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="text-text-primary mb-2 block text-sm font-medium">
              Parent Folder
            </label>
            <WikiFolderTree
              title="Select Location"
              mode="selection"
              onSelectPath={setSelectedPath}
              selectedPath={selectedPath}
              showActions={false}
              maxDepth={0}
              showPageCount={true}
              showLegend={false}
              openDepth={3}
            />
          </div>

          <div className="flex items-center justify-end">
            <Button
              variant="outlined_simple"
              size="default"
              onClick={handleCancel}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!pageName.trim() || conflict || isProcessing}
              variant="solid"
              size="default"
            >
              {isProcessing
                ? mode === "create"
                  ? creationType === "page"
                    ? "Creating..."
                    : "Creating Folder..."
                  : "Moving..."
                : mode === "create"
                  ? creationType === "page"
                    ? "Continue to Editor"
                    : "Create Folder"
                  : "Move Page"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
