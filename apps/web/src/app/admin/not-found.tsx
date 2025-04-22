"use client";

import { Button } from "@repo/ui";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <h1 className="text-4xl font-bold">Admin Page Not Found</h1>
      <Button onClick={() => router.back()}>Go back</Button>
    </div>
  );
}
