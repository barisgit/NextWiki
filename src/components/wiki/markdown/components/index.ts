import { codeComponent } from "./CodeComponent";
import { listItemComponent } from "./ListItemComponent";
import { listComponent } from "./ListComponent";
import type { Components } from "react-markdown";

// Combine all custom components
export const markdownComponents: Components = {
  code: codeComponent,
  ul: listComponent,
  li: listItemComponent,
};
