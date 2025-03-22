import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-border h-16 px-4 flex items-center justify-between bg-background shadow-sm">
      <div className="flex items-center flex-1 max-w-xl">
        <div className="w-full relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search wiki..."
            className="w-full py-2 pl-10 pr-4 rounded-lg bg-input border border-border hover:border-border-hover focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground text-sm transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* This would typically connect to your auth system */}
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-foreground text-sm font-medium transition-colors"
        >
          Sign in
        </Link>

        {/* User menu would go here once user is authenticated */}
      </div>
    </header>
  );
}
