"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Card,
  Badge,
  Input,
  Skeleton,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Modal,
} from "@repo/ui";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useTRPC } from "~/server/client";
import type { AppRouter } from "~/server/routers";
import type { inferProcedureOutput, inferProcedureInput } from "@trpc/server";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { useDebounce } from "~/lib/hooks/useDebounce";

// Infer types from procedures
type AdminWikiListOutput = inferProcedureOutput<
  AppRouter["admin"]["wiki"]["list"]
>;
// Base type reflecting server output (Dates)
type PageItemServer = AdminWikiListOutput["items"][number];
type AdminWikiDeleteInput = inferProcedureInput<AppRouter["wiki"]["delete"]>;

// Client-Side Type reflecting serialized dates
type PageItemClient = Omit<
  PageItemServer,
  "createdAt" | "updatedAt" | "lockExpiresAt"
> & {
  createdAt: string | null;
  updatedAt: string | null;
  lockExpiresAt: string | null; // Assuming lockExpiresAt is also a Date serialized to string
};

export default function AdminWikiPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // Use Client type for state
  const [pageToDelete, setPageToDelete] = useState<PageItemClient | null>(null);

  // Define query inputs based on state
  const queryInput = useMemo(
    () => ({
      limit: 20,
      sortBy: sorting[0]?.id as "title" | "path" | "updatedAt" | "createdAt",
      sortOrder: (sorting[0]
        ? sorting[0].desc
          ? "desc"
          : "asc"
        : undefined) as "asc" | "desc" | undefined,
      search: debouncedSearchTerm,
    }),
    [sorting, debouncedSearchTerm]
  );

  // Define infinite query options using the helper
  const listQueryOptions = trpc.admin.wiki.list.infiniteQueryOptions(
    queryInput,
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery(listQueryOptions);

  // Flatten the pages data
  const flatData = useMemo(
    // flatData will have string dates due to serialization
    () => data?.pages?.flatMap((page) => page.items) ?? [],
    [data]
  );

  const { ref, inView } = useInView({ threshold: 0.5 });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Define mutation options using the helper
  const deleteMutationOptions = trpc.wiki.delete.mutationOptions({
    onSuccess: (data, variables: AdminWikiDeleteInput) => {
      const deletedTitle =
        flatData.find((p) => p.id === variables.id)?.title ||
        `ID: ${variables.id}`;
      toast.success(`Page "${deletedTitle}" deleted successfully.`);
      queryClient.invalidateQueries({
        queryKey: trpc.admin.wiki.list.queryKey(),
      });
      setPageToDelete(null);
    },
    // Use 'any' or import TRPCClientErrorLike if preferred
    onError: (error) => {
      toast.error(`Failed to delete page: ${error.message}`);
      console.error("Delete page error:", error);
    },
    onSettled: () => {
      setShowDeleteDialog(false);
    },
  });

  const deletePageMutation = useMutation(deleteMutationOptions);

  // Use Client type for callback parameter
  const handleDeleteClick = useCallback((page: PageItemClient) => {
    setPageToDelete(page);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = () => {
    if (pageToDelete) {
      // pageToDelete is PageItemClient, pass its ID
      deletePageMutation.mutate({ id: pageToDelete.id });
    }
  };

  // Use PageItemClient for Column Definitions
  const columns = useMemo<ColumnDef<PageItemClient>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
          </Button>
        ),
        // row.original is now PageItemClient
        cell: ({ row }) => (
          <div className="font-medium">{row.original.title}</div>
        ),
      },
      {
        accessorKey: "path",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Path
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground break-all text-sm">
            {row.original.path}
          </span>
        ),
      },
      {
        accessorKey: "isPublished",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isPublished ? "success" : "secondary"}>
            {row.original.isPublished ? "Published" : "Draft"}
          </Badge>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Updated
          </Button>
        ),
        // Display string date or relative date
        cell: ({ row }) => (
          <div
            className="text-muted-foreground whitespace-nowrap text-sm"
            title={row.original.updatedAt?.toString() /* Display original string date in title */}
          >
            {row.original.updatedAtRelative} by{" "}
            {row.original.updatedBy?.name || "N/A"}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          // row.original is PageItemClient
          const page = row.original;
          const deleteHandler = useCallback(
            () => handleDeleteClick(page),
            [page]
          );

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-border bg-background-default dark:bg-background-paper border"
                >
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/${page.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      <EyeIcon className="mr-2 h-4 w-4" /> View
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/${page.path}?edit=true`}
                      className="flex items-center"
                    >
                      <PencilIcon className="mr-2 h-4 w-4" /> Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={deleteHandler}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center"
                  >
                    <TrashIcon className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [handleDeleteClick]
  );

  // Initialize the table instance
  const table = useReactTable({
    // Assert flatData type here for safety
    data: flatData as PageItemClient[],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  if (error) {
    return (
      <div className="text-destructive p-4">
        Error loading pages: {error.message}
      </div>
    );
  }

  // JSX Rendering remains largely the same
  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Wiki Pages</h1>
          <p className="text-text-secondary">
            View, edit, and manage all wiki pages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by title or path..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Link href="/create" passHref>
            <Button>Create Page</Button>
          </Link>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{
                        width:
                          header.getSize() !== 150
                            ? header.getSize()
                            : undefined,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading && !data ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {columns.map((col, colIndex) => (
                      <TableCell key={`${col.id || colIndex}-skeleton-${i}`}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No pages found{" "}
                    {debouncedSearchTerm ? `for "${debouncedSearchTerm}"` : ""}.
                  </TableCell>
                </TableRow>
              )}
              {isFetchingNextPage && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-2 text-center"
                  >
                    <span className="text-muted-foreground animate-pulse text-sm">
                      Loading more...
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div ref={ref} style={{ height: "1px" }} />
        {!isLoading && !hasNextPage && flatData.length > 0 && (
          <div className="text-muted-foreground p-4 text-center text-sm">
            End of list.
          </div>
        )}
        {!isLoading &&
          !hasNextPage &&
          flatData.length === 0 &&
          !debouncedSearchTerm && (
            <div className="text-muted-foreground p-4 text-center text-sm">
              No pages exist yet. Create one!
            </div>
          )}
      </Card>

      {showDeleteDialog && pageToDelete && (
        <Modal
          onClose={() => setShowDeleteDialog(false)}
          size="sm"
          showCloseButton={true}
          className="p-6"
        >
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Confirm Deletion</h2>
            <p className="text-muted-foreground text-sm">
              Are you sure you want to delete the page
              <span className="font-semibold">
                {" "}
                &quot;{pageToDelete.title}&quot;
              </span>{" "}
              ({pageToDelete.path})? This action is permanent and cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outlined"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deletePageMutation.isPending}
              >
                {deletePageMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
