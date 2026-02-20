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

async function listSources() {
    const { data: sources, error } = await supabase
        .from('sources')
        .select('*')
        .order('category', { ascending: true });

    if (error) {
        console.error('Error fetching sources:', error);
        return;
    }

    console.log(`Found ${sources.length} sources.`);
    if (sources.length > 0) {
        console.log('Available columns:', Object.keys(sources[0]).join(', '));
    }

    console.log('--- AI Tools Sources ---');
    sources.filter(s => s.category === 'AI Tools').forEach(s => {
        console.log(`[${s.name}] URL: ${s.rss_url}`);
    });
    
    console.log('\n--- Business Sources ---');
    sources.filter(s => s.category === 'Business').forEach(s => {
        console.log(`[${s.name}] URL: ${s.rss_url}`);
    });

    console.log('\n--- Stocks & Trading Sources ---');
    sources.filter(s => s.category === 'Stocks & Trading').forEach(s => {
        console.log(`[${s.name}] URL: ${s.rss_url}`);
    });
}

listSources();
