"use client";

import * as React from "react";
import { cn } from "../utils";

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "color"> {
  label?: string;
  description?: string;
  color?:
    | "primary"
    | "secondary"
    | "accent"
    | "error"
    | "success"
    | "info"
    | "warning"
    | "neutral";
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline";
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      className,
      label,
      description,
      color = "primary",
      size = "md",
      variant = "default",
      ...props
    },
    ref
  ) => {
    const id = React.useId();
    const inputId = props.id || id;

    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    const dotSizeClasses = {
      sm: "h-1.5 w-1.5",
      md: "h-2 w-2",
      lg: "h-2.5 w-2.5",
    };

    const colorClasses = {
      primary:
        "text-primary-500 border-primary-200 hover:border-primary-300 focus:ring-primary-500 checked:border-primary-500 checked:bg-primary-500/50 dark:checked:bg-primary-950",
      secondary:
        "text-secondary-500 border-secondary-200 hover:border-secondary-300 focus:ring-secondary-500 checked:border-secondary-500 checked:bg-secondary-500/50 dark:checked:bg-secondary-950",
      accent:
        "text-accent-500 border-accent-200 hover:border-accent-300 focus:ring-accent-500 checked:border-accent-500 checked:bg-accent-500/50 dark:checked:bg-accent-950",
      error:
        "text-error-500 border-error-200 hover:border-error-300 focus:ring-error-500 checked:border-error-500 checked:bg-error-500/50 dark:checked:bg-error-950",
      success:
        "text-success-500 border-success-200 hover:border-success-300 focus:ring-success-500 checked:border-success-500 checked:bg-success-500/50 dark:checked:bg-success-950",
      info: "text-info-500 border-info-200 hover:border-info-300 focus:ring-info-500 checked:border-info-500 checked:bg-info-500/50 dark:checked:bg-info-950",
      warning:
        "text-warning-500 border-warning-200 hover:border-warning-300 focus:ring-warning-500 checked:border-warning-500 checked:bg-warning-500/50 dark:checked:bg-warning-950",
      neutral:
        "text-neutral-500 border-neutral-200 hover:border-neutral-300 focus:ring-neutral-500 checked:border-neutral-500 checked:bg-neutral-500/50 dark:checked:bg-neutral-950",
    };

    const variantClasses = {
      default: "border-2",
      outline: "border-2 bg-background-paper",
    };

    return (
      <div className="flex items-start">
        <div className="relative flex items-center h-5">
          <input
            id={inputId}
            type="radio"
            ref={ref}
            className={cn(
              "appearance-none cursor-pointer",
              "focus:ring-2 focus:ring-offset-2 focus:outline-none focus:ring-opacity-50",
              "transition-all duration-200",
              "rounded-full border-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              sizeClasses[size],
              colorClasses[color],
              variantClasses[variant],
              className
            )}
            {...props}
          />
          {/* Custom radio inner circle */}
          <div
            className={cn(
              "absolute pointer-events-none rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform scale-0",
              dotSizeClasses[size],
              `bg-${color}-500`,
              props.checked && "scale-100"
            )}
          />
        </div>
        {(label || description) && (
          <div className="ml-3 text-sm">
            {label && (
              <label
                htmlFor={inputId}
                className="font-medium cursor-pointer text-text-primary"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-text-secondary">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = "Radio";

export interface RadioGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: "horizontal" | "vertical";
  onChange?: (value: string) => void;
  value?: string;
  name?: string;
}

const RadioGroup = ({
  children,
  className,
  orientation = "vertical",
  onChange,
  value,
  name,
}: RadioGroupProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  // Clone children to add name and checked props
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement<RadioProps>(child)) {
      return React.cloneElement(child, {
        name,
        onChange: handleChange,
        checked: child.props.value === value,
      });
    }
    return child;
  });

  return (
    <div
      className={cn(
        "flex",
        orientation === "horizontal"
          ? "flex-row space-x-6"
          : "flex-col space-y-3",
        className
      )}
    >
      {enhancedChildren}
    </div>
  );
};

export { Radio, RadioGroup };
