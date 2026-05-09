# **Feed Prism \- Public API Service Architecture & Implementation Guide**

## **1\. Feature Overview**

This document outlines the architecture and implementation steps for building a public-facing, customizable API service for Feed Prism. This service will allow developers to generate an API key, select specific news categories and sources, and integrate a custom JSON feed directly into their own applications.

**Key Capabilities:**

* Free tier API access secured via API Keys.  
* Multi-select filtering for Categories (up to 12\) and Sources.  
* Rate-limited infrastructure to protect database health.  
* Highly interactive, glassmorphism-styled "API Builder" documentation.

## **2\. Database Layer (Supabase)**

To manage access, we need to introduce API key management into our PostgreSQL database.

### **2.1 Schema: api\_keys Table**

Execute the following SQL in the Supabase SQL Editor:

\-- Create API Keys Table  
CREATE TABLE public.api\_keys (  
    id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,  
    user\_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,  
    api\_key TEXT UNIQUE NOT NULL,  
    name TEXT DEFAULT 'Default Project Key',  
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),  
    created\_at TIMESTAMPTZ DEFAULT NOW(),  
    last\_used\_at TIMESTAMPTZ  
);

\-- Index for fast lookups during API requests  
CREATE INDEX idx\_api\_keys\_key ON public.api\_keys(api\_key);

\-- Row Level Security (RLS)  
ALTER TABLE public.api\_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"   
ON public.api\_keys FOR SELECT   
USING (auth.uid() \= user\_id);

CREATE POLICY "Users can insert their own API keys"   
ON public.api\_keys FOR INSERT   
WITH CHECK (auth.uid() \= user\_id);

CREATE POLICY "Users can update their own API keys"   
ON public.api\_keys FOR UPDATE   
USING (auth.uid() \= user\_id);

## **3\. Backend Implementation (Next.js Server)**

We will create a dedicated versioned endpoint app/api/v1/articles/route.js to separate public API traffic from internal dashboard traffic.

### **3.1 Endpoint Logic (app/api/v1/articles/route.js)**

**Key Changes from Internal API:**

1. Validates the x-api-key header.  
2. Accepts comma-separated strings for multi-select.  
3. Uses Supabase's .in() filter instead of .eq().

import { NextResponse } from 'next/server';  
import { createClient } from '@/lib/supabase/server';  
import { z } from 'zod';

// Schema allows comma-separated strings for multiple selections  
const publicApiQuerySchema \= z.object({  
  categories: z.string().optional(), // e.g., "technology,business"  
  sources: z.string().optional(),    // e.g., "techcrunch,theverge"  
  page: z.coerce.number().default(1),  
  limit: z.coerce.number().min(1).max(50).default(20),  
});

export async function GET(request) {  
  try {  
    const apiKey \= request.headers.get('x-api-key');  
    if (\!apiKey) {  
      return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 });  
    }

    const supabase \= await createClient();

    // 1\. Authenticate API Key  
    const { data: keyData, error: keyError } \= await supabase  
      .from('api\_keys')  
      .select('id, status')  
      .eq('api\_key', apiKey)  
      .single();

    if (keyError || \!keyData || keyData.status \!== 'active') {  
      return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 403 });  
    }

    // 2\. Parse Query Parameters  
    const { searchParams } \= new URL(request.url);  
    const params \= publicApiQuerySchema.parse(Object.fromEntries(searchParams));  
    const offset \= (params.page \- 1\) \* params.limit;

    // 3\. Build Query  
    let query \= supabase  
      .from('articles')  
      .select('id, title, link, published\_at, category, sources(name)', { count: 'exact' });

    // 4\. Apply Multi-Select Filters  
    if (params.categories) {  
      const categoryArray \= params.categories.split(',').map(c \=\> c.trim());  
      query \= query.in('category', categoryArray);  
    }  
      
    if (params.sources) {  
      const sourceArray \= params.sources.split(',').map(s \=\> s.trim());  
      query \= query.in('source\_id', sourceArray);  
    }

    // 5\. Execute and Return  
    query \= query.order('published\_at', { ascending: false }).range(offset, offset \+ params.limit \- 1);  
      
    const { data, count, error } \= await query;  
    if (error) throw error;

    return NextResponse.json({  
      status: 'success',  
      data: data,  
      meta: { page: params.page, limit: params.limit, total: count }  
    });

  } catch (error) {  
    if (error.name \=== 'ZodError') {  
      return NextResponse.json({ error: 'Invalid parameters', details: error.errors }, { status: 400 });  
    }  
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });  
  }  
}

## **4\. Security & Rate Limiting**

