"use client";

import { Card, Skeleton, Button } from "@repo/ui";
import { useTRPC } from "~/server/client";
import { useQuery } from "@tanstack/react-query";
import type { AppRouter } from "~/server/routers";
import Link from "next/link";

// Define type for the stats object returned by the API
type SystemStatsQueryProcedure = AppRouter["admin"]["system"]["getStats"];
type SystemStats = Awaited<ReturnType<SystemStatsQueryProcedure>>;
// SystemStats type is now automatically inferred to include lockedPagesCount and activeSessionCount

// Define type for the static part, adding a key to link to API data
interface StaticStatData {
  title: string;
  icon: React.ReactNode;
  // Key type now includes activeSessionCount
  key: keyof Omit<SystemStats, "dbStatus" | "dbError">;
  link?: string; // Optional link for the card
}

// TODO: Make stats clickable and redirect to the respective page

// Define static parts outside the component with explicit type and key
const staticStatsData: StaticStatData[] = [
  {
    title: "Total Pages",
    key: "pageCount",
    link: "/admin/wiki",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary-400 h-6 w-6"
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
    ),
  },
  {
    title: "Total Tags",
    key: "tagCount",
    link: "/tags",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="text-secondary-400 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12.586 2.586a2 2 0 00-2.828 0L7 5.172V4a1 1 0 10-2 0v4.5a.5.5 0 00.146.354l6.5 6.5a2 2 0 002.828 0l4.5-4.5a2 2 0 000-2.828l-6.914-6.914zM6 8.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
        />
      </svg>
    ),
  },
  {
    title: "Total Assets",
    key: "assetCount",
    link: "/admin/assets",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="text-accent-400 h-6 w-6"
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
    ),
  },
  {
    title: "Total Users",
    key: "userCount",
    link: "/admin/users",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="text-info-400 h-6 w-6" // Changed color for variety
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    title: "User Groups",
    key: "groupCount",
    link: "/admin/groups",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="text-complementary-400 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  // Add new stat for active sessions
  {
    title: "Active Sessions",
    key: "activeSessionCount",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="text-success-400 h-6 w-6" // New color
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    ),
  },
];

