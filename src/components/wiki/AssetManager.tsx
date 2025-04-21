"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Trash2,
  Upload,
  Image,
  File,
  Download,
  Search,
  GridIcon,
  ListIcon,
} from "lucide-react";
import { useTRPC } from "~/server/client";
import { useNotification } from "~/lib/hooks/useNotification";
import { formatFileSize } from "~/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "../ui/modal";
import { Input } from "~/components/ui/input";
import { PaginationInput, PaginationMeta } from "~/lib/utils/pagination";
import { ScrollArea } from "~/components/ui/scroll-area";

export interface AssetType {
  id: string;
  name: string | null;
  description: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  data: string;
  uploadedById: number;
  pageId?: number | null;
  createdAt: string | null;
  uploadedBy?: {
    id: number;
    name: string | null;
  };
}

interface AssetManagerProps {
  pageId?: number;
  onSelectAsset?: (
    assetUrl: string,
    assetName: string,
    fileType: string
  ) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

type ViewMode = "grid" | "list";

export const AssetManager: React.FC<AssetManagerProps> = ({
  pageId,
  onSelectAsset,
  onClose,
  isOpen = false,
}) => {
  const [assets, setAssets] = useState<AssetType[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationInput>({
    page: 1,
    pageSize: 20,
  });
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const notification = useNotification();

  const assetsQueryKey = trpc.assets.getPaginated.queryKey();

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination({ ...pagination, page: 1 }); // Reset to first page when search changes
    }, 100);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // TRPC queries and mutations
  const { data: paginatedAssets, refetch: refetchAssets } = useQuery(
    trpc.assets.getPaginated.queryOptions({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: debouncedSearch,
    })
  );

  const deleteMutation = useMutation(
    trpc.assets.delete.mutationOptions({
      onSuccess: () => {
        notification.success("Asset deleted");
        refetchAssets();
      },
      onError: () => {
        notification.error("Error deleting asset");
      },
    })
  );

  const uploadMutation = useMutation(
    trpc.assets.upload.mutationOptions({
      onSuccess: () => {
        notification.success("Asset uploaded");
        refetchAssets();
      },
      onError: () => {
        notification.error("Error uploading asset");
      },
    })
  );

  const updateAssetMutation = useMutation(
    trpc.assets.update.mutationOptions({
      onSuccess: () => {
        notification.success("Asset updated");
        refetchAssets();
        setIsEditing(false);
      },
      onError: () => {
        notification.error("Error updating asset");
      },
    })
  );

  useEffect(() => {
    if (paginatedAssets) {
      setAssets(paginatedAssets.items as AssetType[]);
      setMeta(paginatedAssets.meta);
    }
  }, [paginatedAssets]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);

