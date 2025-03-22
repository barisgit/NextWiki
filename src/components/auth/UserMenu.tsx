"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  if (isLoading) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200"></div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-foreground text-sm font-medium transition-colors"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className="relative h-9 w-9 rounded-full overflow-hidden border border-border">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User profile"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary text-white font-medium">
              {session.user.name?.charAt(0) ||
                session.user.email?.charAt(0) ||
                "U"}
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-foreground">
          {session.user.name || session.user.email?.split("@")[0] || "User"}
        </span>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 py-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="px-4 py-2 text-xs text-gray-500">
            Signed in as{" "}
            <span className="font-semibold">{session.user.email}</span>
          </div>
          <div className="border-t border-gray-100">
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              Your Profile
            </Link>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
