import { createClient } from '@/lib/supabase/server';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import LivePreview from './components/LivePreview';
import TrustedSources from './components/TrustedSources';
import Stats from './components/Stats';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';

const BLOCKED_SOURCE_PATTERNS = [
  'hugging face',
  'hacker news',
  'arxiv ai',
  'marketwatch - topstories',
  'seeking alpha - market news',
  'yahoo finance - stock market',
  'investing.com - stock market',
  'cloudflare status',
  'coloudflare status',
  'bloomberg business',
  'bloom berg business',
  'google news - ai tools',
];

const LANDING_CATEGORY_ORDER = [
  'Technology',
  'AI & ML',
  'Global News',
  'Outbreaks & Health',
  'Company News',
  'Cloud & Infrastructure',
  'Developer & Engineering',
  'Startups',
  'Security',
  'AI Tools',
  'Business',
  'Stocks & Trading',
];

function buildStats({ sourceCount, articleCount, categories, todayCount }) {
  return [
    { value: sourceCount, suffix: '', label: 'Active Sources', prefix: '' },
    { value: articleCount, suffix: '+', label: 'Articles Indexed', prefix: '' },
    { value: todayCount, suffix: '', label: 'Published Today', prefix: '' },
    { value: categories, suffix: '', label: 'Categories', prefix: '' },
  ];
}

async function safeQuery(label, queryPromise, fallback) {
  try {
    const result = await queryPromise;
    return result ?? fallback;
  } catch (error) {
    console.error(`[home] ${label} query failed`, error);
    return fallback;
  }
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function isBlockedSource(sourceName) {
  const normalized = normalizeText(sourceName);
  return BLOCKED_SOURCE_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function hasValidDescription(article) {
  return Boolean(normalizeText(article?.description));
}

function selectLandingArticlesByCategory(articles, totalNeeded = 12) {
  const normalizedCategories = new Set(
    LANDING_CATEGORY_ORDER.map((category) => normalizeText(category))
  );
  const buckets = new Map();

  for (const category of LANDING_CATEGORY_ORDER) {
    buckets.set(normalizeText(category), []);
  }

  for (const article of articles) {
    const key = normalizeText(article?.category);
    if (!normalizedCategories.has(key)) continue;
    buckets.get(key).push(article);
  }

  const selected = [];
  const selectedIds = new Set();

  for (const category of LANDING_CATEGORY_ORDER) {
    const key = normalizeText(category);
    const bucket = buckets.get(key) || [];
    const pick = bucket.find((article) => !selectedIds.has(article.id));
    if (!pick) continue;
    selected.push(pick);
    selectedIds.add(pick.id);
  }

  if (selected.length < totalNeeded) {
    for (const article of articles) {
      if (selectedIds.has(article.id)) continue;
      selected.push(article);
      selectedIds.add(article.id);
      if (selected.length >= totalNeeded) break;
    }
  }

  return selected.slice(0, totalNeeded);
}

import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Create a public client for cached public data
const getPublicClient = () => createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Cache stats for 1 hour
const getCachedStats = unstable_cache(
  async (startOfDayIso, nowIso) => {
    const supabase = getPublicClient();
    const [sourceCount, articleCount, todayCount] = await Promise.all([
      supabase
        .from('sources')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .gte('published_at', startOfDayIso)
        .lte('published_at', nowIso)
    ]);

    return {
      sourceCount: sourceCount.count || 0,
      articleCount: articleCount.count || 0,
      todayCount: todayCount.count || 0,
    };
  },
  ['site-stats'],
  { revalidate: 3600 }
);

// Cache sources for 1 hour
const getCachedSources = unstable_cache(
  async () => {
    const supabase = getPublicClient();
    return supabase
      .from('sources')
      .select('name, category')
      .eq('is_active', true)
      .order('name')
      .limit(200);
  },
  ['active-sources'],
  { revalidate: 3600 }
);

export default async function Home() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayIso = startOfDay.toISOString();

  // Fetch all data in parallel
  const [
    userResult,
    recentArticlesResult,
    sourcesResult,
    statsData
  ] = await Promise.all([
    safeQuery('user', supabase.auth.getUser(), { data: { user: null } }),
    safeQuery(
      'recent articles',
      supabase
        .from('articles')
        .select('id, title, description, url, category, image_url, published_at, sources(name)')
        .lte('published_at', nowIso)
        .order('published_at', { ascending: false })
        .limit(220),
      { data: [], error: null }
    ),
    getCachedSources(),
    getCachedStats(startOfDayIso, nowIso)
  ]);

  const user = userResult?.data?.user ?? null;
  const recentArticlesPool = Array.isArray(recentArticlesResult?.data)
    ? recentArticlesResult.data
    : [];

  const filteredLandingArticles = recentArticlesPool
    .filter((article) => hasValidDescription(article))
    .filter((article) => !isBlockedSource(article?.sources?.name));

  const landingSelection = selectLandingArticlesByCategory(filteredLandingArticles, 12);
  const heroArticles = landingSelection.slice(0, 3);
  const previewArticles = landingSelection.slice(3, 12);

  const sourceRows = Array.isArray(sourcesResult?.data) ? sourcesResult.data : [];
  const trustedSourceNames = sourceRows.map((source) => source.name).filter(Boolean);
  const categoryCount = new Set(
    sourceRows.map((source) => source.category).filter(Boolean)
  ).size;

  const stats = buildStats({
    sourceCount: statsData.sourceCount,
    articleCount: statsData.articleCount,
    categories: categoryCount,
    todayCount: statsData.todayCount,
  });

  return (
    <>
      <Navbar user={user} />
      <main>
        <Hero user={user} spotlightArticles={heroArticles} />
        <Features />
        <TrustedSources sources={trustedSourceNames} />
        <LivePreview articles={previewArticles} />
        <Stats stats={stats} />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
