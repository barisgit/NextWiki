import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--badge-color)] text-[var(--badge-text)] border-[var(--badge-color)] hover:bg-[var(--badge-hover)] hover:border-[var(--badge-hover)]",
        secondary:
          "bg-[color-mix(in_srgb,var(--badge-color)_15%,transparent)] text-[var(--badge-color)] border-transparent hover:bg-[color-mix(in_srgb,var(--badge-hover)_25%,transparent)] hover:text-[var(--badge-hover)]",
        destructive: "bg-error text-error-foreground hover:opacity-90",
        outline:
          "text-[var(--badge-color)] border-[var(--badge-color)] bg-transparent hover:bg-[color-mix(in_srgb,var(--badge-color)_15%,transparent)]",
        success:
          "bg-[var(--badge-color)] text-[var(--badge-text)] border-[var(--badge-color)] hover:opacity-90",
      },
      color: {
        primary:
          "[--badge-color:var(--color-primary-500)] [--badge-hover:var(--color-primary-600)] [--badge-text:#ffffff]",
        secondary:
          "[--badge-color:var(--color-secondary-500)] [--badge-hover:var(--color-secondary-600)] [--badge-text:#ffffff]",
        tertiary:
          "[--badge-color:var(--color-tertiary-500)] [--badge-hover:var(--color-tertiary-600)] [--badge-text:#ffffff]",
        quaternary:
          "[--badge-color:var(--color-quaternary-500)] [--badge-hover:var(--color-quaternary-600)] [--badge-text:#ffffff]",
        warning:
          "[--badge-color:var(--color-warning-500)] [--badge-hover:var(--color-warning-600)] [--badge-text:var(--color-warning-50)]",
        success:
          "[--badge-color:var(--color-success-500)] [--badge-hover:var(--color-success-600)] [--badge-text:var(--color-success-50)]",
        info: "[--badge-color:var(--color-info-500)] [--badge-hover:var(--color-info-600)] [--badge-text:var(--color-info-50)]",
        error:
          "[--badge-color:var(--color-error-500)] [--badge-hover:var(--color-error-600)] [--badge-text:var(--color-error-50)]",
        neutral:
          "[--badge-color:var(--color-neutral-500)] [--badge-hover:var(--color-neutral-600)] [--badge-text:var(--color-neutral-50)]",
        accent:
          "[--badge-color:var(--color-accent-500)] [--badge-hover:var(--color-accent-600)] [--badge-text:var(--color-accent-50)]",
      },
    },
    defaultVariants: {
      variant: "default",
      color: "secondary",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  color?:
    | "info"
    | "error"
    | "success"
    | "secondary"
    | "primary"
    | "tertiary"
    | "quaternary"
    | "warning"
    | "neutral"
    | "accent"
    | undefined;
}

function Badge({ className, variant, color, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, color, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
