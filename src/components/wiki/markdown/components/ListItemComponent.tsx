import { cn } from "~/lib/utils";

export const listItemComponent = ({ node, className, children, ...props }) => {
  // Check if parent is a links-list
  const parentIsList =
    node.parent?.properties?.className?.includes("links-list");

  return (
    <li
      className={cn(
        className,
        parentIsList && "links-list-item",
        "group" // Add group class for nested styling
      )}
      {...props}
    >
      {children}
    </li>
  );
};
