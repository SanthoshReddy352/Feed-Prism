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
        const value = parts.slice(1).join('=').trim(); 
        if (key && value) {
            env[key] = value.replace(/^["']|["']$/g, ''); 
        }
    }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const newSources = [
    { name: 'Unite.AI - AI News & Tools', rss_url: 'https://www.unite.ai/feed/', category: 'AI Tools' },
    { name: 'MarkTechPost - AI Tools', rss_url: 'https://www.marktechpost.com/feed/', category: 'AI Tools' },
    { name: 'Google News - AI Tools', rss_url: 'https://news.google.com/rss/search?q="AI+Tools"+when:7d&hl=en-US&gl=US&ceid=US:en', category: 'AI Tools' }
];

async function fixSources() {
    console.log('Deleting existing AI Tools sources...');
    const { error: delError } = await supabase
        .from('sources')
        .delete()
        .eq('category', 'AI Tools');

    if (delError) {
        console.error('Error deleting sources:', delError);
        return;
    }
    console.log('Deleted old sources.');

    console.log('Inserting new working sources...');
    const { data, error } = await supabase
        .from('sources')
        .insert(newSources)
        .select();

    if (error) {
        console.error('Error inserting sources:', error);
    } else {
        console.log('Successfully inserted sources:', data.map(s => s.name).join(', '));
    }
}

fixSources();
