import { ReactNode } from "react";
import { cn } from "~/lib/utils";

interface MarkdownProseProps {
  children: ReactNode;
  className?: string;
}

/**
 * MarkdownProse component that provides consistent styling for markdown content
 * throughout the application.
 */
export function MarkdownProse({
  children,
  className = "",
}: MarkdownProseProps) {
  return (
    <div
      className={cn(
        // Base prose styling
        "prose max-w-none dark:prose-invert",

        // Heading styles - using theme variables and more specific selectors
        "prose-h1:!text-markdown-h1 prose-h1:!font-bold prose-h1:!text-2xl prose-h1:!mt-spacing-lg prose-h1:!mb-spacing-md",
        "prose-h2:!text-markdown-h2 prose-h2:!font-semibold prose-h2:!text-xl prose-h2:!mt-spacing-md prose-h2:!mb-spacing-sm",
        "prose-h3:!text-markdown-h3 prose-h3:!font-medium prose-h3:!text-lg prose-h3:!mt-spacing-md prose-h3:!mb-spacing-xs",
        "prose-h4:!text-markdown-h4 prose-h4:!font-medium prose-h4:!mt-spacing-md prose-h4:!mb-spacing-xs",

        // Paragraph styling
        "prose-p:text-markdown-text prose-p:leading-normal",

        // Link styling
        "prose-a:text-markdown-link prose-a:no-underline hover:prose-a:underline",

        // List styling - compact and properly spaced using theme variables
        "prose-ul:!my-0 prose-ol:!my-0",
        "prose-ul:!space-y-0 prose-ol:!space-y-0 prose-ul:!py-0 prose-ol:!py-0",
        "prose-li:marker:text-markdown-listMarker",
        "prose-li:!my-0",
        "[&_ul]:!mt-0 [&_ul]:!mb-0",
        "[&_li]:!my-0",

        // Nested list styling
        "[&_.prose-li_>_ul]:mt-spacing-xs [&_.prose-li_>_ul]:mb-0",
        "[&_.prose-li_>_ol]:mt-spacing-xs [&_.prose-li_>_ol]:mb-0",
        "[&_.prose-li_p]:my-0",

        // Code and pre styling
        "prose-code:text-markdown-inlinecodetext prose-code:bg-markdown-inlinecodebg prose-code:px-spacing-xs prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
        "prose-pre:bg-markdown-codebg prose-pre:rounded-md prose-pre:p-spacing-sm prose-pre:my-spacing-md",
        "[&_pre_code]:text-markdown-codetext [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:m-0",
        "[&_pre]:!overflow-x-auto",

        // Blockquote styling
        "prose-blockquote:text-markdown-blockquote prose-blockquote:border-l-4 prose-blockquote:border-primary-300 prose-blockquote:pl-spacing-sm dark:prose-blockquote:border-primary-600",

        // Add any custom className passed as prop
        className
      )}
    >
      {children}
    </div>
  );
}
