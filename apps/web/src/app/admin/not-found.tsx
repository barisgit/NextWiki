"use client";

import { Button } from "@repo/ui";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Admin Page Not Found</h1>
      <Button variant="outlined" onClick={() => router.back()}>
        Go back
      </Button>
    </div>
  );
}
