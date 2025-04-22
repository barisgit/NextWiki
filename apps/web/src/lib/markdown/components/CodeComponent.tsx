import { cn } from "~/lib/utils";
import type { Components } from "react-markdown";

export const codeComponent: Components["code"] = ({
  className,
  children,
  ...props
}) => {
  // Check if it's an inline code block by looking at the props
  const isInlineCodeBlock =
    !className?.includes("language-") &&
    props.node?.children?.length === 1 &&
    !children?.toString().includes("\n");

  if (!isInlineCodeBlock) {
    // For code blocks (not inline), just return as is
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  // For inline code, remove backticks
  return (
    <span
      className={cn(
        className,
        "text-markdown-inlinecodetext bg-markdown-inlinecodebg rounded-md p-1 font-bold"
      )}
      {...props}
    >
      {children}
    </span>
  );
};
