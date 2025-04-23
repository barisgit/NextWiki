"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { env } from "~/env";
import { cn, ScrollArea } from "@repo/ui";
import {
  HomeIcon,
  BookOpenIcon,
  UsersIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  PhotoIcon,
  CogIcon,
  BeakerIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  condition?: boolean;
}

const navigationItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/admin/wiki", label: "Wiki Pages", icon: BookOpenIcon },
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/permissions", label: "Permissions", icon: ShieldCheckIcon },
  { href: "/admin/groups", label: "Groups", icon: UserGroupIcon },
  { href: "/admin/assets", label: "Assets", icon: PhotoIcon },
  {
    href: "/admin/example",
    label: "Permission Example",
    icon: BeakerIcon,
    condition: env.NEXT_PUBLIC_NODE_ENV === "development",
  },
  { href: "/admin/settings", label: "Settings", icon: CogIcon },
];

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
    <div className="bg-background-paper flex min-h-screen">
      {/* Sidebar */}
      <div
        className={`border-border-default fixed bottom-0 left-0 top-0 z-20 border-r transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        } bg-background-level1`}
      >
        <div className="flex h-full flex-col">
          <div
            className={`border-border-default flex h-16 items-center border-b px-4 ${
              collapsed ? "justify-center" : "justify-between"
            }`}
          >
            {!collapsed && (
              <h1 className="text-text-primary text-lg font-semibold">
                NextWiki Admin
              </h1>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hover:bg-background-level2 text-text-secondary rounded-md p-1"
            >
              {collapsed ? (
                <ChevronDoubleRightIcon className="h-5 w-5" />
              ) : (
                <ChevronDoubleLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-5">
            <nav className="space-y-1 px-2">
              {navigationItems.map(
                (item) =>
                  (item.condition === undefined || item.condition) && (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md px-3 py-2 transition-colors",
                        isActive(item.href)
                          ? "bg-primary/10 text-primary"
                          : "text-text-primary hover:bg-background-level2",
                        collapsed ? "justify-center" : ""
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0",
                          collapsed ? "" : "mr-3"
                        )}
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  )
              )}
            </nav>
          </div>

          <div className="border-border-default border-t p-4">
            <Link
              href="/"
              className={cn(
                "text-text-secondary hover:bg-background-level2 flex items-center rounded-md px-3 py-2",
                collapsed ? "justify-center" : ""
              )}
            >
              <ArrowLeftOnRectangleIcon
                className={cn("h-5 w-5 flex-shrink-0", collapsed ? "" : "mr-3")}
              />
              {!collapsed && <span>Back to Wiki</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          "flex h-screen flex-1 flex-col transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        {/* Top bar */}
        <header className="bg-background-paper border-border-default sticky top-0 z-10 flex h-16 items-center border-b px-6">
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-medium">Admin Panel</h1>
            <div className="flex items-center space-x-4">
              <span className="text-text-secondary text-sm">
                Welcome, Admin
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <ScrollArea className="flex-1 overflow-y-auto">{children}</ScrollArea>
      </div>
    </div>
  );
}
