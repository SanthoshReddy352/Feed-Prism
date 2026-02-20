
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

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkState() {
  console.log('Attempting manual insert...');
  const { data: insertData, error: insertError } = await supabase
    .from('ingestion_logs')
    .insert({
      status: 'batch_state_v2',
      message: 'test_1',
      articles_count: 0,
    })
    .select();
  
  if (insertError) console.error('Insert Error:', insertError);
  else console.log('Insert Success:', insertData);

  console.log('Checking batch_state_v2...');
  const { data: state, error } = await supabase
    .from('ingestion_logs')
    .select('*')
    .eq('status', 'batch_state_v2')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) console.error('Error:', error);
  else console.table(state);
}

checkState();
