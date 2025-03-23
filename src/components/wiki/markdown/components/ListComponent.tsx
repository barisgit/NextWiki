import { cn } from "~/lib/utils";

export const listComponent = ({ node, className, children, ...props }) => {
  void node;

  return (
    <ul className={cn(className)} {...props}>
      {children}
    </ul>
  );
};
