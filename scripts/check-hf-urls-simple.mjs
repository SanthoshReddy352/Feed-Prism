
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

async function checkUrls() {
  const url = 'https://huggingface.co/blog/feed.xml';
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url);
    const xml = await res.text();
    const parsed = parser.parse(xml);
    
    // Access items (RSS structure)
    const items = parsed.rss?.channel?.item || []; 
    console.log(`Found ${items.length} items.`);
    
    const samples = items.slice(0, 10);
    samples.forEach(item => {
        const urlLink = item.link || item.guid;
        console.log(`URL: ${urlLink}`);
        
        // Simulate extraction (current vs improved)
        const match = urlLink.match(/huggingface\.co\/blog\/([^/?#]+)/);
        console.log(`  Slug (Current): ${match ? match[1] : 'NO MATCH'}`);
        
         // Better Regex?
        const match2 = urlLink.match(/huggingface\.co\/blog\/(.+)/);
        console.log(`  Path (Improved): ${match2 ? match2[1] : 'NO MATCH'}`);
    });
    
  } catch (e) {
    console.error('Error:', e);
  }
}

checkUrls();
