"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { RegisterForm } from "~/components/auth/RegisterForm";
import { usePermissions } from "~/components/auth/permission/client";
import { Button } from "@repo/ui";

export default function RegisterPage({
  isFirstUser = false,
}: {
  isFirstUser?: boolean;
}) {
  const router = useRouter();
  const { isAuthenticated } = usePermissions();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="bg-background-paper flex h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            {isFirstUser ? "Create Admin Account" : "Create Account"}
          </h2>
          {isFirstUser && (
            <p className="text-text-secondary mt-2 text-center text-sm">
              This will be the first user and will have admin privileges
            </p>
          )}
        </div>

        <RegisterForm isFirstUser={isFirstUser} />

        <Button
          className="fixed bottom-16 left-16 rounded-full"
          variant="outlined"
          onClick={() => router.push("/")}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to home
        </Button>
      </div>
    </div>
  );
}
