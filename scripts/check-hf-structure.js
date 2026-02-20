
async function checkHFStructure() {
  console.log('Fetching HF Blog API...');
  try {
    const res = await fetch('https://huggingface.co/api/blog');
    const json = await res.json();
    
    // Check first blog post in list
    let blogs = [];
    if (Array.isArray(json)) blogs = json;
    else if (json.allBlogs) blogs = json.allBlogs;
    
    if (blogs.length > 0) {
       const post = blogs[0];
       console.log('Use console.dir for depth');
       // Print top level keys
       console.log('Keys:', Object.keys(post));
       
       // Check for content-like fields
       const contentFields = Object.keys(post).filter(k => k.toLowerCase().includes('content') || k.toLowerCase().includes('text') || k.toLowerCase().includes('body'));
       console.log('Potential Content Fields:', contentFields);
       console.log('Slug:', post.localSlug);
       
    } else {
       console.log('No blogs found.');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkHFStructure();
