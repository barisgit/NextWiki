import { UserMenu } from "../auth/UserMenu";
import { SearchBar } from "~/components/layout/SearchBar";
import { Suspense } from "react";

export function Header() {
  return (
    <header className="flex items-center justify-between h-16 px-4 border-b shadow-sm border-border bg-background">
      <div className="flex items-center flex-1 max-w-xl">
        <Suspense fallback={<div>Loading search bar...</div>}>
          <SearchBar />
        </Suspense>
      </div>

      <div className="flex items-center space-x-4">
        <UserMenu />
      </div>
    </header>
  );
}
