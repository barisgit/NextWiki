---
path: advanced-topics/customization-guide
title: Customization Guide
author: NextWiki Team
createdAt: 2024-01-01T00:00:00.000Z
updated: 2024-01-01T00:00:00.000Z
tags: [advanced, customization, guide, theme, development]
---

# Customization Guide

This page outlines potential ways to customize your NextWiki installation.

## Theming

NextWiki uses Tailwind CSS for styling and Shadcn UI for its component library. Customization can be achieved by:

1.  **Modifying Tailwind Configuration**: Adjusting `tailwind.config.js` to change colors, fonts, spacing, etc.
2.  **Overriding CSS Variables**: Shadcn UI components use CSS variables for theming. These can be overridden in your global CSS file.
3.  **Custom Components**: Building your own React components to replace or supplement existing ones.

*(Detailed instructions and examples would be provided here in a full guide)*

## Extending Functionality

As an open-source project, you can directly modify the codebase:

-   **Adding tRPC Procedures**: Extend the API by adding new procedures in the backend routers.
-   **Creating New React Components**: Develop new UI elements or features.
-   **Integrating External Libraries**: Incorporate other JavaScript libraries or services.

**Note:** Customizing the core code requires familiarity with the tech stack (Next.js, React, tRPC, Drizzle) and may make updating NextWiki more complex. 