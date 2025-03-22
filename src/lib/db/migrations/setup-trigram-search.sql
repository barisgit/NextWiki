-- Enable the pg_trgm extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Create trigram GIN indexes for fast similarity searches
CREATE INDEX IF NOT EXISTS trgm_idx_title ON wiki_pages USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS trgm_idx_content ON wiki_pages USING GIN (content gin_trgm_ops);
-- Add comment to explain what these indexes are for
COMMENT ON INDEX trgm_idx_title IS 'Trigram index on wiki page titles for fuzzy search';
COMMENT ON INDEX trgm_idx_content IS 'Trigram index on wiki page content for fuzzy search';
-- Display information about the created indexes
SELECT indexname,
    indexdef
FROM pg_indexes
WHERE indexname IN ('trgm_idx_title', 'trgm_idx_content');