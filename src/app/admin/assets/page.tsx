"use client";

import { useState } from "react";
import { trpc } from "~/lib/trpc/client";
import { useNotification } from "~/lib/hooks/useNotification";
import { AdminLayout } from "~/components/layout/AdminLayout";

export default function AssetsAdminPage() {
  const notification = useNotification();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFileType, setSelectedFileType] = useState<string>("all");

  // Get all assets
  const assetsQuery = trpc.assets.getAll.useQuery({});

  // Delete asset mutation
  const deleteAssetMutation = trpc.assets.delete.useMutation({
    onSuccess: () => {
      notification.success("Asset deleted successfully");
      assetsQuery.refetch();
    },
    onError: (error) => {
      notification.error(`Failed to delete asset: ${error.message}`);
    },
  });

  // Handle asset deletion
  const handleDeleteAsset = (assetId: number) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      deleteAssetMutation.mutate({ id: assetId });
    }
  };

  // Get all unique file types
  const fileTypes = assetsQuery.data
    ? Array.from(
        new Set(assetsQuery.data.map((asset) => asset.fileType.split("/")[0]))
      )
    : [];

  // Filter assets
  const filteredAssets = assetsQuery.data
    ? assetsQuery.data.filter((asset) => {
        const matchesSearch = searchTerm
          ? asset.fileName.toLowerCase().includes(searchTerm.toLowerCase())
          : true;
        const matchesType =
          selectedFileType === "all" ||
          asset.fileType.startsWith(selectedFileType);
        return matchesSearch && matchesType;
      })
    : [];

  return (
    <AdminLayout>
      <div className="container px-6 mx-auto">
        <h1 className="mb-6 text-3xl font-bold">Asset Management</h1>

        {/* Search and filter controls */}
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by file name..."
              className="w-full px-3 py-2 border rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="all">All file types</option>
              {fileTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading state */}
        {assetsQuery.isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            <span className="ml-2">Loading assets...</span>
          </div>
        )}

        {/* Empty state */}
        {!assetsQuery.isLoading && filteredAssets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-medium text-gray-600">
              No assets found
            </h2>
            <p className="mt-2 text-gray-500">
              {searchTerm || selectedFileType !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Upload some files through the wiki editor to get started"}
            </p>
          </div>
        )}

        {/* Asset table */}
        {!assetsQuery.isLoading && filteredAssets.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Preview</th>
                  <th className="px-4 py-2 text-left">File Name</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Size</th>
                  <th className="px-4 py-2 text-left">Uploaded By</th>
                  <th className="px-4 py-2 text-left">Page</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {asset.fileType.startsWith("image/") ? (
                        <img
                          src={`/api/assets/${asset.id}`}
                          alt={asset.fileName}
                          className="object-cover w-12 h-12 border border-gray-200 rounded"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-12 h-12 text-gray-400 bg-gray-100 border border-gray-200 rounded">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6"
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
                      )}
                    </td>
                    <td className="px-4 py-2 font-medium">{asset.fileName}</td>
                    <td className="px-4 py-2">{asset.fileType}</td>
                    <td className="px-4 py-2">
                      {formatFileSize(asset.fileSize)}
                    </td>
                    <td className="px-4 py-2">
                      {asset.uploadedBy?.name || "Unknown"}
                    </td>
                    <td className="px-4 py-2">
                      {asset.pageId ? (
                        <a
                          href={`/admin/wiki/${asset.pageId}`}
                          className="text-blue-600 hover:underline"
                        >
                          View Page
                        </a>
                      ) : (
                        "Not attached"
                      )}
                    </td>
                    <td className="px-4 py-2">{formatDate(asset.createdAt)}</td>
                    <td className="px-4 py-2">
                      <div className="flex space-x-2">
                        <a
                          href={`/api/assets/${asset.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  else return (bytes / 1073741824).toFixed(1) + " GB";
}

// Helper function to format date
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Unknown";
  const d = new Date(date);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}
