import { cn } from "~/lib/utils";
import type { Components } from "react-markdown";
import React from "react";

export const linkComponent: Components["a"] = ({
  node,
  className,
  children,
  ...props
}) => {
  void node;

  return (
    <a href={props.href ?? ""} className={cn(className)} {...props}>
      {children}
    </a>
  );
};
