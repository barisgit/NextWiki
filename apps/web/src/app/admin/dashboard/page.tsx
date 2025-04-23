"use client";

import { Card } from "@repo/ui";
import { useTRPC } from "~/server/client";
import { useQuery } from "@tanstack/react-query";
import type { AppRouter } from "~/server/routers";

// Define type for the stats object returned by the API
type SystemStatsQueryProcedure = AppRouter["admin"]["system"]["getStats"];
type SystemStats = Awaited<ReturnType<SystemStatsQueryProcedure>>;

// Define type for the static part, adding a key to link to API data
interface StaticStatData {
  title: string;
  icon: React.ReactNode;
  key: keyof SystemStats; // Key to match the field in SystemStats
}

// TODO: Make stats clickable and redirect to the respective page

// Define static parts outside the component with explicit type and key
const staticStatsData: StaticStatData[] = [
  {
    title: "Total Pages",
    key: "pageCount",
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
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    title: "User Groups",
    key: "groupCount",
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
];

export default function AdminDashboardPage() {
  // Fetch system stats using tRPC and TanStack Query
  const trpc = useTRPC();
  const {
    data: statsData,
    isLoading,
    error,
  } = useQuery(trpc.admin.system.getStats.queryOptions());

  // Handle error state
  if (error) {
    return (
      <div>Error loading system stats: {error.message}. Check permissions.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-text-secondary">Overview of your NextWiki system</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {staticStatsData.map((statDef) => (
          <Card key={statDef.key} className="p-6">
            <div className="flex items-center">
              <div className="bg-background-level1 rounded-full p-3">
                {statDef.icon}
              </div>
              <div className="ml-4">
                <p className="text-text-secondary text-sm font-medium">
                  {statDef.title}
                </p>
                <p className="text-2xl font-semibold">
                  {isLoading || !statsData ? (
                    <span className="bg-background-level1 inline-block h-8 w-16 animate-pulse rounded"></span>
                  ) : (
                    statsData[statDef.key]
                  )}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-medium">Recent Pages</h2>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-background-level1 h-12 animate-pulse rounded"
                ></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-text-secondary">
                Recent page activity will be shown here
              </p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-medium">System Health</h2>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-background-level1 h-12 animate-pulse rounded"
                ></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Database</span>
                <span className="text-success-500">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Storage</span>
                <span className="text-success-500">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cache</span>
                <span className="text-success-500">Healthy</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
