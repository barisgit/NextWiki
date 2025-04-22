import * as React from "react";
import { cn } from "../utils";
import Image from "next/image";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
  status?: "online" | "away" | "busy" | "offline" | "invisible";
  statusPosition?: "top-right" | "bottom-right" | "bottom-left" | "top-left";
  bordered?: boolean;
  borderColor?: string;
  shape?: "circle" | "square" | "rounded";
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      size = "md",
      src,
      alt = "",
      fallback,
      status,
      statusPosition = "bottom-right",
      bordered = false,
      borderColor,
      shape = "circle",
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState<boolean>(false);

    const sizeClasses = {
      xs: "h-6 w-6 text-xs",
      sm: "h-8 w-8 text-sm",
      md: "h-10 w-10 text-base",
      lg: "h-12 w-12 text-lg",
      xl: "h-16 w-16 text-xl",
    };

    const shapeClasses = {
      circle: "rounded-full",
      square: "rounded-none",
      rounded: "rounded-lg",
    };

    const statusClasses = {
      online: "bg-success",
      away: "bg-warning",
      busy: "bg-destructive",
      offline: "bg-neutral-400",
      invisible: "bg-neutral-300",
    };

    const statusPositionClasses = {
      "top-right": "-top-0.5 -right-0.5",
      "bottom-right": "-bottom-0.5 -right-0.5",
      "bottom-left": "-bottom-0.5 -left-0.5",
      "top-left": "-top-0.5 -left-0.5",
    };

    const borderClasses = bordered
      ? `ring-2 ${
          borderColor
            ? borderColor
            : "ring-background dark:ring-background-dark"
        }`
      : "";

    const statusSizeMap = {
      xs: "h-1.5 w-1.5",
      sm: "h-2 w-2",
      md: "h-2.5 w-2.5",
      lg: "h-3 w-3",
      xl: "h-3.5 w-3.5",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex shrink-0 overflow-hidden",
          sizeClasses[size],
          shapeClasses[shape],
          borderClasses,
          className
        )}
        {...props}
      >
        {!imageError && src ? (
          <Image
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            className={cn("h-full w-full object-cover", shapeClasses[shape])}
          />
        ) : (
          <div
            className={cn(
              "bg-background-level2 dark:bg-background-level3 text-text-secondary flex h-full w-full items-center justify-center",
              shapeClasses[shape]
            )}
          >
            {fallback || (
              <span className="font-medium uppercase">
                {alt ? alt.slice(0, 2) : "?"}
              </span>
            )}
          </div>
        )}

        {status && (
          <span
            className={cn(
              "ring-background dark:ring-background-dark absolute block rounded-full ring-2",
              statusClasses[status],
              statusPositionClasses[statusPosition],
              statusSizeMap[size]
            )}
          />
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

const AvatarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    max?: number;
    spacing?: "tight" | "default" | "loose";
    size?: AvatarProps["size"];
    shape?: AvatarProps["shape"];
    bordered?: boolean;
    children: React.ReactNode;
  }
>(
  (
    {
      className,
      max,
      spacing = "default",
      children,
      size = "md",
      shape = "circle",
      bordered = true,
      ...props
    },
    ref
  ) => {
    const childrenArray = React.Children.toArray(children);
    const totalAvatars = childrenArray.length;
    const displayAvatars = max ? childrenArray.slice(0, max) : childrenArray;
    const hiddenAvatars = max ? Math.max(0, totalAvatars - max) : 0;

    const spacingClasses = {
      tight: "-space-x-2",
      default: "-space-x-3",
      loose: "-space-x-1.5",
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center", spacingClasses[spacing], className)}
        {...props}
      >
        {displayAvatars.map((child, index) => {
          if (React.isValidElement<AvatarProps>(child)) {
            return React.cloneElement(child, {
              key: index,
              size,
              shape,
              bordered,
              className: cn(
                "relative inline-block border-2 border-background dark:border-background-dark",
                child.props.className
              ),
            });
          }
          return child;
        })}

        {hiddenAvatars > 0 && (
          <Avatar
            size={size}
            shape={shape}
            bordered={bordered}
            className={cn(
              "border-background dark:border-background-dark bg-background-level2 relative inline-block border-2"
            )}
            fallback={
              <span className="text-text-secondary font-medium">
                +{hiddenAvatars}
              </span>
            }
          />
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = "AvatarGroup";

export { Avatar, AvatarGroup };
