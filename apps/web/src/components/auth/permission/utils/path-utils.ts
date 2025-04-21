/**
 * Helper function to check if current path is public.
 * Supports exact matches and wildcard pattern matches (path/*).
 *
 * @param pathname The current pathname to check
 * @param publicPaths Array of public paths or patterns
 * @returns true if the path matches any public path or pattern
 */
export function isPublicPath(
  pathname: string,
  publicPaths?: string[]
): boolean {
  if (!publicPaths || publicPaths.length === 0) {
    return false;
  }

  return publicPaths.some((publicPath) => {
    if (publicPath.endsWith("*")) {
      // Wildcard match: check if pathname starts with the prefix
      const prefix = publicPath.slice(0, -1);
      // Ensure the prefix match is at a path segment boundary or exact match
      return pathname.startsWith(prefix);
    } else {
      // Exact match
      return pathname === publicPath;
    }
  });
}
