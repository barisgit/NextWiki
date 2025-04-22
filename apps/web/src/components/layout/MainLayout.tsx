import { Suspense } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <Suspense fallback={<div>Loading...</div>}>
          <main className="flex-1 overflow-auto">{children}</main>
        </Suspense>
      </div>
    </div>
  );
}
