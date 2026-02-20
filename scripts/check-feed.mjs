import { parseFeed } from '../lib/rss/parser.js';

async function checkFeed() {
  const url = 'https://huggingface.co/blog/feed.xml';
  console.log(`Checking ${url}...`);
  try {
    const items = await parseFeed(url);
    if (items.length > 0) {
      console.log('Found', items.length, 'items');
      const item = items[0];
      console.log('First item title:', item.title);
      console.log('Content length:', item.content?.length);
      console.log('Description length:', item.description?.length);
      console.log('Has full content?', (item.content?.length > 500)); 
    } else {
      console.log('No items found.');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

checkFeed();
