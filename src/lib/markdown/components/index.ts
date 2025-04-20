/**
 * Re-exports all custom React components for markdown rendering
 */

import { codeComponent } from "./CodeComponent";
import { listItemComponent } from "./ListItemComponent";
import { listComponent } from "./ListComponent";
import { linkComponent } from "./LinkComponent";
import type { Components } from "react-markdown";

/**
 * Collection of all custom components for client-side markdown rendering
 */
export const markdownComponents: Components = {
  code: codeComponent,
  ul: listComponent,
  li: listItemComponent,
  a: linkComponent,
};
