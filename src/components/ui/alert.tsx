import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";
import { X, AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";

// FIXME: This alret is weird

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-text-primary",
  {
    variants: {
      variant: {
        default: "border-border text-text-primary bg-background",
        success:
          "border-success/20 bg-success-50/50 dark:bg-success-900/20 text-success-600 dark:text-success-400 [&>svg]:text-success",
        info: "border-info/20 bg-info-50/50 dark:bg-info-900/20 text-info-600 dark:text-info-400 [&>svg]:text-info",
        warning:
          "border-warning/20 bg-warning-50/50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400 [&>svg]:text-warning",
        error:
          "border-error/20 bg-error-50/50 dark:bg-error-900/20 text-error-600 dark:text-error-400 [&>svg]:text-error",
        destructive:
          "border-destructive/20 bg-destructive-50/50 dark:bg-destructive-900/20 text-destructive-600 dark:text-destructive-400 [&>svg]:text-destructive",
      },
      size: {
        default: "text-sm",
        sm: "text-xs p-3",
        lg: "text-base p-5",
      },
      flat: {
        true: "border-0 shadow-none",
        false: "",
      },
      dismissable: {
        true: "pr-10",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      flat: false,
      dismissable: false,
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.ReactNode;
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      flat = false,
      dismissable = false,
      icon,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    const IconComponent = React.useMemo(() => {
      if (icon) return icon;

      switch (variant) {
        case "success":
          return <CheckCircle className="w-4 h-4" />;
        case "info":
          return <Info className="w-4 h-4" />;
        case "warning":
          return <AlertTriangle className="w-4 h-4" />;
        case "error":
        case "destructive":
          return <AlertCircle className="w-4 h-4" />;
        default:
          return null;
      }
    }, [icon, variant]);

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          alertVariants({ variant, size, flat, dismissable, className })
        )}
        {...props}
      >
        {IconComponent}

        <div className="flex-1">{children}</div>

        {dismissable && onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute inline-flex items-center justify-center w-6 h-6 rounded-full right-3 top-3 hover:bg-background-level2"
            aria-label="Dismiss alert"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
