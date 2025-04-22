"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function AdminButton() {
  const { data: session } = useSession();

  // Only show the button if the user is an admin
  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <Link
      href="/admin/dashboard"
      className="bg-primary hover:bg-primary-600 flex items-center rounded-md px-3 py-2 text-sm font-medium text-white transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="mr-1.5 h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947z"
          clipRule="evenodd"
        />
        <path d="M10 13a3 3 0 100-6 3 3 0 000 6z" />
      </svg>
      Admin
    </Link>
  );
}
