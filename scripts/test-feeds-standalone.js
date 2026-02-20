const { XMLParser } = require('fast-xml-parser');

const feeds = [
    'https://www.unite.ai/feed/',
    'https://www.marktechpost.com/feed/',
    'https://topai.tools/blog/rss.xml'
];

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
});

async function testFeeds() {
    for (const url of feeds) {
        console.log(`\nTesting: ${url}`);
        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            
            if (!res.ok) {
                console.error(`FAILED: HTTP ${res.status}`);
                continue;
            }

            const text = await res.text();
            console.log(`Fetched ${text.length} bytes.`);
            
            try {
                const xml = parser.parse(text);
                const items = xml.rss?.channel?.item || xml.feed?.entry || [];
                const count = Array.isArray(items) ? items.length : (items ? 1 : 0);
                console.log(`SUCCESS: Parsed ${count} items.`);
                if (count > 0) {
                    const first = Array.isArray(items) ? items[0] : items;
                    console.log('Sample Title:', first.title);
                }
            } catch (e) {
                console.error('FAILED to parse XML:', e.message);
            }

        } catch (e) {
            console.error(`FAILED to fetch: ${e.message}`);
        }
    }
}

testFeeds();
