---
path: features/search-demo/fuzzy-match-page
title: Fuzzy Match Search Demo
author: NextWiki Team
createdAt: 2024-01-01T00:00:00.000Z
updated: 2024-01-01T00:00:00.000Z
tags: [feature, search, demo, fuzzy match, typo, test]
---

# Fuzzy Match Search Demo

This page is intended to test the fuzzy matching and typo tolerance capabilities of the NextWiki search (Note: fuzzy matching might still be in progress).

Try searching for variations or misspellings of these words:

-   `fuzzymatching` (Try: `fuzy matching`, `fuzymatching`)
-   `PostgreSQL` (Try: `Postgress`, `PosgresQL`)
-   `NextAuth` (Try: `NexAuth`, `NextAuthh`)
-   `highlighting` (Try: `hightlighting`, `highliting`)
-   `collaboration` (Try: `colaboration`, `collaberation`)
-   `javascript` (Try: `javscript`, `javascrpt`)

## How it Works (or Will Work)

Fuzzy matching often uses techniques like `trigram similarity` (pg_trgm extension in PostgreSQL) or Levenshtein distance to find terms that are close to the search query, even if not identical.

This helps users find content even if they make a typo (`wierd` instead of `weird`) or aren't sure of the exact spelling.

Effective fuzzymatching requires careful indexing and query tuning. The system might calculate a similarity score between the search term and terms in the documents and return results above a certain threshold.

Testing different variations, like `javscript` for `javascript` or `colaboration` for `collaboration`, helps ensure the search is robust. 