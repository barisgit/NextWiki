import { cn } from "~/lib/utils";
import type { Components } from "react-markdown";
import React from "react";

const addListItemClassToChildren = (children: React.ReactNode) => {
  return React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        className: "list-item",
      } as React.HTMLProps<HTMLElement>);
    }
    return child;
  });
};
export const listComponent: Components["ul"] = ({
  node,
  className,
  children,
  ...props
}) => {
  void node;

  return (
    <ul className={cn(className)} {...props}>
      {addListItemClassToChildren(children)}
    </ul>
  );
};
