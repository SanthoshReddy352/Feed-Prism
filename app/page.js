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

export default async function Home() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayIso = startOfDay.toISOString();

  const userResult = await safeQuery(
    'user',
    supabase.auth.getUser(),
    { data: { user: null } }
  );

  const recentArticlesResult = await safeQuery(
    'recent articles',
    supabase
      .from('articles')
      .select('id, title, description, url, category, image_url, published_at, sources(name)')
      .lte('published_at', nowIso)
      .order('published_at', { ascending: false })
      .limit(220),
    { data: [], error: null }
  );

  const sourcesResult = await safeQuery(
    'sources',
    supabase
      .from('sources')
      .select('name, category')
      .eq('is_active', true)
      .order('name')
      .limit(200),
    { data: [], error: null }
  );

  const activeSourceCountResult = await safeQuery(
    'source count',
    supabase
      .from('sources')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    { count: 0 }
  );

  const articleCountResult = await safeQuery(
    'article count',
    supabase
      .from('articles')
      .select('*', { count: 'exact', head: true }),
    { count: 0 }
  );

  const todayCountResult = await safeQuery(
    'today article count',
    supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .gte('published_at', startOfDayIso)
      .lte('published_at', nowIso),
    { count: 0 }
  );

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
    sourceCount: Number(activeSourceCountResult?.count || 0),
    articleCount: Number(articleCountResult?.count || 0),
    categories: Number(categoryCount || 0),
    todayCount: Number(todayCountResult?.count || 0),
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
