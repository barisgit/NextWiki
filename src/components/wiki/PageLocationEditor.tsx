"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WikiFolderTree } from "./WikiFolderTree";
import { trpc } from "~/lib/trpc/client";
import { useNotification } from "~/lib/hooks/useNotification";
import Modal from "~/components/ui/modal";

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

  // For checking name conflicts
  const subpagesList = trpc.wiki.getSubfolders.useQuery({ path: selectedPath });

  // For checking if page has children (is a folder)
  const childrenQuery = trpc.wiki.getSubfolders.useQuery(
    { path: initialPath },
    { enabled: mode === "move" && !!initialPath }
  );

  // Create folder mutation
  const createFolderMutation = trpc.wiki.createFolder.useMutation({
    onSuccess: (data) => {
      notification.success("Folder created successfully");
      onClose();
      router.push(`/${data.path}`);
    },
    onError: (error) => {
      setIsProcessing(false);
      notification.error(`Failed to create folder: ${error.message}`);
    },
  });

  // Move page mutation
  const movePageMutation = trpc.wiki.movePages.useMutation({
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
  });

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
    console.log("subpages", subpages);
    console.log("pageName", pageName);
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
        onClose();
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
        <h1 className="text-2xl font-bold text-gray-800">
          {mode === "create" ? "Create New Wiki Page" : `Move: ${pageTitle}`}
        </h1>

        <div className="p-2 mb-6 bg-white rounded-lg">
          <div className="grid grid-cols-[3fr_2fr] gap-6">
            <div className="pr-6">
              {mode === "move" && (
                <div className="text-sm text-gray-500">
                  Current path: {initialPath}
                </div>
              )}

              <h2 className="mb-4 text-lg font-medium text-gray-700">
                {mode === "create"
                  ? "Select Location"
                  : "Select Destination Folder"}
              </h2>

              <div className="mb-6">
                <div className="relative">
                  <label
                    htmlFor="pageName"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    {mode === "create" ? "Page Name" : "New Name"}
                  </label>
                  {conflict && (
                    <div className="absolute top-0 right-0 text-sm text-red-500">
                      A page already exists at this location. Please choose a
                      different name.
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  {selectedPath && (
                    <span className="inline-flex items-center px-3 py-2 text-sm text-gray-500 border border-r-0 border-gray-300 rounded-l-md bg-gray-50">
                      {selectedPath}/
                    </span>
                  )}
                  <input
                    type="text"
                    id="pageName"
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value.toLowerCase())}
                    className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary ${
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
              <div className="p-4 mb-6 ml-4 border rounded-md bg-amber-50 border-amber-200">
                <h3 className="mb-2 text-sm font-medium text-amber-800">
                  This page has child pages
                </h3>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="moveRecursively"
                    checked={moveRecursively}
                    onChange={(e) => setMoveRecursively(e.target.checked)}
                    className="w-4 h-4 mr-2 border-gray-300 rounded text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="moveRecursively"
                    className="text-sm text-gray-700"
                  >
                    Move all child pages recursively
                  </label>
                </div>
                <p className="text-xs text-amber-700">
                  {moveRecursively
                    ? "All child pages will be moved to maintain the hierarchy."
                    : "Only this page will be moved, which could create gaps in your wiki structure."}
                </p>
              </div>
            )}

            {mode === "create" && (
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Create Type
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="w-4 h-4 border-gray-300 text-primary focus:ring-primary"
                      name="creationType"
                      value="page"
                      checked={creationType === "page"}
                      onChange={() => setCreationType("page")}
                    />
                    <span className="ml-2 text-sm text-gray-700">Page</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="w-4 h-4 border-gray-300 text-primary focus:ring-primary"
                      name="creationType"
                      value="folder"
                      checked={creationType === "folder"}
                      onChange={() => setCreationType("folder")}
                    />
                    <span className="ml-2 text-sm text-gray-700">Folder</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
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
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!pageName.trim() || conflict || isProcessing}
              className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
