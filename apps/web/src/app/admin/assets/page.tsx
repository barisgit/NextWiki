"use client";

import { useState } from "react";
import { useTRPC } from "~/server/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNotification } from "~/lib/hooks/useNotification";
import { Input } from "@repo/ui";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";

/* TODO: A lot to be done here and for assets in general
 * - Add pagination URGENT
 * - Add search
 * - Add filter by file type
 * - Add filter by uploaded by
 * - Add filter by page
 * - Add filter by date
 * - Implement preview for images
 * - Implement download
 */

export default function AssetsAdminPage() {
  const notification = useNotification();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFileType, setSelectedFileType] = useState<string>("all");

  const trpc = useTRPC();

  // Get all assets
  const assetsQuery = useQuery(trpc.assets.getAll.queryOptions({}));

  // Delete asset mutation
  const deleteAssetMutation = useMutation(
    trpc.assets.delete.mutationOptions({
      onSuccess: () => {
        notification.success("Asset deleted successfully");
        assetsQuery.refetch();
      },
      onError: (error) => {
        notification.error(`Failed to delete asset: ${error.message}`);
      },
    })
  );

  // Handle asset deletion
  const handleDeleteAsset = (assetId: string) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      deleteAssetMutation.mutate({ id: assetId });
    }
  };

  // Get all unique file types
  const fileTypes = assetsQuery.data
    ? Array.from(
        new Set(
          assetsQuery.data
            .map((asset) => asset.fileType?.split("/")[0])
            .filter((type): type is string => !!type)
        )
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
    <div className="container mx-auto px-6 py-3">
      <h1 className="mb-6 text-3xl font-bold">Asset Management</h1>

      {/* Search and filter controls */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by file name..."
            className="w-full rounded-md border px-3 py-2"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
          />
        </div>
        <div>
          <Select
            value={selectedFileType}
            onValueChange={(value: string) => setSelectedFileType(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All file types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All file types</SelectItem>
              {fileTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading state */}
      {assetsQuery.isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <span className="ml-2">Loading assets...</span>
        </div>
      )}

      {/* Empty state */}
      {!assetsQuery.isLoading && filteredAssets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-gray-400"
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
          <table className="bg-background-paper border-border-default min-w-full rounded-lg border">
            <thead>
              <tr className="bg-background-level1">
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
            <tbody className="divide-border-default divide-y">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-background-level2">
                  <td className="px-4 py-2">
                    {asset.fileType.startsWith("image/") ? (
                      <Image
                        src={`/api/assets/${asset.id}`}
                        alt={asset.fileName}
                        width={48}
                        height={48}
                        className="border-border-default h-12 w-12 rounded border object-cover"
                      />
                    ) : (
                      <div className="text-text-secondary bg-background-level1 border-border-default flex h-12 w-12 items-center justify-center rounded border">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
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
                    {asset.id ? (
                      <a
                        href={`/admin/wiki/${asset.id}`}
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
