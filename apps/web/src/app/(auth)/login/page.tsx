"use client";

import { LoginForm } from "~/components/auth/LoginForm";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "~/components/auth/permission/client";
import { Button } from "@repo/ui";
import { ArrowLeftIcon } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, hasPermission } = usePermissions();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const hasWikiReadPermission = hasPermission("wiki:page:read");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8 bg-background-paper">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-center">
            Sign in to NextWiki
          </h2>
          {!hasWikiReadPermission && (
            <p className="mt-2 text-sm text-center text-text-secondary">
              This is a private wiki. You need to be logged in to access it.
            </p>
          )}
        </div>

        <Suspense fallback={<div>Loading login form...</div>}>
          <LoginForm />
        </Suspense>
      </div>

      {/* Show the back to home button if the user has the wiki:page:read permission, otherwise they will be redirected back here so no need to show it */}
      {hasWikiReadPermission && (
        <Button
          className="fixed rounded-full bottom-16 left-16"
          variant="outlined"
          onClick={() => router.push("/")}
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to home
        </Button>
      )}
    </div>
  );
}
