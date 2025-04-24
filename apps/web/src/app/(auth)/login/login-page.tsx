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
    <div className="bg-background-paper flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            Sign in to NextWiki
          </h2>
          {!hasWikiReadPermission && (
            <p className="text-text-secondary mt-2 text-center text-sm">
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
          className="fixed bottom-16 left-16 rounded-full"
          variant="outlined"
          onClick={() => router.push("/")}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to home
        </Button>
      )}
    </div>
  );
}
