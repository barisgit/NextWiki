---
path: features/search-demo/exact-match-page
title: Exact Match Search Demo
author: NextWiki Team
createdAt: 2024-01-01T00:00:00.000Z
updated: 2024-01-01T00:00:00.000Z
tags: [feature, search, demo, exact match, test]
---

# Exact Match Search Demo

This page contains specific keywords designed to test the exact match functionality of the NextWiki search feature.

Try searching for the following terms:

-   `Next.js 15`
-   `Drizzle ORM`
-   `tRPC`
-   `PostgreSQL`
-   `syntax highlighting`
-   `authentication`
-   `trigram similarity`

## Technical Details

NextWiki leverages `PostgreSQL`'s full-text search capabilities, including `tsvector` and `tsquery`. This allows for efficient indexing and searching of page content.

For exact matches, the system prioritizes results where the search query precisely matches terms found in the page titles or content. This often involves direct string comparison or matching against the generated `tsvector`.

We also use `Drizzle ORM` to interact with the database and `tRPC` for type-safe API communication between the frontend and backend.

Authentication is handled via `NextAuth.js`, providing a secure way to manage user sessions. 