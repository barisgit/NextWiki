import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils";

// Simple SVG Spinner
const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={cn("animate-spin", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--btn-color)] text-[var(--btn-text)] hover:bg-[var(--btn-hover)] hover:border-[var(--btn-hover)] hover:text-[var(--btn-text-hover)] active:bg-[var(--btn-active)] active:border-[var(--btn-active)] active:text-[var(--btn-text-active)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90 active:opacity-80",
        ghost:
          "hover:text-[var(--btn-color)] active:text-[var(--btn-active)] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none",
        link: "text-text-accent underline-offset-4 hover:underline",
        solid:
          "bg-[var(--btn-color)] text-[var(--btn-text)] border border-[var(--btn-color)] hover:bg-[var(--btn-hover)] hover:border-[var(--btn-hover)] hover:text-[var(--btn-text-hover)] active:bg-[var(--btn-active)] active:border-[var(--btn-active)] active:text-[var(--btn-text-active)]",
        soft: "bg-[color-mix(in_srgb,var(--btn-color)_15%,transparent)] text-[var(--btn-color)] border border-transparent hover:bg-[color-mix(in_srgb,var(--btn-hover)_25%,transparent)] hover:text-[var(--btn-hover)] active:bg-[color-mix(in_srgb,var(--btn-active)_30%,transparent)] active:text-[var(--btn-active)]",
        outlined_simple:
          "border border-border hover:border-[var(--btn-color)] hover:text-[var(--btn-color)] active:saturate-50 disabled:opacity-50",
        outlined:
          "bg-transparent text-[var(--btn-color)] border border-[var(--btn-color)] hover:bg-[color-mix(in_srgb,var(--btn-color)_15%,transparent)] hover:border-[var(--btn-hover)] hover:text-[var(--btn-hover)] active:bg-[color-mix(in_srgb,var(--btn-color)_20%,transparent)] active:border-[var(--btn-active)] active:text-[var(--btn-active)]",
        flat: "bg-[var(--btn-color)] text-[var(--btn-text)] hover:bg-[var(--btn-hover)] hover:text-[var(--btn-text-hover)] active:bg-[var(--btn-active)] active:text-[var(--btn-text-active)] shadow-none border-0",
        text: "bg-transparent text-[var(--btn-color)] hover:bg-[color-mix(in_srgb,var(--btn-color)_10%,transparent)] hover:text-[var(--btn-hover)] active:bg-[color-mix(in_srgb,var(--btn-color)_15%,transparent)] active:text-[var(--btn-active)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-7 px-3 py-1.5 text-xs",
        md: "h-8 px-4 py-2 text-sm",
        lg: "h-11 px-6 py-2.5 text-base",
        xl: "h-12 px-8 py-3 text-lg",
        icon: "h-10 w-10",
        full: "w-full h-10 px-4 py-2",
      },
      rounded: {
        full: "rounded-full",
        lg: "rounded-lg",
        md: "rounded-md",
        sm: "rounded-sm",
        none: "rounded-none",
      },
      color: {
        accent:
          "[--btn-color:var(--color-accent-500)] [--btn-hover:var(--color-accent-600)] [--btn-active:var(--color-accent-700)] [--btn-focus:var(--color-accent-300)] [--btn-text:#ffffff] [--btn-text-hover:#ffffff] [--btn-text-active:#ffffff]",
        primary:
          "[--btn-color:var(--color-primary-500)] [--btn-hover:var(--color-primary-600)] [--btn-active:var(--color-primary-700)] [--btn-focus:var(--color-primary-300)] [--btn-text:#ffffff] [--btn-text-hover:#ffffff] [--btn-text-active:#ffffff]",
        secondary:
          "[--btn-color:var(--color-secondary-500)] [--btn-hover:var(--color-secondary-600)] [--btn-active:var(--color-secondary-700)] [--btn-focus:var(--color-secondary-300)] [--btn-text:#ffffff] [--btn-text-hover:#ffffff] [--btn-text-active:#ffffff]",
        warning:
          "[--btn-color:var(--color-warning-500)] [--btn-hover:var(--color-warning-600)] [--btn-active:var(--color-warning-700)] [--btn-focus:var(--color-warning-300)] [--btn-text:var(--color-warning-50)] [--btn-text-hover:var(--color-warning-50)] [--btn-text-active:var(--color-warning-100)]",
        success:
          "[--btn-color:var(--color-success-500)] [--btn-hover:var(--color-success-600)] [--btn-active:var(--color-success-700)] [--btn-focus:var(--color-success-300)] [--btn-text:var(--color-success-50)] [--btn-text-hover:var(--color-success-50)] [--btn-text-active:var(--color-success-100)]",
        info: "[--btn-color:var(--color-info-500)] [--btn-hover:var(--color-info-600)] [--btn-active:var(--color-info-700)] [--btn-focus:var(--color-info-300)] [--btn-text:var(--color-info-50)] [--btn-text-hover:var(--color-info-50)] [--btn-text-active:var(--color-info-100)]",
        error:
          "[--btn-color:var(--color-error-500)] [--btn-hover:var(--color-error-600)] [--btn-active:var(--color-error-700)] [--btn-focus:var(--color-error-300)] [--btn-text:var(--color-error-50)] [--btn-text-hover:var(--color-error-50)] [--btn-text-active:var(--color-error-100)]",
        danger:
          "[--btn-color:var(--color-error-500)] [--btn-hover:var(--color-error-600)] [--btn-active:var(--color-error-700)] [--btn-focus:var(--color-error-300)] [--btn-text:var(--color-error-50)] [--btn-text-hover:var(--color-error-50)] [--btn-text-active:var(--color-error-100)]",
        neutral:
          "[--btn-color:var(--color-neutral-500)] [--btn-hover:var(--color-neutral-600)] [--btn-active:var(--color-neutral-700)] [--btn-focus:var(--color-neutral-300)] [--btn-text:var(--color-neutral-50)] [--btn-text-hover:var(--color-neutral-50)] [--btn-text-active:var(--color-neutral-100)]",
        complementary:
          "[--btn-color:var(--color-complementary-500)] [--btn-hover:var(--color-complementary-600)] [--btn-active:var(--color-complementary-700)] [--btn-focus:var(--color-complementary-300)] [--btn-text:#ffffff] [--btn-text-hover:#ffffff] [--btn-text-active:#ffffff]",
      },
      elevation: {
        none: "shadow-none",
        sm: "shadow-sm",
        md: "shadow-md",
        lg: "shadow-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      color: "primary",
      rounded: "md",
      elevation: "none",
    },
  }
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    Omit<VariantProps<typeof buttonVariants>, "color"> {
  asChild?: boolean;
  loading?: boolean;
  color?:
    | "info"
    | "error"
    | "success"
    | "secondary"
    | "primary"
    | "warning"
    | "danger"
    | "neutral"
    | "accent"
    | "complementary";
  customColor?: string;
  elevation?: "none" | "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      color,
      customColor,
      asChild = false,
      rounded,
      elevation,
      loading = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const customColorStyle = customColor
      ? ({
          "--btn-color": customColor,
          "--btn-hover": `color-mix(in srgb, ${customColor}, black 10%)`,
          "--btn-active": `color-mix(in srgb, ${customColor}, black 20%)`,
          "--btn-focus": `color-mix(in srgb, ${customColor}, white 40%)`,
          "--btn-text": "#ffffff",
          "--btn-text-hover": "#ffffff",
          "--btn-text-active": "#ffffff",
        } as React.CSSProperties)
      : undefined;

    const spinnerSizeClass =
      size === "sm" ? "h-3 w-3" : size === "icon" ? "h-5 w-5" : "h-4 w-4";

    // If loading, always render a button element with the spinner, ignore asChild and children
    if (loading) {
      return (
        <button
          className={cn(
            buttonVariants({
              variant,
              size,
              rounded,
              color: customColor ? undefined : color,
              elevation,
              className,
            }),
            "relative" // Ensure relative positioning for the spinner container
          )}
          ref={ref}
          style={customColorStyle}
          disabled={true} // Explicitly disabled
          {...props} // Spread other props like aria-label, etc.
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner className={spinnerSizeClass} />
          </div>
          {/* Render original children invisibly to maintain layout spacing if needed, but ensure only one child */}
          <span className="invisible">{props.children}</span>
        </button>
      );
    }

    // Original rendering logic when not loading
    return (
      <Comp
        className={cn(
          buttonVariants({
            variant,
            size,
            rounded,
            color: customColor ? undefined : color,
            elevation,
            className,
          })
        )}
        ref={ref}
        style={customColorStyle}
        disabled={props.disabled} // Use original disabled prop
        {...props}
      >
        {/* Render children directly when not loading */}
        {props.children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
