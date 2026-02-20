
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

async function checkJina() {
  const url = 'https://huggingface.co/blog/swift-huggingface'; // Example blog
  console.log(`Checking Jina Reader for ${url}...`);
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
        headers: {
            'X-Return-Format': 'markdown'
        }
    });
    if (res.ok) {
        const text = await res.text();
        console.log(GREEN + 'Jina Reader worked!' + RESET);
        console.log('Length:', text.length);
        console.log('Snippet:', text.slice(0, 100).replace(/\n/g, ' '));
    } else {
        console.log(RED + `Jina Reader returned ${res.status}` + RESET);
        const err = await res.text();
        console.log('Error:', err.slice(0, 200));
    }
  } catch (e) {
    console.error('Jina Error:', e.message);
  }
}

checkJina();
