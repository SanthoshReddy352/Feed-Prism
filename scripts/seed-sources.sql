-- ============================================================
-- Feed Prism — Extended Seed RSS Sources (v2)
-- Run this in Supabase SQL Editor AFTER schema.sql
-- If you already ran the old seed, just run the NEW SOURCES
-- section below (marked clearly).
-- ============================================================

-- ============================================================
-- CLEAR OLD DATA & RESEED (only if starting fresh)
-- Uncomment the next line to wipe and reseed:
-- truncate public.sources cascade;
-- ============================================================

-- ============================
-- CORE TECH MEDIA
-- ============================
insert into public.sources (name, rss_url, category) values
    ('TechCrunch', 'https://techcrunch.com/feed/', 'Technology'),
    ('The Verge', 'https://www.theverge.com/rss/index.xml', 'Technology'),
    ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'Technology'),
    ('Wired', 'https://www.wired.com/feed/rss', 'Technology'),
    ('MIT Technology Review', 'https://www.technologyreview.com/feed/', 'Technology'),
    ('VentureBeat', 'https://venturebeat.com/feed/', 'Technology')
on conflict (rss_url) do nothing;

-- ============================
-- AI & RESEARCH
-- ============================
insert into public.sources (name, rss_url, category) values
    ('OpenAI Blog', 'https://openai.com/blog/rss.xml', 'AI & ML'),
    ('Google DeepMind Blog', 'https://blog.research.google/feeds/posts/default?alt=rss', 'AI & ML'),
    ('Anthropic Blog', 'https://www.anthropic.com/feed.xml', 'AI & ML'),
    ('Meta AI Research', 'https://ai.meta.com/blog/rss/', 'AI & ML'),
    ('Hugging Face Blog', 'https://huggingface.co/blog/feed.xml', 'AI & ML'),
    ('arXiv AI', 'https://rss.arxiv.org/rss/cs.AI', 'AI & ML'),
    ('Papers with Code', 'https://paperswithcode.com/latest/rss', 'AI & ML')
on conflict (rss_url) do nothing;

-- ============================
-- CYBERSECURITY & OUTBREAKS
-- ============================
insert into public.sources (name, rss_url, category) values
    ('BleepingComputer', 'https://www.bleepingcomputer.com/feed/', 'Security'),
    ('The Hacker News', 'https://feeds.feedburner.com/TheHackersNews', 'Security'),
    ('Krebs on Security', 'https://krebsonsecurity.com/feed/', 'Security'),
    ('Dark Reading', 'https://www.darkreading.com/rss.xml', 'Security'),
    ('WHO News', 'https://www.who.int/rss-feeds/news-english.xml', 'Outbreaks & Health'),
    ('CDC Newsroom', 'https://tools.cdc.gov/api/v2/resources/media/rss', 'Outbreaks & Health')
on conflict (rss_url) do nothing;

-- ============================
-- BIG COMPANY OFFICIAL SOURCES
-- ============================
insert into public.sources (name, rss_url, category) values
    ('Google Official Blog', 'https://blog.google/rss/', 'Company News'),
    ('Meta Newsroom', 'https://about.fb.com/news/feed/', 'Company News'),
    ('Microsoft Blog', 'https://blogs.microsoft.com/feed/', 'Company News'),
    ('Amazon Press Center', 'https://press.aboutamazon.com/rss/news-releases/', 'Company News'),
    ('Apple Newsroom', 'https://www.apple.com/newsroom/rss-feed.rss', 'Company News'),
    ('NVIDIA Blog', 'https://blogs.nvidia.com/feed/', 'Company News')
on conflict (rss_url) do nothing;

-- ============================
-- CLOUD / INFRASTRUCTURE STATUS
-- ============================
insert into public.sources (name, rss_url, category) values
    ('Google Cloud Status', 'https://status.cloud.google.com/feed.atom', 'Cloud & Infrastructure'),
    ('AWS Status', 'https://status.aws.amazon.com/rss/all.rss', 'Cloud & Infrastructure'),
    ('Azure Status', 'https://azure.status.microsoft/en-us/status/feed/', 'Cloud & Infrastructure'),
    ('Cloudflare Status', 'https://www.cloudflarestatus.com/history.atom', 'Cloud & Infrastructure')
