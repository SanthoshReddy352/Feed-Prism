import { XMLParser } from 'fast-xml-parser';
import { stripHtml, truncateText } from '@/lib/sanitize';

/**
 * RSS/Atom Feed Parser
 * Fetches and parses RSS/Atom XML feeds, normalizing them into a standard format.
 */

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  isArray: (name) => ['item', 'entry'].includes(name),
});

/**
 * Fetch and parse an RSS/Atom feed URL
 * @param {string} feedUrl - The RSS/Atom feed URL
 * @param {number} timeout - Fetch timeout in ms (default 8000)
 * @returns {Promise<Array>} Array of normalized article objects
 */
export async function parseFeed(feedUrl, timeout = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'FeedPrism/1.0 RSS Reader',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    const parsed = xmlParser.parse(xml);

    // Determine if RSS or Atom
    if (parsed.rss?.channel) {
      return parseRSSItems(parsed.rss.channel);
    } else if (parsed.feed?.entry) {
      return parseAtomEntries(parsed.feed);
    } else if (parsed.rss?.channel?.item) {
      return parseRSSItems(parsed.rss.channel);
    }

    // Try to find items in other common structures
    const channel = parsed?.rss?.channel || parsed?.channel || parsed?.feed;
    if (channel) {
      return parseRSSItems(channel);
    }

    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parse RSS 2.0 items
 */
function parseRSSItems(channel) {
  const items = channel.item || [];
  const itemArray = Array.isArray(items) ? items : [items];

  return itemArray.map((item) => {
    const imageUrl = extractImageFromRSS(item);
    const description = item.description || item['content:encoded'] || '';

    return {
      title: stripHtml(typeof item.title === 'object' ? item.title['#text'] : item.title || ''),
      description: truncateText(stripHtml(description), 1000),
      content: stripHtml(item['content:encoded'] || description || ''),
      author: extractAuthor(item),
      url: extractUrl(item),
      image_url: imageUrl,
      published_at: parseDate(item.pubDate || item['dc:date']),
    };
  }).filter((item) => item.title && item.url);
}

/**
 * Parse Atom feed entries
 */
function parseAtomEntries(feed) {
  const entries = feed.entry || [];
  const entryArray = Array.isArray(entries) ? entries : [entries];

  return entryArray.map((entry) => {
    const content = entry.content?.['#text'] || entry.content || '';
    const summary = entry.summary?.['#text'] || entry.summary || '';

    return {
      title: stripHtml(typeof entry.title === 'object' ? entry.title['#text'] : entry.title || ''),
      description: truncateText(stripHtml(summary || content), 1000),
      content: stripHtml(typeof content === 'string' ? content : ''),
      author: extractAtomAuthor(entry),
      url: extractAtomUrl(entry),
      image_url: extractAtomImage(entry),
      published_at: parseDate(entry.published || entry.updated),
    };
  }).filter((entry) => entry.title && entry.url);
}

/**
 * Extract URL from RSS item (handles various formats)
 */
function extractUrl(item) {
  if (typeof item.link === 'string') return item.link;
  if (item.link?.['@_href']) return item.link['@_href'];
  if (item.link?.['#text']) return item.link['#text'];
  if (item.guid?.['#text']) return item.guid['#text'];
  if (typeof item.guid === 'string') return item.guid;
  return '';
}

/**
 * Extract URL from Atom entry
 */
function extractAtomUrl(entry) {
  const link = entry.link;
  if (Array.isArray(link)) {
    const alternate = link.find((l) => l['@_rel'] === 'alternate' || !l['@_rel']);
    return alternate?.['@_href'] || link[0]?.['@_href'] || '';
  }
  if (typeof link === 'string') return link;
  return link?.['@_href'] || '';
}

/**
 * Extract author from RSS item
 */
function extractAuthor(item) {
  if (item.author) return stripHtml(typeof item.author === 'object' ? item.author?.name || '' : item.author);
  if (item['dc:creator']) return stripHtml(item['dc:creator']);
  return '';
}

/**
 * Extract author from Atom entry
 */
function extractAtomAuthor(entry) {
  const author = entry.author;
  if (Array.isArray(author)) return author.map((a) => a.name || '').join(', ');
  if (author?.name) return author.name;
  if (typeof author === 'string') return author;
  return '';
}

/**
 * Extract image from RSS item
 */
function extractImageFromRSS(item) {
  // media:content
  if (item['media:content']?.['@_url']) return item['media:content']['@_url'];
  if (Array.isArray(item['media:content'])) return item['media:content'][0]?.['@_url'] || '';

  // media:thumbnail
  if (item['media:thumbnail']?.['@_url']) return item['media:thumbnail']['@_url'];

  // enclosure
  if (item.enclosure?.['@_url'] && item.enclosure?.['@_type']?.startsWith('image/')) {
    return item.enclosure['@_url'];
  }

  // Try to extract first image from content
  const content = item.description || item['content:encoded'] || '';
  const imgMatch = typeof content === 'string' ? content.match(/<img[^>]+src=["']([^"']+)["']/i) : null;
  return imgMatch ? imgMatch[1] : '';
}

/**
 * Extract image from Atom entry
 */
function extractAtomImage(entry) {
  if (entry['media:content']?.['@_url']) return entry['media:content']['@_url'];
  if (entry['media:thumbnail']?.['@_url']) return entry['media:thumbnail']['@_url'];

  const content = entry.content?.['#text'] || entry.content || entry.summary?.['#text'] || entry.summary || '';
  const imgMatch = typeof content === 'string' ? content.match(/<img[^>]+src=["']([^"']+)["']/i) : null;
  return imgMatch ? imgMatch[1] : '';
}

/**
 * Parse date string safely, returns ISO string or null
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}
