/**
 * HTML Sanitizer — strips HTML tags and entities from RSS content
 * Prevents XSS by removing all HTML before storing in database
 */

/**
 * Strip all HTML tags from a string
 * @param {string} html - Raw HTML string
 * @returns {string} Plain text with HTML removed
 */
export function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove styles
    .replace(/<[^>]+>/g, '')   // Remove all HTML tags
    .replace(/&nbsp;/g, ' ')   // Replace &nbsp;
    .replace(/&amp;/g, '&')    // Replace &amp;
    .replace(/&lt;/g, '<')     // Replace &lt;
    .replace(/&gt;/g, '>')     // Replace &gt;
    .replace(/&quot;/g, '"')   // Replace &quot;
    .replace(/&#039;/g, "'")   // Replace &#039;
    .replace(/&#x27;/g, "'")   // Replace &#x27;
    .replace(/&apos;/g, "'")   // Replace &apos;
    .replace(/\s+/g, ' ')      // Collapse whitespace
    .trim();
}

/**
 * Truncate text to a maximum length, preserving whole words
 * @param {string} text - Input text
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 500) {
  if (!text || text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '…';
}
