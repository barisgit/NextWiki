"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "~/lib/utils";

export interface CheckboxProps
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
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      description,
      color = "primary",
      size = "md",
      variant = "default",
      indeterminate,
      ...props
    },
    ref
  ) => {
    const id = React.useId();
    const inputId = props.id || id;
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isChecked, setIsChecked] = React.useState<boolean>(!!props.checked);

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = !!indeterminate;
      }
    }, [indeterminate]);

    React.useEffect(() => {
      setIsChecked(!!props.checked);
    }, [props.checked]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsChecked(e.target.checked);
      if (props.onChange) {
        props.onChange(e);
      }
    };

    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    const iconSizeClasses = {
      sm: "h-3 w-3",
      md: "h-3.5 w-3.5",
      lg: "h-4 w-4",
    };

    const colorClasses = {
      primary:
        "text-primary-500 border-primary-300 hover:border-primary-400 focus:ring-primary-500 checked:bg-primary-500 checked:border-primary-500",
      secondary:
        "text-secondary-500 border-secondary-300 hover:border-secondary-400 focus:ring-secondary-500 checked:bg-secondary-500 checked:border-secondary-500",
      accent:
        "text-accent-500 border-accent-300 hover:border-accent-400 focus:ring-accent-500 checked:bg-accent-500 checked:border-accent-500",
      error:
        "text-error-500 border-error-300 hover:border-error-400 focus:ring-error-500 checked:bg-error-500 checked:border-error-500",
      success:
        "text-success-500 border-success-300 hover:border-success-400 focus:ring-success-500 checked:bg-success-500 checked:border-success-500",
      info: "text-info-500 border-info-300 hover:border-info-400 focus:ring-info-500 checked:bg-info-500 checked:border-info-500",
      warning:
        "text-warning-500 border-warning-300 hover:border-warning-400 focus:ring-warning-500 checked:bg-warning-500 checked:border-warning-500",
      neutral:
        "text-neutral-500 border-neutral-300 hover:border-neutral-400 focus:ring-neutral-500 checked:bg-neutral-500 checked:border-neutral-500",
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
            type="checkbox"
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            onChange={handleChange}
            className={cn(
              "appearance-none cursor-pointer",
              "focus:ring-2 focus:ring-offset-1 focus:outline-none focus:ring-opacity-50",
              "transition-colors duration-200",
              "rounded-md border-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              sizeClasses[size],
              colorClasses[color],
              variantClasses[variant],
              className
            )}
            {...props}
          />
          {/* Custom check icon */}
          {(isChecked || indeterminate) && (
            <Check
              className={cn(
                "absolute pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white",
                iconSizeClasses[size]
              )}
            />
          )}
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

Checkbox.displayName = "Checkbox";

export { Checkbox };