// New HealthCheckItem component
function HealthCheckItem({
  label,
  status,
  isLoading,
  error,
  onRefresh,
}: {
  label: string;
  // Update status type to match systemService
  status?: "healthy" | "unhealthy" | "pending" | "not-implemented" | "error";
  isLoading: boolean;
  error?: string | null;
  onRefresh?: () => void;
}) {
  const getStatusIndicator = () => {
    if (isLoading) {
      return <span className="text-text-secondary">Checking...</span>;
    }
    // Use the error prop directly
    if (error) {
      // Display the error message if available
      return (
        <span className="text-destructive-500" title={error}>
          Error
        </span>
      );
    }
    switch (status) {
      case "healthy":
        return <span className="text-success-500">Healthy</span>;
      case "unhealthy":
      case "error": // Treat 'error' status similar to 'unhealthy'
        return <span className="text-destructive-500">Unhealthy</span>;
      case "not-implemented":
        return <span className="text-warning-500">Not Implemented</span>;
      case "pending": // Handle 'pending' status explicitly
      default:
        return <span className="text-text-secondary">Pending...</span>;
    }
  };

  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        {getStatusIndicator()}
        {onRefresh && (
          <Button
            variant="outlined_simple"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            Ping
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const trpc = useTRPC();

  // Query for System Stats
  const {
    data: statsData,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = useQuery(trpc.admin.system.getStats.queryOptions());

  // Query for Recent Pages
  const recentPagesQueryOptions = trpc.admin.wiki.list.queryOptions(
    { limit: 5, sortBy: "updatedAt", sortOrder: "desc" },
    { select: (data) => data.items } // Select only the items array
  );
  const {
    data: recentPages,
    isLoading: isLoadingPages,
    error: pagesError,
  } = useQuery(recentPagesQueryOptions);

  // NEW: Query for Locked Pages
  const lockedPagesQueryOptions = trpc.admin.wiki.listLocked.queryOptions(
    { limit: 5 }, // Fetch top 5 locked pages for the dashboard
    {
      // Optional: configure refetch behavior if needed
      // refetchOnWindowFocus: false,
    }
  );
  const {
    data: lockedPages,
    isLoading: isLoadingLockedPages,
    error: lockedPagesError,
  } = useQuery(lockedPagesQueryOptions);

  // Handle error state for stats
  if (statsError) {
    return (
      <div>
        Error loading system stats: {statsError.message}. Check permissions.
      </div>
    );
  }
  // Handle error state for pages
  if (pagesError) {
    // Log or display the error, but allow the rest of the dashboard to render
    console.error("Error loading recent pages:", pagesError.message);
  }

  // Handle error state for locked pages (log it, maybe show message in card)
  if (lockedPagesError) {
    console.error("Error loading locked pages:", lockedPagesError.message);
    // Decide if you want to stop rendering or show an error in the card
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-text-secondary">Overview of your NextWiki system</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
        {staticStatsData.map((statDef) => (
          <Link key={statDef.key} href={statDef.link || "#"} passHref>
            <Card className="hover:bg-background-level1 h-full p-6 transition-colors">
              <div className="flex items-center">
                <div className="bg-background-level1 rounded-full p-3">
                  {statDef.icon}
                </div>
                <div className="ml-4">
                  <p className="text-text-secondary text-sm font-medium">
                    {statDef.title}
                  </p>
                  <p className="text-2xl font-semibold">
                    {isLoadingStats || !statsData ? (
                      <span className="bg-background-level1 inline-block h-8 w-16 animate-pulse rounded"></span>
                    ) : (
                      statsData[statDef.key]
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-medium">Recent Pages</h2>
          {isLoadingPages ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-4 w-1/5" />
                </div>
              ))}
            </div>
          ) : pagesError ? (
            <p className="text-destructive-500 text-sm">
              Failed to load recent pages.
            </p>
          ) : recentPages && recentPages.length > 0 ? (
            <ul className="space-y-2">
              {recentPages.map((page) => (
                <li
                  key={page.id}
                  className="flex items-center justify-between text-sm"
                >
                  <Link
                    href={`/${page.path}`}
                    className="text-primary-500 hover:underline"
                  >
                    {page.title}
                  </Link>
                  <span className="text-text-secondary whitespace-nowrap">
                    {page.updatedAtRelative}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-secondary text-sm">No pages found.</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-medium">Pages Being Edited</h2>
          {isLoadingLockedPages ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-4 w-1/5" />
                </div>
              ))}
            </div>
          ) : lockedPagesError ? (
            <p className="text-destructive-500 text-sm">
              Failed to load locked pages.
            </p>
          ) : lockedPages && lockedPages.length > 0 ? (
            <ul className="space-y-2">
              {lockedPages.map((page) => (
                <li
                  key={page.id}
                  className="flex flex-col justify-start text-sm"
                >
                  <Link
                    href={`/${page.path}`}
                    className="text-primary-500 hover:underline"
                  >
                    {page.title}
                  </Link>
                  <span className="text-text-secondary whitespace-nowrap text-xs">
                    Locked by {page.lockedBy?.name || "Unknown User"}{" "}
                    {page.lockedAtRelative}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-secondary text-sm">
              No pages are currently being edited.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-medium">System Health</h2>
          {isLoadingStats ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <HealthCheckItem
                label="Database"
                status={statsData?.dbStatus ?? "pending"}
                isLoading={isLoadingStats}
                error={statsData?.dbError}
                onRefresh={() => {
                  refetchStats();
                }}
              />
              <HealthCheckItem
                label="Storage"
                status="not-implemented"
                isLoading={false}
              />
              <HealthCheckItem
                label="Cache"
                status="not-implemented"
                isLoading={false}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
