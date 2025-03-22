import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--btn-color)] text-[var(--btn-text)] hover:bg-[var(--btn-hover)] hover:border-[var(--btn-hover)] hover:text-[var(--btn-text-hover)] active:bg-[var(--btn-active)] active:border-[var(--btn-active)] active:text-[var(--btn-text-active)]",
        destructive:
          "bg-error text-error-foreground hover:opacity-80 active:saturate-50",
        ghost:
          "hover:text-[var(--btn-color)] active:text-[var(--btn-active)] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none",
        link: "text-primary underline-offset-4 hover:underline",
        solid:
          "bg-[var(--btn-color)] text-[var(--btn-text)] border border-[var(--btn-color)] hover:bg-[var(--btn-hover)] hover:border-[var(--btn-hover)] hover:text-[var(--btn-text-hover)] active:bg-[var(--btn-active)] active:border-[var(--btn-active)] active:text-[var(--btn-text-active)]",
        soft: "bg-[color-mix(in_srgb,var(--btn-color)_15%,transparent)] text-[var(--btn-color)] border border-transparent hover:bg-[color-mix(in_srgb,var(--btn-hover)_25%,transparent)] hover:text-[var(--btn-hover)] active:bg-[color-mix(in_srgb,var(--btn-active)_30%,transparent)] active:text-[var(--btn-active)]",
        outlined_simple:
          "border border-border-default hover:border-[var(--btn-color)] hover:text-[var(--btn-color)] active:saturate-50 disabled:opacity-50",
        outlined:
          "bg-transparent text-[var(--btn-color)] border border-[var(--btn-color)] hover:bg-[color-mix(in_srgb,var(--btn-color)_15%,transparent)] hover:border-[var(--btn-hover)] hover:text-[var(--btn-hover)] active:bg-[color-mix(in_srgb,var(--btn-color)_20%,transparent)] active:border-[var(--btn-active)] active:text-[var(--btn-active)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
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
          "[--btn-color:var(--color-border-accent)] [--btn-hover:var(--color-border-accent)] [--btn-active:var(--color-border-accent)] [--btn-focus:var(--color-border-accent)] [--btn-text:var(--color-text-accent)] [--btn-text-hover:var(--color-text-accent)] [--btn-text-active:var(--color-text-accent)]",
        primary:
          "[--btn-color:var(--color-primary-500)] [--btn-hover:var(--color-primary-600)] [--btn-active:var(--color-primary-700)] [--btn-focus:var(--color-primary-300)] [--btn-text:#ffffff] [--btn-text-hover:#ffffff] [--btn-text-active:#ffffff]",
        secondary:
          "[--btn-color:var(--color-secondary-500)] [--btn-hover:var(--color-secondary-600)] [--btn-active:var(--color-secondary-700)] [--btn-focus:var(--color-secondary-300)] [--btn-text:#ffffff] [--btn-text-hover:#ffffff] [--btn-text-active:#ffffff]",
        tertiary:
          "[--btn-color:var(--color-tertiary-500)] [--btn-hover:var(--color-tertiary-600)] [--btn-active:var(--color-tertiary-700)] [--btn-focus:var(--color-tertiary-300)] [--btn-text:#ffffff] [--btn-text-hover:#ffffff] [--btn-text-active:#ffffff]",
        quaternary:
          "[--btn-color:var(--color-quaternary-500)] [--btn-hover:var(--color-quaternary-600)] [--btn-active:var(--color-quaternary-700)] [--btn-focus:var(--color-quaternary-300)] [--btn-text:#ffffff] [--btn-text-hover:#ffffff] [--btn-text-active:#ffffff]",
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
        custom: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      color: "primary",
      rounded: "lg",
    },
  },
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    Omit<VariantProps<typeof buttonVariants>, "color"> {
  asChild?: boolean;
  color?:
    | "info"
    | "error"
    | "success"
    | "secondary"
    | "primary"
    | "tertiary"
    | "quaternary"
    | "warning"
    | "danger"
    | "neutral"
    | "accent"
    | "custom";
  customColor?: string;
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
      ...props
    },
    ref,
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

    return (
      <Comp
        className={cn(
          buttonVariants({
            variant,
            size,
            rounded,
            color: customColor ? "custom" : color,
            className,
          }),
        )}
        ref={ref}
        style={customColorStyle}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
