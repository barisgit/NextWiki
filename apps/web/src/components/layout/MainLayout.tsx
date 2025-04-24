import { Suspense } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export interface PageMetadata {
  title?: string;
  path?: string;
  id?: number;
  isLocked?: boolean;
  lockedBy?: { id: number; name: string } | null;
  lockExpiresAt?: string | null;
  isCurrentUserLockOwner?: boolean;
}

interface MainLayoutProps {
  children: React.ReactNode;
  pageMetadata?: PageMetadata;
}

export function MainLayout({ children, pageMetadata }: MainLayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header pageMetadata={pageMetadata} />
        <Suspense fallback={<div>Loading...</div>}>
          <main className="flex-1 overflow-auto">{children}</main>
        </Suspense>
      </div>
    </div>
  );
}
