import { cn } from "~/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text" | "rectangular";
  animation?: "pulse" | "wave" | "none";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "default",
  animation = "pulse",
  width,
  height,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    default: "rounded-md",
    circular: "rounded-full",
    text: "rounded h-4 w-3/4",
    rectangular: "rounded-none",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer",
    none: "",
  };

  const styles: React.CSSProperties = {
    ...(width && { width: typeof width === "number" ? `${width}px` : width }),
    ...(height && {
      height: typeof height === "number" ? `${height}px` : height,
    }),
  };

  return (
    <div
      className={cn(
        "bg-background-level2 dark:bg-background-level3",
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={styles}
      {...props}
    />
  );
}

export function SkeletonText({
  className,
  lines = 1,
  lastLineWidth = "100%",
  ...props
}: {
  className?: string;
  lines?: number;
  lastLineWidth?: string | number;
} & Omit<SkeletonProps, "variant">) {
  return (
    <div className="flex flex-col space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(
            className,
            i === lines - 1 && typeof lastLineWidth === "number"
              ? { width: `${lastLineWidth}px` }
              : { width: lastLineWidth }
          )}
          {...props}
        />
      ))}
    </div>
  );
}

// Add the shimmer animation to the tailwind config
// Will need to be added to the tailwind.config.js:
// keyframes: {
//   shimmer: {
//     '0%': { backgroundPosition: '-200% 0' },
//     '100%': { backgroundPosition: '200% 0' },
//   },
// },
// animation: {
//   shimmer: 'shimmer 1.5s ease-in-out infinite',
// },
