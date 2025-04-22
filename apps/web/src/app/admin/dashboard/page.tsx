"use client";

import { useState, useEffect } from "react";
import { Card } from "@repo/ui";

interface StatsItem {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}

// Define type for the static part
interface StaticStatData {
  title: string;
  icon: React.ReactNode;
}

// Define static parts outside the component with explicit type
const staticStatsData: StaticStatData[] = [
  {
    title: "Total Pages",
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
    title: "Total Users",
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
    title: "Total Assets",
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
    title: "User Groups",
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
  const [isLoading, setIsLoading] = useState(true);

  // Initialize state with static titles/icons and placeholder values
  const [stats, setStats] = useState<StatsItem[]>(() =>
    staticStatsData.map((item) => ({ ...item, value: "..." }))
  );

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      // Create the new state manually, using non-null assertions
      const newStats: StatsItem[] = [
        {
          title: staticStatsData[0]!.title,
          icon: staticStatsData[0]!.icon,
          value: 42,
        },
        {
          title: staticStatsData[1]!.title,
          icon: staticStatsData[1]!.icon,
          value: 15,
        },
        {
          title: staticStatsData[2]!.title,
          icon: staticStatsData[2]!.icon,
          value: 87,
        },
        {
          title: staticStatsData[3]!.title,
          icon: staticStatsData[3]!.icon,
          value: 5,
        },
      ];
      setStats(newStats);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []); // Keep empty dependency array

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-text-secondary">Overview of your NextWiki system</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center">
              <div className="bg-background-level1 rounded-full p-3">
                {stat.icon}
              </div>
              <div className="ml-4">
                <p className="text-text-secondary text-sm font-medium">
                  {stat.title}
                </p>
                <p className="text-2xl font-semibold">
                  {isLoading ? (
                    <span className="bg-background-level1 inline-block h-8 w-16 animate-pulse rounded"></span>
                  ) : (
                    stat.value
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
