import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@repo/ui";
import { useRouter } from "next/navigation";
import { cn } from "~/lib/utils";

interface BackButtonProps {
  className?: string;
  variant?: "default" | "outlined";
}

export function BackButton({
  className,
  variant = "default",
}: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.back()}
      variant={variant}
      className={cn("mt-4 rounded-full", className)}
    >
      <ArrowLeftIcon className="mr-2 h-4 w-4" />
      Go back
    </Button>
  );
}
