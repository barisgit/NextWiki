import { db } from "~/lib/db";
import { wikiPages } from "~/lib/db/schema";
import { sql } from "drizzle-orm";

/**
 * Search service - handles all search-related database operations
 */
export const searchService = {
  /**
   * Search whole wiki content, using a multi-layer approach.
   * 1. Vector search with tsquery
   * 2. Title search with like (case-insensitive)
   * 3. Content search with like (case-insensitive)
   * 4. Fuzzy matching using trigram similarity for typos
   */
  search: async (query: string) => {
    // Properly format the vector query for PostgreSQL
    // Split by spaces and add :* to each word, then join with '&' (AND operator)
    const vectorQueryTerms = query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => `${term}:*`)
      .join(" & ");

    // Fallback to basic search if the query is empty after processing
    const vectorQuery = vectorQueryTerms || `${query}:*`;

    // Use try/catch to handle potential tsquery syntax errors
    try {
      const results = await db
        .select({
          id: wikiPages.id,
          title: wikiPages.title,
          content: wikiPages.content,
          path: wikiPages.path,
          createdAt: wikiPages.createdAt,
          updatedAt: wikiPages.updatedAt,
          excerpt: sql<string>`
            CASE
              WHEN ${wikiPages.content} ILIKE ${"%" + query + "%"} 
              THEN substring(${wikiPages.content} from 
                greatest(1, position(lower(${query}) in lower(${
            wikiPages.content
          })) - 100) 
                for 300)
              ELSE substring(${wikiPages.content} from 1 for 200)
            END`.as("excerpt"),
          relevance: sql<number>`
            CASE
              WHEN ${
                wikiPages.search
              } @@ to_tsquery('english', ${vectorQuery}) THEN 4
              WHEN ${wikiPages.title} ILIKE ${"%" + query + "%"} THEN 3
              WHEN ${wikiPages.content} ILIKE ${"%" + query + "%"} THEN 2
              WHEN similarity(${
                wikiPages.title
              }, ${query}) > 0.3 OR similarity(${
            wikiPages.content
          }, ${query}) > 0.3 THEN 1
              ELSE 0
            END`.as("relevance"),
          similarity_title:
            sql<number>`similarity(${wikiPages.title}, ${query})`.as(
              "similarity_title"
            ),
          similarity_content:
            sql<number>`similarity(${wikiPages.content}, ${query})`.as(
              "similarity_content"
            ),
        })
        .from(wikiPages)
        .where(
          sql`${wikiPages.search} @@ to_tsquery('english', ${vectorQuery}) 
            OR ${wikiPages.title} ILIKE ${"%" + query + "%"} 
            OR ${wikiPages.content} ILIKE ${"%" + query + "%"}
            OR similarity(${wikiPages.title}, ${query}) > 0.3
            OR similarity(${wikiPages.content}, ${query}) > 0.3`
        )
        .orderBy(
          sql`relevance DESC, similarity_title DESC, similarity_content DESC`
        );

      return results;
    } catch (error) {
      console.error("Vector search error:", error);

      // Fallback to similarity search
      try {
        // Try with trigram similarity
        const results = await db
          .select({
            id: wikiPages.id,
            title: wikiPages.title,
            content: wikiPages.content,
            path: wikiPages.path,
            createdAt: wikiPages.createdAt,
            updatedAt: wikiPages.updatedAt,
            excerpt: sql<string>`
              CASE
                WHEN ${wikiPages.content} ILIKE ${"%" + query + "%"} 
                THEN substring(${wikiPages.content} from 
                  greatest(1, position(lower(${query}) in lower(${
              wikiPages.content
            })) - 100) 
                  for 300)
                ELSE substring(${wikiPages.content} from 1 for 200)
              END`.as("excerpt"),
            relevance: sql<number>`
              CASE
                WHEN ${wikiPages.title} ILIKE ${"%" + query + "%"} THEN 3
                WHEN ${wikiPages.content} ILIKE ${"%" + query + "%"} THEN 2
                WHEN similarity(${
                  wikiPages.title
                }, ${query}) > 0.3 OR similarity(${
              wikiPages.content
            }, ${query}) > 0.3 THEN 1
                ELSE 0
              END`.as("relevance"),
            similarity_title:
              sql<number>`similarity(${wikiPages.title}, ${query})`.as(
                "similarity_title"
              ),
            similarity_content:
              sql<number>`similarity(${wikiPages.content}, ${query})`.as(
                "similarity_content"
              ),
          })
          .from(wikiPages)
          .where(
            sql`${wikiPages.title} ILIKE ${"%" + query + "%"} 
              OR ${wikiPages.content} ILIKE ${"%" + query + "%"}
              OR similarity(${wikiPages.title}, ${query}) > 0.3
              OR similarity(${wikiPages.content}, ${query}) > 0.3`
          )
          .orderBy(
            sql`relevance DESC, similarity_title DESC, similarity_content DESC`
          );

        return results;
      } catch (similarityError) {
        console.error("Similarity search error:", similarityError);

        // Last resort - just use ILIKE with no trigram
        const results = await db
          .select({
            id: wikiPages.id,
            title: wikiPages.title,
            content: wikiPages.content,
            path: wikiPages.path,
            createdAt: wikiPages.createdAt,
            updatedAt: wikiPages.updatedAt,
            excerpt: sql<string>`
              CASE
                WHEN ${wikiPages.content} ILIKE ${"%" + query + "%"} 
                THEN substring(${wikiPages.content} from 
                  greatest(1, position(lower(${query}) in lower(${
              wikiPages.content
            })) - 100) 
                  for 300)
                ELSE substring(${wikiPages.content} from 1 for 200)
              END`.as("excerpt"),
            relevance: sql<number>`
              CASE
                WHEN ${wikiPages.title} ILIKE ${"%" + query + "%"} THEN 2
                WHEN ${wikiPages.content} ILIKE ${"%" + query + "%"} THEN 1
                ELSE 0
              END`.as("relevance"),
          })
          .from(wikiPages)
          .where(
            sql`${wikiPages.title} ILIKE ${"%" + query + "%"} OR ${
              wikiPages.content
            } ILIKE ${"%" + query + "%"}`
          )
          .orderBy(sql`relevance DESC`);

        return results;
      }
    }
  },

  // FIXME: This is a temporary solution to the search problem. We need to handle adding extensions to the database n the server.
  /**
   * Before using this search functionality, make sure to enable the pg_trgm extension in PostgreSQL:
   * CREATE EXTENSION IF NOT EXISTS pg_trgm;
   *
   * And add trigram indexes:
   * CREATE INDEX IF NOT EXISTS trgm_idx_title ON wiki_pages USING GIN (title gin_trgm_ops);
   * CREATE INDEX IF NOT EXISTS trgm_idx_content ON wiki_pages USING GIN (content gin_trgm_ops);
   */
};
