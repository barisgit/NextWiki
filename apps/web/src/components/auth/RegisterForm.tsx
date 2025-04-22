"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTRPC } from "~/server/client";
import { signIn } from "next-auth/react";
import { Input } from "@repo/ui";
import { useMutation } from "@tanstack/react-query";
import { logger } from "~/lib/utils/logger";

interface RegisterFormProps {
  isFirstUser: boolean;
}

export function RegisterForm({ isFirstUser }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const trpc = useTRPC();

  useEffect(() => {
    if (isFirstUser && pathname !== "/") {
      try {
        router.replace("/");
      } catch (error) {
        logger.error("Error redirecting to /", error);
      }
    }
  }, [isFirstUser, pathname, router]);

  const registerMutation = useMutation(
    trpc.user.register.mutationOptions({
      onSuccess: async () => {
        try {
          // After successful registration, sign in the user
          const result = await signIn("credentials", {
            email: email,
            password: password,
            redirect: false,
          });

          if (result?.error) {
            // Handle sign in error
            setError(result.error);
            setIsLoading(false);
          } else {
            // Redirect on successful login
            router.push("/");
            router.refresh();
          }
        } catch {
          // Just catch any errors without using the parameter
          setError("Failed to sign in after registration");
          setIsLoading(false);
        }
      },
      onError: (error) => {
        setError(error.message);
        setIsLoading(false);
      },
    })
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Submit to API via tRPC
    registerMutation.mutate({
      name,
      email,
      password,
    });
  };

  return (
    <>
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4 rounded-md shadow-sm">
          <div>
            <label htmlFor="name" className="sr-only">
              Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
              autoComplete="new-password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="sr-only">
              Confirm Password
            </label>
            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading || registerMutation.isPending}
            className="bg-primary hover:bg-primary/90 focus:ring-primary group relative flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading || registerMutation.isPending
              ? "Registering..."
              : "Register"}
          </button>
        </div>
      </form>

      {!isFirstUser && (
        <div className="mt-6 text-center text-sm">
          <p>
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary/90 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      )}
    </>
  );
}
