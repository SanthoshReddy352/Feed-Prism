
/**
 * Content Fetcher
 * Retrieval strategies for specific sources without direct scraping
 */

const TIMEOUT = 15000;

/**
 * Fetch content based on source strategy
 * @param {string} url - Article URL
 * @param {string} sourceName - Name of the source (e.g., "Hugging Face Blog", "Hacker News")
 * @returns {Promise<string|null>} Markdown or HTML content
 */
export async function fetchContent(url, sourceName) {
  if (!url) return null;

  try {
    if (sourceName === 'Hugging Face Blog') {
      return await fetchHuggingFaceGitHub(url);
    } 
    else if (sourceName === 'Hacker News') {
      return await fetchWithJina(url);
    }
    
    return null;
  } catch (error) {
    console.warn(`[ContentFetcher] Failed to fetch ${url} for ${sourceName}: ${error.message}`);
    return null;
  }
}

/**
 * Fetch raw markdown from Hugging Face GitHub repo
 */
async function fetchHuggingFaceGitHub(url) {
  // Extract full path after /blog/ (e.g., https://huggingface.co/blog/org/post -> org/post)
  const match = url.match(/huggingface\.co\/blog\/(.+)/);
  if (!match) return null;
  
  // Clean query params/hashes
  const rawSlug = match[1].split(/[?#]/)[0];
  
  // GitHub repo structure can be:
  // 1. Root: {slug}.md (e.g. detailed-vision-descriptions.md)
  // 2. Organization folder: {org}/{slug}.md ?? No, usually flattened or in _posts
  // Let's try known patterns.
  
  // Note: The HF blog repo (huggingface/blog) usually flat-maps many posts, or puts them in ISO date folders, 
  // OR recently shifted to organization folders.
  // Actually, checking the repo:
  // - localized posts are in /zh, /ja, etc.
  // - some are in root
  // - some might be in _posts
  
  // Let's try the direct slug first, then try handling "org/slug" by taking just the "slug" part if the first fails.
  // Many "org/slug" URLs actually map to "slug.md" in the root or _posts.
  // Example: huggingface.co/blog/tiiuae/falcon-180b -> falcon-180b.md
  
  const parts = rawSlug.split('/');
  const filename = parts.length > 1 ? parts[parts.length - 1] : rawSlug;
  
  const candidates = [
      `https://raw.githubusercontent.com/huggingface/blog/main/${filename}.md`,
      `https://raw.githubusercontent.com/huggingface/blog/main/_posts/${filename}.md`,
      `https://raw.githubusercontent.com/huggingface/blog/main/posts/${filename}.md`,
      // Some might use the full path including org?
      `https://raw.githubusercontent.com/huggingface/blog/main/${rawSlug}.md`,
  ];

  for (const githubUrl of candidates) {
      const response = await fetchWithTimeout(githubUrl);
      if (response.ok) {
          return await response.text();
      }
  }
  
  console.warn(`[ContentFetcher] HF Blog not found on GitHub for ${url} (tried ${filename})`);
  return null;
}

/**
 * Fetch content using Jina Reader
 */
async function fetchWithJina(targetUrl) {
  const jinaUrl = `https://r.jina.ai/${targetUrl}`;
  
  const response = await fetchWithTimeout(jinaUrl, {
    headers: {
      'X-Return-Format': 'markdown'
    }
  });
  
  if (!response.ok) return null;
  return await response.text();
}

/**
 * Helper: Fetch with timeout
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}