    try {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = async () => {
        // Get the base64 data from the FileReader
        const base64Data = reader.result?.toString() || "";

        // Upload using TRPC
        await uploadMutation.mutateAsync({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          data: base64Data,
          pageId: pageId || null,
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: assetsQueryKey });
      refetchAssets();
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      setIsDeleting(true);
      try {
        await deleteMutation.mutateAsync({ id: assetId });
        if (selectedAsset?.id === assetId) {
          setSelectedAsset(null);
        }
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSelectAsset = (asset: AssetType) => {
    setSelectedAsset(asset);
    if (onSelectAsset) {
      onSelectAsset(`/api/assets/${asset.id}`, asset.fileName, asset.fileType);
      if (onClose) {
        onClose();
      }
    }
  };

  const handleDownloadAsset = (asset: AssetType) => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement("a");
    // Use the asset API endpoint URL instead of raw data
    link.href = `/api/assets/${asset.id}`;
    // Set download attribute to force download behavior
    link.download = asset.fileName;
    // Set target to ensure new tab doesn't open
    link.target = "_blank";
    // Set rel for security
    link.rel = "noopener noreferrer";
    // Trigger click programmatically
    link.click();
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page });
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const handleStartEdit = () => {
    if (selectedAsset) {
      setEditedName(selectedAsset.name || "");
      setEditedDescription(selectedAsset.description || "");
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (selectedAsset) {
      try {
        await updateAssetMutation.mutateAsync({
          id: selectedAsset.id,
          name: editedName || null,
          description: editedDescription || null,
        });
      } catch (error) {
        console.error("Error updating asset:", error);
      }
    }
  };

  /**
   * Displays file information (name and size)
   */
  const FileInfo = ({ asset }: { asset: AssetType }) => (
    <div className="mt-2 text-sm">
      {asset.fileName} • {formatFileSize(asset.fileSize)}
    </div>
  );

  // Asset preview component
  /**
   * Renders a preview of an asset based on its file type
   * @param asset - The asset to preview
   * @returns JSX.Element - The appropriate preview component
   */
  const AssetPreview = ({ asset }: { asset: AssetType }) => {
    // Image preview
    if (asset.fileType.startsWith("image/")) {
      return (
        <div className="flex flex-col items-center">
          <img
            src={`/api/assets/${asset.id}`}
            alt={asset.fileName}
            className="object-contain rounded"
          />
          <FileInfo asset={asset} />
        </div>
      );
    }

    // PDF preview
    if (asset.fileType === "application/pdf") {
      return (
        <div className="flex flex-col items-center w-full p-4 h-128">
          <div className="flex items-center justify-center w-full h-full">
            <iframe
              src={`/api/assets/${asset.id}`}
              className="w-full h-full"
              title={`PDF Preview: ${asset.fileName}`}
            />
          </div>
          <FileInfo asset={asset} />
        </div>
      );
    }

    // Default file preview
    return (
      <div className="flex flex-col items-center w-full p-4 h-128">
        <File size={64} className="text-text-secondary" />
        <FileInfo asset={asset} />
      </div>
    );
  };

  // Pagination component
  const Pagination = () => {
    if (!meta) return null;

    const currentPage = meta.currentPage;
    const totalPages = meta.totalPages;

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-text-secondary">
          {meta.totalItems} {meta.totalItems === 1 ? "asset" : "assets"} • Page{" "}
          {currentPage} of {totalPages || 1}
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outlined"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!meta.hasPreviousPage}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outlined"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!meta.hasNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  // Grid view for assets
  const GridView = () => (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className={`relative border rounded-md p-2 cursor-pointer transition ${
            selectedAsset?.id === asset.id
              ? "border-accent bg-accent/10"
              : "hover:bg-background-level1 border-border-light"
          }`}
          onClick={() => setSelectedAsset(asset)}
        >
          <div className="absolute z-10 top-1 right-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteAsset(asset.id);
              }}
              className="p-2 m-1 rounded-full bg-error/30 text-error hover:bg-error/50"
              disabled={isDeleting}
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="flex flex-col items-center">
            {asset.fileType.startsWith("image/") ? (
              <div className="flex items-center justify-center w-20 h-20">
                <img
                  src={`/api/assets/${asset.id}`}
                  alt={asset.fileName}
                  className="object-contain max-w-full max-h-full"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-20 h-20">
                <File size={32} className="text-gray-400" />
              </div>
            )}
            <div className="w-full mt-1 text-xs text-center truncate">
              {asset.name || asset.fileName}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // List view for assets
  const ListView = () => (
    <div className="divide-y divide-border">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className={`flex items-center py-2 px-2 cursor-pointer transition ${
            selectedAsset?.id === asset.id
              ? "bg-accent/10"
              : "hover:bg-background-level1"
          }`}
          onClick={() => setSelectedAsset(asset)}
        >
          <div className="flex-shrink-0 mr-4">
            {asset.fileType.startsWith("image/") ? (
              <div className="flex items-center justify-center w-12 h-10">
                <img
                  src={`/api/assets/${asset.id}`}
                  alt={asset.fileName}
                  className="object-contain max-w-full max-h-full"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-12 h-12">
                <File size={24} className="text-text-secondary" />
              </div>
            )}
          </div>
          <div className="flex-grow overflow-hidden">
            <div className="flex flex-row items-center gap-2">
              <div className="text-sm font-medium truncate">
                {asset.name || asset.fileName}
              </div>
              {asset.description && (
                <div className="text-xs truncate text-text-tertiary">
                  | {asset.description}
                </div>
              )}
            </div>
            <div className="text-xs text-text-tertiary">
              {formatFileSize(asset.fileSize)} •{" "}
              {new Date(asset.createdAt || "").toLocaleDateString()}
            </div>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteAsset(asset.id);
              }}
              className="p-1 rounded-full bg-error/30 text-error hover:bg-error/50"
              disabled={isDeleting}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    isOpen && (
      <Modal
        className="w-full h-full"
        size="full"
        onClose={onClose || (() => {})}
      >
        <div className="flex flex-col h-full min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Asset Manager</h2>
            <div className="flex items-center mr-10 space-x-2">
              <label
                htmlFor="file-upload"
                className={`cursor-pointer inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isUploading ? "bg-accent/50" : "bg-accent hover:bg-accent/80"
                } text-white`}
              >
                <Upload size={16} className="mr-2" />
                {isUploading ? "Uploading..." : "Upload"}
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          <div className="grid flex-grow grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2">
            {/* Assets list */}
            <div className="flex flex-col p-4 overflow-y-auto border rounded-md border-border-light">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Available Assets</h3>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute transform -translate-y-1/2 left-3 top-1/2 text-text-secondary"
                    />
                    <Input
                      type="text"
                      placeholder="Search assets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 pl-9"
                    />
                  </div>
                  <Button
                    size="md"
                    variant="outlined"
                    onClick={toggleViewMode}
                    title={`Switch to ${
                      viewMode === "grid" ? "list" : "grid"
                    } view`}
                  >
                    {viewMode === "grid" ? (
                      <ListIcon size={16} />
                    ) : (
                      <GridIcon size={16} />
                    )}
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-grow pr-4">
                {assets.length === 0 ? (
                  <div className="py-8 text-center text-text-secondary">
                    No assets available
                  </div>
                ) : viewMode === "grid" ? (
                  <GridView />
                ) : (
                  <ListView />
                )}
              </ScrollArea>

              <div className="mt-auto">
                <Pagination />
              </div>
            </div>

            {/* Asset preview */}
            <div className="flex flex-col p-4 overflow-hidden border rounded-md border-border-light">
              {selectedAsset ? (
                <>
                  <div className="flex items-center justify-between flex-shrink-0 mb-2">
                    <h3 className="font-medium">Preview</h3>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadAsset(selectedAsset)}
                      >
                        <Download size={16} className="mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        color="danger"
                        onClick={() => handleDeleteAsset(selectedAsset.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 size={16} className="mr-1" />
                        Delete
                      </Button>
                      {onSelectAsset && !isEditing && (
                        <Button
                          size="sm"
                          variant="solid"
                          color="primary"
                          onClick={() => handleSelectAsset(selectedAsset)}
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="flex-grow pr-4">
                    <div className="flex items-center justify-center flex-grow p-4">
                      <AssetPreview asset={selectedAsset} />
                    </div>
                    <div className="mt-2 text-sm">
                      <div className="mb-3">
                        <label className="block mb-1 text-sm font-medium">
                          Name
                        </label>
                        {isEditing ? (
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            placeholder="Enter asset name"
                            className="w-full"
                          />
                        ) : (
                          <div
                            className="p-2 rounded cursor-pointer hover:bg-background-level1 min-h-[36px]"
                            onClick={handleStartEdit}
                            title="Click to edit name"
                          >
                            {selectedAsset.name || (
                              <span className="italic text-text-secondary">
                                No name set
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label className="block mb-1 text-sm font-medium">
                          Description
                        </label>
                        {isEditing ? (
                          <textarea
                            value={editedDescription}
                            onChange={(e) =>
                              setEditedDescription(e.target.value)
                            }
                            placeholder="Enter asset description"
                            className="w-full px-3 py-2 border rounded-md border-border-light"
                            rows={3}
                          />
                        ) : (
                          <div
                            className="p-2 rounded cursor-pointer hover:bg-background-level1 min-h-[72px] whitespace-pre-wrap"
                            onClick={handleStartEdit}
                            title="Click to edit description"
                          >
                            {selectedAsset.description || (
                              <span className="italic text-text-secondary">
                                No description set
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {isEditing && (
                        <div className="flex justify-end mt-3 mb-3 space-x-2">
                          <Button
                            size="sm"
                            variant="outlined"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="solid"
                            color="primary"
                            onClick={handleSaveEdit}
                            disabled={updateAssetMutation.status === "pending"}
                          >
                            {updateAssetMutation.status === "pending"
                              ? "Saving..."
                              : "Save"}
                          </Button>
                        </div>
                      )}

                      <p>
                        <strong>Filename:</strong> {selectedAsset.fileName}
                      </p>
                      <p>
                        <strong>Uploaded by:</strong>{" "}
                        {selectedAsset.uploadedBy?.name || "Unknown"}
                      </p>
                      <p>
                        <strong>Uploaded on:</strong>{" "}
                        {new Date(
                          selectedAsset.createdAt || ""
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-grow text-text-secondary">
                  <Image size={64} strokeWidth={1} />
                  <p className="mt-2">Select an asset to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    )
  );
};
