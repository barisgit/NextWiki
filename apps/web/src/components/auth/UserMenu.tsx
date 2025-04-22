"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Popover, PopoverTrigger, PopoverContent } from "@repo/ui";

export function UserMenu() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  if (isLoading) {
    return <div className="bg-card h-9 w-9 animate-pulse rounded-full"></div>;
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="border-border hover:bg-card-hover text-text-primary rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
      >
        Sign in
      </Link>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center space-x-2 focus:outline-none">
          <div className="border-border relative h-9 w-9 overflow-hidden rounded-full border">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || "User profile"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="bg-primary flex h-full w-full items-center justify-center font-medium text-white">
                {session.user.name?.charAt(0) ||
                  session.user.email?.charAt(0) ||
                  "U"}
              </div>
            )}
          </div>
          <span className="text-text-primary text-sm font-medium">
            {session.user.name || session.user.email?.split("@")[0] || "User"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48">
        <div className="px-4 py-2 text-xs text-gray-500">
          Signed in as{" "}
          <span className="font-semibold">{session.user.email}</span>
        </div>
        <div className="border-t border-gray-100">
          <Link
            href="/profile"
            className="text-text-primary hover:bg-card-hover block px-4 py-2 text-sm"
          >
            Your Profile
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-text-primary hover:bg-card-hover block w-full px-4 py-2 text-left text-sm"
          >
            Sign out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
