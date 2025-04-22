import * as React from "react";
import { cn } from "../utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "elevated" | "outlined" | "flat";
    color?: "default" | "primary" | "secondary" | "accent" | "neutral";
    hover?: boolean;
  }
>(
  (
    {
      className,
      variant = "default",
      color = "default",
      hover = false,
      ...props
    },
    ref
  ) => {
    const baseStyles = "rounded-lg transition-all duration-200";

    const variantStyles = {
      default: "bg-card shadow-sm border border-border/40",
      elevated: "bg-card shadow-md border border-border/30",
      outlined: "bg-transparent border border-border",
      flat: "bg-card-muted",
    };

    const colorStyles = {
      default: "",
      primary:
        variant === "outlined"
          ? "border-primary/40 text-primary"
          : "bg-primary-50/50 dark:bg-primary-900/20 border-primary/20",
      secondary:
        variant === "outlined"
          ? "border-secondary/40 text-secondary"
          : "bg-secondary-50/50 dark:bg-secondary-900/20 border-secondary/20",
      accent:
        variant === "outlined"
          ? "border-accent/40 text-accent"
          : "bg-accent-50/50 dark:bg-accent-900/20 border-accent/20",
      neutral:
        variant === "outlined"
          ? "border-neutral/40 text-neutral"
          : "bg-neutral-100 dark:bg-neutral-800/40 border-neutral/20",
    };

    const hoverStyles = hover
      ? "hover:shadow-md hover:border-opacity-50 hover:scale-[1.01]"
      : "";

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          colorStyles[color],
          hoverStyles,
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold text-text-primary", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
