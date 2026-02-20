
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

async function checkFeed() {
  const url = 'https://huggingface.co/blog/feed.xml';
  console.log(`Checking ${url}...`);
  try {
    const res = await fetch(url);
    const text = await res.text();
    
    // Check for content:encoded
    const hasContentEncoded = text.includes('content:encoded');
    const hasDescription = text.includes('<description>');
    
    console.log(`Has <content:encoded>: ${hasContentEncoded ? GREEN + 'YES' + RESET : RED + 'NO' + RESET}`);
    console.log(`Has <description>: ${hasDescription ? GREEN + 'YES' + RESET : RED + 'NO' + RESET}`);
    
    // Check snippet length
    const match = text.match(/<content:encoded>(.*?)<\/content:encoded>/s);
    if (match) {
        console.log(`Sample content length: ${match[1].length}`);
        console.log(`Sample snippet: ${match[1].substring(0, 100)}...`);
    } else {
        console.log('Could not extract content sample.');
    }
    
  } catch (e) {
    console.error('Error:', e);
  }
}

checkFeed();
