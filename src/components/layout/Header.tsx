import { UserMenu } from "../auth/UserMenu";
import { Suspense } from "react";
import { ThemeToggle } from "~/components/layout/theme-toggle";
import { AdminButton } from "~/components/layout/AdminButton";

export function Header() {
  return (
    <header className="flex items-center justify-between h-16 px-4 border-b shadow-sm border-border-default bg-background-paper">
      <div className="flex items-center flex-1 max-w-xl">
        <Suspense fallback={<div>Loading search bar...</div>}></Suspense>
      </div>

      <div className="flex items-center space-x-4">
        <AdminButton />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
