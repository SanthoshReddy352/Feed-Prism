
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

async function checkHFContent() {
  console.log('Fetching HF Blog API...');
  try {
    const res = await fetch('https://huggingface.co/api/blog');
    const json = await res.json();
    
    // Check first blog post
    if (json && json.length > 0) { // Assuming it's an array, or has 'allBlogs' array
       const blogs = Array.isArray(json) ? json : (json.allBlogs || []);
       if (blogs.length > 0) {
           const post = blogs[0];
           console.log('Title:', post.title);
           console.log('Keys:', Object.keys(post));
           console.log('Content length:', post.content?.length || 'N/A');
           
           // If content is missing, maybe it's under a different key or needs a separate fetch
           if (!post.content) {
               console.log('Content missing in list. Attempting to fetch individual post...');
               // Try typical patterns: /api/blog/<slug>
               const slug = post.slug || post.localSlug;
               if (slug) {
                   const detailUrl = `https://huggingface.co/api/blog/${slug}`;
                   console.log(`Fetching detail: ${detailUrl}`);
                   const detailRes = await fetch(detailUrl);
                   if (detailRes.ok) {
                       const detailJson = await detailRes.json();
                       console.log('Detail Keys:', Object.keys(detailJson));
                       console.log('Detail Content Length:', detailJson.content?.length || 'N/A');
                   } else {
                       console.log(RED + `Detail fetch failed: ${detailRes.status}` + RESET);
                   }
               }
           }
       } else {
           console.log('No blogs found in list.');
       }
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

checkHFContent();
