import { cn } from "~/lib/utils";
import type { Components } from "react-markdown";

export const listItemComponent: Components["li"] = ({
  node,
  className,
  children,
  ...props
}) => {
  void node;

  return (
    <li className={cn(className)} {...props}>
      {children}
    </li>
  );
};
