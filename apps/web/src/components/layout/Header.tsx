import { UserMenu } from "../auth/UserMenu";
import { Suspense } from "react";
import { ThemeToggle } from "~/components/layout/theme-toggle";
import { AdminButton } from "~/components/layout/AdminButton";
import { RandomNumberDisplay } from "../wiki/RandomNumberDisplay";
import { env } from "~/env";

export function Header() {
  return (
    <header className="border-border-default bg-background-paper flex h-16 items-center justify-between border-b px-4 shadow-sm">
      <div className="flex max-w-xl flex-1 items-center">
        <Suspense fallback={<div>Loading search bar...</div>}></Suspense>
      </div>

      <div className="flex items-center space-x-4">
        {env.NODE_ENV === "development" && <RandomNumberDisplay />}
        <AdminButton />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
