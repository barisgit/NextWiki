"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { RegisterForm } from "~/components/auth/RegisterForm";
import { usePermissions } from "~/components/auth/permission/client";
import { Button } from "@repo/ui";

export default function RegisterClientPage({
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
    <>
      <RegisterForm isFirstUser={isFirstUser} />

      <Button
        className="fixed bottom-16 left-16 rounded-full"
        variant="outlined"
        onClick={() => router.push("/")}
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to home
      </Button>
    </>
  );
}
