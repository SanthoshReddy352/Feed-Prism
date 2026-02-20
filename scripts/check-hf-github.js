
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

async function checkGitHub() {
  // Mapping experimentation
  const slug = 'swift-huggingface';
  // Try different paths
  const paths = [
      `https://raw.githubusercontent.com/huggingface/blog/main/${slug}.md`,
      `https://raw.githubusercontent.com/huggingface/blog/main/posts/${slug}.md`,
      `https://raw.githubusercontent.com/huggingface/blog/main/_posts/${slug}.md`
  ];

  for (const url of paths) {
      console.log(`Checking ${url}...`);
      try {
          const res = await fetch(url);
          if (res.ok) {
              console.log(GREEN + 'Found on GitHub!' + RESET);
              const text = await res.text();
              console.log('Length:', text.length);
              console.log('Snippet:', text.slice(0, 100));
              return;
          } else {
              console.log(RED + `Failed: ${res.status}` + RESET);
          }
      } catch (e) {
          console.error(e.message);
      }
  }
}

checkGitHub();
