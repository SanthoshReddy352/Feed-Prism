const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function checkArticles() {
    const { data, error } = await supabase
        .from('articles')
        .select('category', { count: 'exact', head: true }); 
        // head:true gives total count, but we want group by.
        // Supabase-js doesn't do group by easily.
        // Let's just count for specific categories.

    const categories = ['AI Tools', 'Business', 'Stocks & Trading', 'Technology'];
    
    for (const cat of categories) {
        const { count, error } = await supabase
            .from('articles')
            .select('*', { count: 'exact', head: true })
            .eq('category', cat);
            
        console.log(`Category [${cat}]: ${count} articles. Error: ${error ? error.message : 'None'}`);
    }
}

checkArticles();
