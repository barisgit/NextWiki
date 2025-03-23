import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "border border-border text-text-primary",
        success: "bg-success text-success-foreground hover:bg-success/80",
        warning: "bg-warning text-warning-foreground hover:bg-warning/80",
        info: "bg-info text-info-foreground hover:bg-info/80",
        accent: "bg-accent text-accent-foreground hover:bg-accent/80",
        neutral: "bg-neutral-200 dark:bg-neutral-700 text-text-primary",
        ghost:
          "bg-background-level1 text-text-secondary hover:bg-background-level2 hover:text-text-primary",
        soft: "",
      },
      size: {
        default: "h-6 px-2.5 py-0.5 rounded-md",
        sm: "h-5 px-2 py-0 text-[10px] rounded",
        lg: "h-7 px-3 py-1 rounded-md",
        pill: "h-6 px-3 py-0.5 rounded-full",
      },
      softColor: {
        default: "",
        primary:
          "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/30",
        secondary:
          "bg-secondary-50 dark:bg-secondary-900/20 text-secondary-600 dark:text-secondary-400 border border-secondary-100 dark:border-secondary-800/30",
        destructive:
          "bg-destructive-50 dark:bg-destructive-900/20 text-destructive-600 dark:text-destructive-400 border border-destructive-100 dark:border-destructive-800/30",
        success:
          "bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400 border border-success-100 dark:border-success-800/30",
        warning:
          "bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400 border border-warning-100 dark:border-warning-800/30",
        info: "bg-info-50 dark:bg-info-900/20 text-info-600 dark:text-info-400 border border-info-100 dark:border-info-800/30",
        accent:
          "bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 border border-accent-100 dark:border-accent-800/30",
        neutral:
          "bg-neutral-50 dark:bg-neutral-800/30 text-neutral-600 dark:text-neutral-300 border border-neutral-100 dark:border-neutral-700/30",
      },
    },
    compoundVariants: [
      {
        variant: "soft",
        softColor: "primary",
        className:
          "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/30",
      },
      {
        variant: "soft",
        softColor: "secondary",
        className:
          "bg-secondary-50 dark:bg-secondary-900/20 text-secondary-600 dark:text-secondary-400 border border-secondary-100 dark:border-secondary-800/30",
      },
      {
        variant: "soft",
        softColor: "destructive",
        className:
          "bg-destructive-50 dark:bg-destructive-900/20 text-destructive-600 dark:text-destructive-400 border border-destructive-100 dark:border-destructive-800/30",
      },
      {
        variant: "soft",
        softColor: "success",
        className:
          "bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400 border border-success-100 dark:border-success-800/30",
      },
      {
        variant: "soft",
        softColor: "warning",
        className:
          "bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400 border border-warning-100 dark:border-warning-800/30",
      },
      {
        variant: "soft",
        softColor: "info",
        className:
          "bg-info-50 dark:bg-info-900/20 text-info-600 dark:text-info-400 border border-info-100 dark:border-info-800/30",
      },
      {
        variant: "soft",
        softColor: "accent",
        className:
          "bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 border border-accent-100 dark:border-accent-800/30",
      },
      {
        variant: "soft",
        softColor: "neutral",
        className:
          "bg-neutral-50 dark:bg-neutral-800/30 text-neutral-600 dark:text-neutral-300 border border-neutral-100 dark:border-neutral-700/30",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      softColor: "primary",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}

function Badge({
  className,
  variant,
  size,
  softColor,
  icon,
  removable,
  onRemove,
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size, softColor, className }))}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-1 -mr-1 h-3.5 w-3.5 rounded-full hover:bg-background/80 inline-flex items-center justify-center"
          aria-label="Remove badge"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 4l-8 8m0-8l8 8" />
          </svg>
        </button>
      )}
    </div>
  );
}

export { Badge, badgeVariants };
