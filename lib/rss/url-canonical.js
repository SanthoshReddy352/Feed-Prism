/**
 * URL Canonicalization for Deduplication
 *
 * The same article is frequently published under slightly different URLs:
 *   - tracking params:   ?utm_source=rss&utm_medium=rss / ?fbclid=... / ?ref=...
 *   - protocol:          http://  vs  https://
 *   - host case / www:   HTTPS://WWW.Site.com  vs  https://site.com
 *   - trailing slash:    /article  vs  /article/
 *   - fragments:         /article#comments
 *
 * Hashing the raw URL (the old behaviour) treated every one of these as a NEW
 * article, which is the main source of duplicate rows. We collapse all of these
 * to a single canonical string and hash THAT.
 *
 * IMPORTANT: The SQL function `fp_canonical_url()` in
 * scripts/migrations/03_dedup_cleanup.sql must mirror these rules so that the
 * one-time DB cleanup produces the same hashes this code generates going forward.
 */

// Query parameters that never identify a unique article — safe to strip.
const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'utm_id', 'utm_name', 'utm_reader', 'utm_brand', 'utm_social',
  'fbclid', 'gclid', 'dclid', 'gbraid', 'wbraid', 'msclkid', 'yclid',
  'mc_cid', 'mc_eid', 'igshid', 'ref', 'ref_src', 'referrer', 'source',
  'cmpid', 'ncid', 'sr_share', 'spm', '__twitter_impression',
  '_hsenc', '_hsmi', 'vero_id', 'oly_anon_id', 'oly_enc_id', 'guce_referrer',
]);

/**
 * Produce a canonical, dedup-friendly form of a URL.
 * Returns a lowercase string WITHOUT scheme or leading "www.".
 * Falls back to a simple lowercase/trim if the URL can't be parsed.
 *
 * @param {string} rawUrl
 * @returns {string}
 */
export function canonicalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();

  let u;
  try {
    u = new URL(trimmed);
  } catch {
    // Not a parseable absolute URL — best-effort fallback.
    return trimmed.toLowerCase().replace(/#.*$/, '').replace(/\/+$/, '');
  }

  // Host: lowercase, drop leading "www."
  let host = u.hostname.toLowerCase().replace(/^www\./, '');

  // Path: lowercase + drop trailing slash (but keep a bare "/").
  let path = u.pathname.toLowerCase();
  if (path.length > 1) path = path.replace(/\/+$/, '');

  // Query: keep only non-tracking params, sorted for stability.
  const kept = [];
  for (const [key, value] of u.searchParams.entries()) {
    if (!TRACKING_PARAMS.has(key.toLowerCase())) {
      kept.push([key.toLowerCase(), value]);
    }
  }
  kept.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const query = kept.map(([k, v]) => (v === '' ? k : `${k}=${v}`)).join('&');

  return host + path + (query ? `?${query}` : '');
}

/**
 * SHA-256 hex hash of the canonical URL. This is the dedup key (url_hash).
 * @param {string} rawUrl
 * @returns {Promise<string>}
 */
export async function hashUrl(rawUrl) {
  const canonical = canonicalizeUrl(rawUrl);
  const data = new TextEncoder().encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Normalize a title for near-duplicate detection across sources/variants.
 * Lowercase, strip punctuation, collapse whitespace.
 * @param {string} title
 * @returns {string}
 */
export function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
