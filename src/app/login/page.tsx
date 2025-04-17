import { LoginForm } from "~/components/auth/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8 bg-background-paper">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-center">
            Sign in to NextWiki
          </h2>
        </div>

        <Suspense fallback={<div>Loading login form...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
