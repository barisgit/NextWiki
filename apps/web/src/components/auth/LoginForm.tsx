"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Alert, AlertDescription } from "@repo/ui";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { useSetting } from "~/lib/hooks/use-settings";

// Create a separate component to read searchParams to work with Suspense
function RegistrationSuccessMessage() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";

  if (!justRegistered) {
    return null;
  }

  return (
    <Alert variant="success" className="mb-4">
      <AlertDescription>
        Registration successful! Please sign in with your new account.
      </AlertDescription>
    </Alert>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { value: allowRegistration } = useSetting("auth.allowRegistration");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        // Redirect to home page
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An error occurred during login");
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Wrap the message component in Suspense */}
      <Suspense fallback={<div>Loading message...</div>}>
        <RegistrationSuccessMessage />
      </Suspense>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4 rounded-md shadow-sm">
          <div>
            <label htmlFor="email-address" className="sr-only">
              Email address
            </label>
            <Input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            size="default"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm">
          <Link
            href="/forgot-password"
            className="text-primary hover:text-primary/90 font-medium"
          >
            Forgot your password?
          </Link>
        </div>
        {allowRegistration && (
          <div className="text-sm">
            <Link
              href="/register"
              className="text-primary hover:text-primary/90 font-medium"
            >
              Create an account
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="border-border-default w-full border-t" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="text-text-secondary bg-background-paper px-2">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            onClick={() => signIn("github", { callbackUrl: "/" })}
            variant="outlined"
            color="neutral"
          >
            GitHub
          </Button>
          <Button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            variant="outlined"
            color="neutral"
          >
            Google
          </Button>
        </div>
      </div>
    </>
  );
}
