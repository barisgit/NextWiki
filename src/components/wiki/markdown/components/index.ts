import { codeComponent } from "./CodeComponent";
import { listItemComponent } from "./ListItemComponent";
import { listComponent } from "./ListComponent";

// Combine all custom components
export const markdownComponents = {
  code: codeComponent,
  ul: listComponent,
  li: listItemComponent,
};
