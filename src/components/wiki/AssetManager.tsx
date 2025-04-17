"use client";

import { useState, useEffect } from "react";
import { useNotification } from "~/lib/hooks/useNotification";
import { useTRPC } from "~/lib/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import Modal from "~/components/ui/modal";

interface AssetManagerProps {
  onAssetSelect?: (assetUrl: string, assetName: string) => void;
  pageId?: number;
  isOpen: boolean;
  onClose: () => void;
}

type Asset = {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedById: number;
  uploadedBy?: {
    id: number;
    name: string | null;
  };
  pageId?: number | null;
  createdAt?: Date | string | null;
};

export function AssetManager({
  onAssetSelect,
  pageId,
  isOpen,
  onClose,
}: AssetManagerProps) {
  const notification = useNotification();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "page">("all");
  const [search, setSearch] = useState("");

  const trpc = useTRPC();

  // Get assets for the current page
  const pageAssetsQuery = useQuery(
    trpc.assets.getByPageId.queryOptions(
      { pageId: pageId || 0 },
      {
        enabled: Boolean(pageId) && filter === "page" && isOpen,
      }
    )
  );

  // Get all assets
  const allAssetsQuery = useQuery(
    trpc.assets.getAll.queryOptions({
      enabled: filter === "all" && isOpen,
    })
  );

  useEffect(() => {
    setAssets(pageAssetsQuery.data || allAssetsQuery.data || []);
  }, [pageAssetsQuery.data, allAssetsQuery.data]);

  // Delete asset mutation
  const deleteAssetMutation = useMutation(
    trpc.assets.delete.mutationOptions({
      onSuccess: () => {
        notification.success("Asset deleted successfully");
        // Refresh the queries
        if (filter === "all") {
          void allAssetsQuery.refetch();
        } else {
          void pageAssetsQuery.refetch();
        }
      },
      onError: (error) => {
        notification.error(`Failed to delete asset: ${error.message}`);
      },
    })
  );

  // Update assets when queries complete
  useEffect(() => {
    if (filter === "all" && allAssetsQuery.data) {
      setAssets(allAssetsQuery.data);
      setIsLoading(false);
    } else if (filter === "page" && pageAssetsQuery.data) {
      setAssets(pageAssetsQuery.data);
      setIsLoading(false);
    }
  }, [filter, allAssetsQuery.data, pageAssetsQuery.data]);

  // Handle filter change
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    if (filter === "all") {
      void allAssetsQuery.refetch();
    } else if (pageId) {
      void pageAssetsQuery.refetch();
    } else {
      setIsLoading(false);
      setAssets([]);
    }
  }, [filter, pageId, isOpen, allAssetsQuery, pageAssetsQuery]);

  // Handle asset selection
  const handleAssetSelect = (asset: Asset) => {
    if (onAssetSelect) {
      onAssetSelect(`/api/assets/${asset.id}`, asset.fileName);
      onClose();
    }
  };

  // Handle asset deletion
  const handleDeleteAsset = (assetId: number) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      deleteAssetMutation.mutate({ id: assetId });
    }
  };

  // Filter assets by search term
  const filteredAssets = assets.filter((asset) =>
    asset.fileName.toLowerCase().includes(search.toLowerCase())
  );

  // Group assets by type
  const imageAssets = filteredAssets.filter((asset) =>
    asset.fileType.startsWith("image/")
  );
  const documentAssets = filteredAssets.filter(
    (asset) =>
      asset.fileType.includes("pdf") ||
      asset.fileType.includes("document") ||
      asset.fileType.includes("sheet") ||
      asset.fileType.includes("presentation")
  );
  const otherAssets = filteredAssets.filter(
    (asset) =>
      !asset.fileType.startsWith("image/") &&
      !asset.fileType.includes("pdf") &&
      !asset.fileType.includes("document") &&
      !asset.fileType.includes("sheet") &&
      !asset.fileType.includes("presentation")
  );

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      size="lg"
      backgroundClass="bg-white"
      closeOnEscape={true}
      showCloseButton={true}
    >
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-800">Asset Manager</h3>
        <div className="flex flex-col space-y-4">
          {/* Search and filters */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search assets..."
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | "page")}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!pageId}
              >
                <option value="all">All Assets</option>
                <option value="page" disabled={!pageId}>
                  Page Assets Only
                </option>
              </select>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="w-6 h-6 border-2 border-gray-300 rounded-full animate-spin border-t-primary"></div>
              <span className="ml-2 text-gray-600">Loading assets...</span>
            </div>
          )}

          {/* No assets found */}
          {!isLoading && filteredAssets.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-gray-600">No assets found</p>
            </div>
          )}

          {/* Asset grid */}
          {!isLoading && filteredAssets.length > 0 && (
            <div className="space-y-6">
              {/* Images section */}
              {imageAssets.length > 0 && (
                <div>
                  <h3 className="mb-2 text-lg font-medium text-gray-700">
                    Images
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {imageAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="relative overflow-hidden border rounded-md group"
                      >
                        <div className="relative pt-[75%]">
                          <img
                            src={`/api/assets/${asset.id}`}
                            alt={asset.fileName}
                            className="absolute inset-0 object-cover w-full h-full bg-gray-50"
                          />
                        </div>
                        <div className="p-2 text-xs truncate">
                          {asset.fileName}
                        </div>
                        <div className="absolute inset-0 flex-col items-center justify-center hidden bg-black bg-opacity-50 group-hover:flex">
                          <button
                            onClick={() => handleAssetSelect(asset)}
                            className="px-3 py-1 mb-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                          >
                            Use
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents section */}
              {documentAssets.length > 0 && (
                <div>
                  <h3 className="mb-2 text-lg font-medium text-gray-700">
                    Documents
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {documentAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="relative overflow-hidden border rounded-md group"
                      >
                        <div className="flex items-center justify-center h-32 bg-gray-50">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-16 h-16 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div className="p-2 text-xs truncate">
                          {asset.fileName}
                        </div>
                        <div className="absolute inset-0 flex-col items-center justify-center hidden bg-black bg-opacity-50 group-hover:flex">
                          <button
                            onClick={() => handleAssetSelect(asset)}
                            className="px-3 py-1 mb-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                          >
                            Use
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other files section */}
              {otherAssets.length > 0 && (
                <div>
                  <h3 className="mb-2 text-lg font-medium text-gray-700">
                    Other Files
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {otherAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="relative overflow-hidden border rounded-md group"
                      >
                        <div className="flex items-center justify-center h-32 bg-gray-50">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-16 h-16 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                        </div>
                        <div className="p-2 text-xs truncate">
                          {asset.fileName}
                        </div>
                        <div className="absolute inset-0 flex-col items-center justify-center hidden bg-black bg-opacity-50 group-hover:flex">
                          <button
                            onClick={() => handleAssetSelect(asset)}
                            className="px-3 py-1 mb-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                          >
                            Use
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
