"use client";

import { useRouter } from "next/navigation";
import { RegisterForm } from "~/components/auth/RegisterForm";
import { usePermissions } from "~/components/auth/permission/client";

export default function RegisterPage({
  isFirstUser = false,
}: {
  isFirstUser?: boolean;
}) {
  const router = useRouter();
  const { isAuthenticated } = usePermissions();
  if (isAuthenticated) {
    router.push("/");
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 py-12 sm:px-6 lg:px-8 bg-background-paper">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-center">
            {isFirstUser ? "Create Admin Account" : "Create Account"}
          </h2>
          {isFirstUser && (
            <p className="mt-2 text-sm text-center text-text-secondary">
              This will be the first user and will have admin privileges
            </p>
          )}
        </div>

        <RegisterForm isFirstUser={isFirstUser} />
      </div>
    </div>
  );
}
