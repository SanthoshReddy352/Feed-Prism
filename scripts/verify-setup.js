
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) {
    let val = value.trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    acc[key.trim()] = val;
  }
  return acc;
}, {});

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  console.log('--- Verifying Sources Schema ---');
  const { data: source, error: sourceError } = await supabase
    .from('sources')
    .select('name, fetch_full_content, batch_weight')
    .eq('name', 'Hugging Face Blog')
    .single();

  if (sourceError) {
    console.error('Error fetching source:', sourceError);
  } else {
    console.log('Hugging Face Blog Config:', source);
  }

  console.log('\n--- Checking Batch State ---');
  const { data: logs, error: logError } = await supabase
    .from('ingestion_logs')
    .select('*')
    .eq('status', 'batch_state')
    .order('created_at', { ascending: false })
    .limit(3);

  if (logError) {
    console.error('Error fetching logs:', logError);
  } else {
    console.table(logs);
  }
}

verify();
