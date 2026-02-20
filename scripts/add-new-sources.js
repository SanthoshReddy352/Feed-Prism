const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim(); // Handle values with = in them
        if (key && value) {
            env[key] = value.replace(/^["']|["']$/g, ''); // Remove quotes
        }
    }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Supabase URL or Key not found in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const newSources = [
    // AI Tools
    { name: 'FutureTools.io Blog', rss_url: 'https://www.futuretools.io/blog/rss.xml', category: 'AI Tools' },
    { name: 'There\'s An AI For That', rss_url: 'https://theresanaiforthat.com/feed', category: 'AI Tools' },
    { name: 'Product Hunt - AI', rss_url: 'https://www.producthunt.com/topics/artificial-intelligence/feed.atom', category: 'AI Tools' },
    
    // Business
    { name: 'Bloomberg Business', rss_url: 'https://feeds.bloomberg.com/business/news.rss', category: 'Business' },
    { name: 'CNBC Business', rss_url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrrss01&id=10001147', category: 'Business' },
    { name: 'Forbes Business', rss_url: 'https://www.forbes.com/business/feed/', category: 'Business' },
    { name: 'Financial Times - Business', rss_url: 'https://www.ft.com/business-education?format=rss', category: 'Business' },

    // Stocks & Trading
    { name: 'Yahoo Finance - Stock Market', rss_url: 'https://finance.yahoo.com/news/rssindex', category: 'Stocks & Trading' },
    { name: 'MarketWatch - Top Stories', rss_url: 'http://feeds.marketwatch.com/marketwatch/topstories/', category: 'Stocks & Trading' },
    { name: 'Investing.com - Stock Market', rss_url: 'https://www.investing.com/rss/stock_Market_News.rss', category: 'Stocks & Trading' },
    { name: 'Seeking Alpha - Market News', rss_url: 'https://seekingalpha.com/feed.xml', category: 'Stocks & Trading' }
];

async function insertSources() {
    console.log('Inserting new sources...');
    const { data, error } = await supabase
        .from('sources')
        .upsert(newSources, { onConflict: 'rss_url', ignoreDuplicates: true })
        .select();

    if (error) {
        console.error('Error inserting sources:', error);
    } else {
        console.log('Successfully inserted/processed sources.');
    }
}

insertSources();
