
import { parseFeed } from './lib/rss/parser.js';

async function checkUrls() {
  const url = 'https://huggingface.co/blog/feed.xml';
  console.log(`Fetching ${url}...`);
  try {
    const items = await parseFeed(url);
    console.log(`Found ${items.length} items.`);
    
    const samples = items.slice(0, 10);
    samples.forEach(item => {
        console.log(`URL: ${item.url}`);
        // Simulate extraction
        const match = item.url.match(/huggingface\.co\/blog\/([^/?#]+)/);
        console.log(`  Extracted Slug (Current Regex): ${match ? match[1] : 'NO MATCH'}`);
        
        // Better Regex?
        const match2 = item.url.match(/huggingface\.co\/blog\/(.+)/);
        console.log(`  Full Path: ${match2 ? match2[1] : 'NO MATCH'}`);
    });
    
  } catch (e) {
    console.error('Error:', e);
  }
}

checkUrls();
