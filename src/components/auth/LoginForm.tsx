"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if user just registered, wrap in suspense boundary
  const justRegistered = searchParams.get("registered") === "true";

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
      {justRegistered && (
        <div className="p-4 mb-4 text-sm text-green-600 rounded-md bg-green-50">
          Registration successful! Please sign in with your new account.
        </div>
      )}

      {error && (
        <div className="p-4 text-sm text-red-500 rounded-md bg-red-50">
          {error}
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4 rounded-md shadow-sm">
          <div>
            <label htmlFor="email-address" className="sr-only">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md group bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between mt-6">
        <div className="text-sm">
          <Link
            href="/forgot-password"
            className="font-medium text-primary hover:text-primary/90"
          >
            Forgot your password?
          </Link>
        </div>
        <div className="text-sm">
          <Link
            href="/register"
            className="font-medium text-primary hover:text-primary/90"
          >
            Create an account
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={() => signIn("github", { callbackUrl: "/" })}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            GitHub
          </button>
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Google
          </button>
        </div>
      </div>
    </>
  );
}
