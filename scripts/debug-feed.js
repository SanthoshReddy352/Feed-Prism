
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  isArray: (name) => ['item', 'entry'].includes(name),
});

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
}

const logBuffer = [];
function log(msg) {
  console.log(msg);
  logBuffer.push(msg);
}

async function parseFeed(feedUrl) {
  log(`Fetching ${feedUrl}...`);
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'FeedPrism/1.0 RSS Reader',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    log(`Fetched ${xml.length} bytes.`);
    
    const parsed = xmlParser.parse(xml);
    let items = [];

    if (parsed.rss?.channel?.item) {
      log('Detected RSS');
      items = Array.isArray(parsed.rss.channel.item) ? parsed.rss.channel.item : [parsed.rss.channel.item];
    } else if (parsed.feed?.entry) {
      log('Detected Atom');
      items = Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry];
    } else {
      log('Unknown format ' + Object.keys(parsed));
    }

    log(`Found ${items.length} items. Analyzing first 1...`);

    const item = items[0];
    if (item) {
      log('--- Item Keys ---');
      log(JSON.stringify(Object.keys(item)));
      log('--- Title --- ' + item.title);
      
      // Handle Atom title object
      const title = typeof item.title === 'object' ? item.title['#text'] : item.title;
      log('--- Title (resolved) --- ' + title);

      if (item.description) log('--- Description (first 100) --- ' + stripHtml(item.description).substring(0, 100));
      else log('--- Description is missing ---');
      
      if (item['content:encoded']) log('--- Content:Encoded (first 100) --- ' + stripHtml(item['content:encoded']).substring(0, 100));
      else log('--- Content:Encoded is missing ---');
      
      if (item.summary) log('--- Summary (first 100) --- ' + stripHtml(typeof item.summary === 'object' ? item.summary['#text'] : item.summary).substring(0, 100));
      else log('--- Summary is missing ---');

      if (item.content) log('--- Content (first 100) --- ' + stripHtml(typeof item.content === 'object' ? item.content['#text'] : item.content).substring(0, 100));
      else log('--- Content is missing ---');
    }
  } catch (err) {
    log(`Error parsing ${feedUrl}: ${err.message}`);
  }
}

const urls = [
  'https://huggingface.co/blog/feed.xml',
  'https://hnrss.org/frontpage'
];

async function main() {
  for (const url of urls) {
    await parseFeed(url);
  }
  fs.writeFileSync('debug_log.txt', logBuffer.join('\n'));
  console.log('Done. Written to debug_log.txt');
}

main();
