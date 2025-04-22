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
    return <div className="rounded-full bg-card h-9 w-9 animate-pulse"></div>;
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 text-sm font-medium transition-colors border rounded-lg border-border hover:bg-card-hover text-text-primary"
      >
        Sign in
      </Link>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center space-x-2 focus:outline-none">
          <div className="relative overflow-hidden border rounded-full h-9 w-9 border-border">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || "User profile"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full font-medium text-white bg-primary">
                {session.user.name?.charAt(0) ||
                  session.user.email?.charAt(0) ||
                  "U"}
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-text-primary">
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
            className="block px-4 py-2 text-sm text-text-primary hover:bg-card-hover"
          >
            Your Profile
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="block w-full px-4 py-2 text-sm text-left text-text-primary hover:bg-card-hover"
          >
            Sign out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
