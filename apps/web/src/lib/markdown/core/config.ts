/**
 * Shared configuration settings for markdown processing
 */

/**
 * Options for markdown processing
 */
export const markdownOptions = {
  /**
   * Whether to allow HTML in markdown
   */
  allowHtml: true,

  /**
   * Whether to automatically add line breaks
   */
  breaks: true,

  /**
   * HTML sanitization level
   * - 'permissive': Allow all HTML
   * - 'standard': Block potentially dangerous tags
   * - 'strict': Allow only safe tags
   */
  sanitizationLevel: "standard" as "permissive" | "standard" | "strict",

  /**
   * Whether to allow emoji shortcodes
   */
  enableEmojis: true,
};
