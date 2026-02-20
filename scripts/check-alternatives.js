
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

async function checkAlternatives() {
  console.log('Checking Hugging Face API...');
  try {
    const res = await fetch('https://huggingface.co/api/blog');
    if (res.ok) {
        console.log(GREEN + 'HF Blog API might exist (200 OK)' + RESET);
        const json = await res.json();
        console.log('Sample keys:', Object.keys(json).slice(0, 5));
    } else {
        console.log(RED + `HF Blog API returned ${res.status}` + RESET);
    }
  } catch (e) {
    console.error('HF Check Error:', e.message);
  }

  console.log('\nChecking Jina Reader (r.jina.ai) for HN link...');
  try {
    const target = 'https://news.ycombinator.com';
    const res = await fetch(`https://r.jina.ai/${target}`);
    if (res.ok) {
        const text = await res.text();
        console.log(GREEN + 'Jina Reader worked!' + RESET);
        console.log('Snippet:', text.slice(0, 100).replace(/\n/g, ' '));
    } else {
        console.log(RED + `Jina Reader returned ${res.status}` + RESET);
    }
  } catch (e) {
    console.error('Jina Check Error:', e.message);
  }
}

checkAlternatives();