To prevent abuse of the free API, we MUST implement rate limiting at the Edge (Middleware level) before the request hits our Serverless functions or Supabase.

**Recommendation:** Use @upstash/ratelimit and @upstash/redis.

### **4.1 Next.js Middleware Implementation (middleware.js)**

import { NextResponse } from 'next/server';  
import { Ratelimit } from '@upstash/ratelimit';  
import { Redis } from '@upstash/redis';

// Initialize Redis for Rate Limiting  
const redis \= new Redis({  
  url: process.env.UPSTASH\_REDIS\_REST\_URL,  
  token: process.env.UPSTASH\_REDIS\_REST\_TOKEN,  
});

// Limit to 60 requests per 1 minute per API Key  
const ratelimit \= new Ratelimit({  
  redis: redis,  
  limiter: Ratelimit.slidingWindow(60, "1 m"),  
  analytics: true,  
});

export async function middleware(request) {  
  // Only apply to public API routes  
  if (request.nextUrl.pathname.startsWith('/api/v1/')) {  
    const apiKey \= request.headers.get('x-api-key');  
      
    if (\!apiKey) {  
        // Fallback to IP if no key is provided (though the route will reject it anyway)  
        const ip \= request.ip ?? '127.0.0.1';  
        const { success } \= await ratelimit.limit(\`unauth\_${ip}\`);  
        if (\!success) return new NextResponse('Too Many Requests', { status: 429 });  
        return NextResponse.next();  
    }

    const { success, limit, reset, remaining } \= await ratelimit.limit(\`apikey\_${apiKey}\`);  
      
    if (\!success) {  
      return NextResponse.json(  
        { error: 'Rate limit exceeded. Maximum 60 requests per minute.' },  
        {   
          status: 429,   
          headers: {  
            'X-RateLimit-Limit': limit.toString(),  
            'X-RateLimit-Remaining': remaining.toString(),  
            'X-RateLimit-Reset': reset.toString()  
          }   
        }  
      );  
    }  
  }  
  return NextResponse.next();  
}

## **5\. Frontend UI/UX: The Interactive Developer Portal**

Instead of static markdown documentation, we will build a /dashboard/developers route utilizing a visually striking **Bento Grid** layout with **Glassmorphism** styling.

### **5.1 UI Architecture (React Components)**

The page will maintain the following layout state in a parent React Client Component (ApiBuilder.jsx):

const \[selectedCategories, setSelectedCategories\] \= useState(\[\])

const \[selectedSources, setSelectedSources\] \= useState(\[\])

**Bento Box 1: API Key Management**

* Displays current API key (hidden by default, click to reveal).  
* Button to "Regenerate Key".  
* Server Action handles securely generating a crypto.randomUUID() or secure hash and saving to Supabase.

**Bento Box 2: Category Selector (Multi-select)**

* A grid of 12 pill-shaped buttons for the 12 news categories.  
* Toggling a button adds/removes the category from selectedCategories.

**Bento Box 3: Source Selector (Multi-select)**

* A scrollable list with checkboxes for specific RSS sources.  
* Toggling updates selectedSources.

**Bento Box 4: The Dynamic Code Generator**

* React automatically constructs the URL based on state:  
  const apiUrl \= \`https://api.feedprism.com/v1/articles?categories=${selectedCategories.join(',')}\&sources=${selectedSources.join(',')}\`;

* Use a syntax highlighter component (like prismjs or react-syntax-highlighter) to display tabs: cURL, JavaScript (Fetch), Python (Requests).

**Bento Box 5: Live JSON Preview**

* A button "Run Test Request".  
* When clicked, the browser makes a real fetch() call to the generated URL (using the user's actual API key).  
* Renders the resulting JSON payload in a beautifully formatted, collapsible JSON viewer tree.

### **5.2 Tailwind CSS Styling Directives (Glassmorphism)**

For the Bento Grid elements, instruct the frontend developer to use the following Tailwind utilities to achieve the requested look:

bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl shadow-xl p-6

## **6\. Deployment Checklist**

1. \[ \] Apply api\_keys SQL migration to Supabase.  
2. \[ \] Add crypto library logic for generating secure API keys in a Next.js Server Action.  
3. \[ \] Build the /dashboard/developers UI with interactive Bento Grid.  
4. \[ \] Implement the new /api/v1/articles endpoint.  
5. \[ \] Provision an Upstash Redis database (Free tier).  
6. \[ \] Add UPSTASH\_REDIS\_REST\_URL and UPSTASH\_REDIS\_REST\_TOKEN to Vercel Environment Variables.  
7. \[ \] Implement and test middleware.js for rate limiting.