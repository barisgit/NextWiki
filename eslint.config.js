// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".vscode/**",
      "node_modules/**",
      "dist/**",
      ".turbo/**",
      "apps/web/.next/**",
      "apps/web/drizzle/**",
      "packages/ui/dist/**",
      "coverage/**",
      "temp/**",
      // Add other files/dirs to ignore as needed
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended
);
