import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "../ui/button";
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
      <ArrowLeftIcon className="w-4 h-4 mr-2" />
      Go back
    </Button>
  );
}