on conflict (rss_url) do nothing;

-- ============================
-- DEVELOPER & ENGINEERING BLOGS
-- ============================
insert into public.sources (name, rss_url, category) values
    ('Netflix Tech Blog', 'https://netflixtechblog.com/feed', 'Developer & Engineering'),
    ('Uber Engineering', 'https://www.uber.com/en-US/blog/engineering/rss/', 'Developer & Engineering'),
    ('Airbnb Engineering', 'https://medium.com/feed/airbnb-engineering', 'Developer & Engineering'),
    ('Stripe Engineering', 'https://stripe.com/blog/feed.rss', 'Developer & Engineering'),
    ('GitHub Blog', 'https://github.blog/feed/', 'Developer & Engineering')
on conflict (rss_url) do nothing;

-- ============================
-- GLOBAL NEWS
-- ============================
insert into public.sources (name, rss_url, category) values
    ('BBC World', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'Global News'),
    ('Reuters World', 'https://www.reutersagency.com/feed/', 'Global News'),
    ('Al Jazeera', 'https://www.aljazeera.com/xml/rss/all.xml', 'Global News'),
    ('NPR News', 'https://feeds.npr.org/1001/rss.xml', 'Global News')
on conflict (rss_url) do nothing;

-- ============================
-- STARTUPS & LAUNCHES
-- ============================
insert into public.sources (name, rss_url, category) values
    ('YCombinator Blog', 'https://www.ycombinator.com/blog/rss/', 'Startups'),
    ('First Round Review', 'https://review.firstround.com/feed.xml', 'Startups'),
    ('Product Hunt', 'https://www.producthunt.com/feed', 'Startups'),
    ('Hacker News', 'https://hnrss.org/frontpage', 'Startups')
on conflict (rss_url) do nothing;

-- ============================
-- AI TOOLS (NEW - Fixed)
-- ============================
insert into public.sources (name, rss_url, category) values
    ('Unite.AI - AI News & Tools', 'https://www.unite.ai/feed/', 'AI Tools'),
    ('MarkTechPost - AI Tools', 'https://www.marktechpost.com/feed/', 'AI Tools'),
    ('Google News - AI Tools', 'https://news.google.com/rss/search?q="AI+Tools"+when:7d&hl=en-US&gl=US&ceid=US:en', 'AI Tools')
on conflict (rss_url) do nothing;

-- ============================
-- BUSINESS (NEW)
-- ============================
insert into public.sources (name, rss_url, category) values
    ('Bloomberg Business', 'https://feeds.bloomberg.com/business/news.rss', 'Business'),
    ('CNBC Business', 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrrss01&id=10001147', 'Business'),
    ('Forbes Business', 'https://www.forbes.com/business/feed/', 'Business'),
    ('Financial Times - Business', 'https://www.ft.com/business-education?format=rss', 'Business')
on conflict (rss_url) do nothing;

-- ============================
-- STOCKS & TRADING (NEW)
-- ============================
insert into public.sources (name, rss_url, category) values
    ('Yahoo Finance - Stock Market', 'https://finance.yahoo.com/news/rssindex', 'Stocks & Trading'),
    ('MarketWatch - Top Stories', 'http://feeds.marketwatch.com/marketwatch/topstories/', 'Stocks & Trading'),
    ('Investing.com - Stock Market', 'https://www.investing.com/rss/stock_Market_News.rss', 'Stocks & Trading'),
    ('Seeking Alpha - Market News', 'https://seekingalpha.com/feed.xml', 'Stocks & Trading')
on conflict (rss_url) do nothing;

-- ============================================================
-- DONE! ~60 RSS sources seeded across 12 categories.
-- ============================================================
