"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  return (
    <div className="flex min-h-screen bg-background-paper">
      {/* Sidebar */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-20 border-r border-border-default transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        } bg-background-level1`}
      >
        <div className="flex flex-col h-full">
          <div
            className={`flex items-center h-16 px-4 border-b border-border-default ${
              collapsed ? "justify-center" : "justify-between"
            }`}
          >
            {!collapsed && (
              <h1 className="text-lg font-semibold text-text-primary">
                NextWiki Admin
              </h1>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md hover:bg-background-level2 text-text-secondary"
            >
              {collapsed ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>

          <div className="flex-1 py-5 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {/* Dashboard */}
              <Link
                href="/admin/dashboard"
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  isActive("/admin/dashboard")
                    ? "bg-primary/10 text-primary"
                    : "text-text-primary hover:bg-background-level2"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`flex-shrink-0 h-5 w-5 ${collapsed ? "" : "mr-3"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                {!collapsed && <span>Dashboard</span>}
              </Link>

              {/* Wiki Pages */}
              <Link
                href="/admin/wiki"
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  isActive("/admin/wiki")
                    ? "bg-primary/10 text-primary"
                    : "text-text-primary hover:bg-background-level2"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`flex-shrink-0 h-5 w-5 ${collapsed ? "" : "mr-3"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
                {!collapsed && <span>Wiki Pages</span>}
              </Link>

              {/* Users */}
              <Link
                href="/admin/users"
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  isActive("/admin/users")
                    ? "bg-primary/10 text-primary"
                    : "text-text-primary hover:bg-background-level2"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`flex-shrink-0 h-5 w-5 ${collapsed ? "" : "mr-3"}`}
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
                {!collapsed && <span>Users</span>}
              </Link>

              {/* Groups */}
              <Link
                href="/admin/groups"
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  isActive("/admin/groups")
                    ? "bg-primary/10 text-primary"
                    : "text-text-primary hover:bg-background-level2"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`flex-shrink-0 h-5 w-5 ${collapsed ? "" : "mr-3"}`}
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
                {!collapsed && <span>Groups</span>}
              </Link>

              {/* Assets */}
              <Link
                href="/admin/assets"
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  isActive("/admin/assets")
                    ? "bg-primary/10 text-primary"
                    : "text-text-primary hover:bg-background-level2"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`flex-shrink-0 h-5 w-5 ${collapsed ? "" : "mr-3"}`}
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
                {!collapsed && <span>Assets</span>}
              </Link>

              {/* Settings */}
              <Link
                href="/admin/settings"
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  isActive("/admin/settings")
                    ? "bg-primary/10 text-primary"
                    : "text-text-primary hover:bg-background-level2"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`flex-shrink-0 h-5 w-5 ${collapsed ? "" : "mr-3"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {!collapsed && <span>Settings</span>}
              </Link>
            </nav>
          </div>

          <div className="p-4 border-t border-border-default">
            <Link
              href="/"
              className={`flex items-center px-3 py-2 rounded-md text-text-secondary hover:bg-background-level2 ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`flex-shrink-0 h-5 w-5 ${collapsed ? "" : "mr-3"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 17l-5-5m0 0l5-5m-5 5h12"
                />
              </svg>
              {!collapsed && <span>Back to Wiki</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? "ml-16" : "ml-64"
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center h-16 px-6 border-b bg-background-paper border-border-default">
          <div className="flex items-center justify-between flex-1">
            <h1 className="text-lg font-medium">Admin Panel</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-text-secondary">
                Welcome, Admin
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
