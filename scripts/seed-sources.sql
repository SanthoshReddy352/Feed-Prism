-- ============================================================
-- Feed Prism — Curated & accredited RSS sources (58 feeds, 12 categories)
-- ============================================================
-- All feeds were live-validated (HTTP 200 + parseable + has items) on
-- 2026-06-28. Aggregators with rotating URLs (e.g. Google News) are excluded
-- in favour of publisher-native feeds so deduplication stays clean.
--
-- Run in the Supabase SQL Editor. Idempotent: re-running updates name/category
-- for existing feeds (matched on rss_url) and adds any new ones.
-- To wipe and reseed from scratch instead, run first:
--   truncate table public.sources cascade;   -- also clears articles/bookmarks
-- ============================================================

insert into public.sources (name, rss_url, category, is_active) values
('Ars Technica','https://feeds.arstechnica.com/arstechnica/index','Technology',true),
('The Verge','https://www.theverge.com/rss/index.xml','Technology',true),
('TechCrunch','https://techcrunch.com/feed/','Technology',true),
('Wired','https://www.wired.com/feed/rss','Technology',true),
('Engadget','https://www.engadget.com/rss.xml','Technology',true),
('Hacker News','https://hnrss.org/frontpage','Technology',true),
('MIT Technology Review','https://www.technologyreview.com/feed/','Technology',true),
('OpenAI Blog','https://openai.com/blog/rss.xml','AI & ML',true),
('Google DeepMind','https://deepmind.google/blog/rss.xml','AI & ML',true),
('Hugging Face Blog','https://huggingface.co/blog/feed.xml','AI & ML',true),
('VentureBeat AI','https://venturebeat.com/category/ai/feed/','AI & ML',true),
('Berkeley BAIR','https://bair.berkeley.edu/blog/feed.xml','AI & ML',true),
('The Gradient','https://thegradient.pub/rss/','AI & ML',true),
('The Decoder','https://the-decoder.com/feed/','AI Tools',true),
('MarkTechPost','https://www.marktechpost.com/feed/','AI Tools',true),
('CNBC Business','https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147','Business',true),
('Forbes Business','https://www.forbes.com/business/feed/','Business',true),
('Fortune','https://fortune.com/feed/','Business',true),
('Business Insider','https://www.businessinsider.com/rss','Business',true),
('Financial Times','https://www.ft.com/rss/home','Business',true),
('AWS News','https://aws.amazon.com/blogs/aws/feed/','Cloud & Infrastructure',true),
('Cloudflare Blog','https://blog.cloudflare.com/rss/','Cloud & Infrastructure',true),
('Google Cloud Blog','https://cloudblog.withgoogle.com/rss/','Cloud & Infrastructure',true),
('Kubernetes Blog','https://kubernetes.io/feed.xml','Cloud & Infrastructure',true),
('Microsoft Azure Blog','https://azure.microsoft.com/en-us/blog/feed/','Cloud & Infrastructure',true),
('Apple Newsroom','https://www.apple.com/newsroom/rss-feed.rss','Company News',true),
('Microsoft Blog','https://blogs.microsoft.com/feed/','Company News',true),
('The Keyword (Google)','https://blog.google/rss/','Company News',true),
('Meta Newsroom','https://about.fb.com/news/feed/','Company News',true),
('NVIDIA Blog','https://blogs.nvidia.com/feed/','Company News',true),
('GitHub Blog','https://github.blog/feed/','Company News',true),
('Netflix Tech Blog','https://netflixtechblog.com/feed','Developer & Engineering',true),
('Stack Overflow Blog','https://stackoverflow.blog/feed/','Developer & Engineering',true),
('Martin Fowler','https://martinfowler.com/feed.atom','Developer & Engineering',true),
('Dev.to','https://dev.to/feed','Developer & Engineering',true),
('GitHub Engineering','https://github.blog/engineering/feed/','Developer & Engineering',true),
('BBC World','https://feeds.bbci.co.uk/news/world/rss.xml','Global News',true),
('NPR News','https://feeds.npr.org/1001/rss.xml','Global News',true),
('Al Jazeera','https://www.aljazeera.com/xml/rss/all.xml','Global News',true),
('The Guardian World','https://www.theguardian.com/world/rss','Global News',true),
('WHO News','https://www.who.int/rss-feeds/news-english.xml','Outbreaks & Health',true),
('STAT News','https://www.statnews.com/feed/','Outbreaks & Health',true),
('NPR Health','https://feeds.npr.org/1128/rss.xml','Outbreaks & Health',true),
('Krebs on Security','https://krebsonsecurity.com/feed/','Security',true),
('BleepingComputer','https://www.bleepingcomputer.com/feed/','Security',true),
('The Hacker News','https://feeds.feedburner.com/TheHackersNews','Security',true),
('Dark Reading','https://www.darkreading.com/rss.xml','Security',true),
('Schneier on Security','https://www.schneier.com/feed/atom/','Security',true),
('SecurityWeek','https://www.securityweek.com/feed/','Security',true),
('YCombinator Blog','https://www.ycombinator.com/blog/rss','Startups',true),
('TechCrunch Startups','https://techcrunch.com/category/startups/feed/','Startups',true),
('Crunchbase News','https://news.crunchbase.com/feed/','Startups',true),
('Product Hunt','https://www.producthunt.com/feed','Startups',true),
('MarketWatch Top Stories','https://feeds.marketwatch.com/marketwatch/topstories/','Stocks & Trading',true),
('Investing.com','https://www.investing.com/rss/news.rss','Stocks & Trading',true),
('Yahoo Finance','https://finance.yahoo.com/news/rssindex','Stocks & Trading',true),
('CNBC Markets','https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258','Stocks & Trading',true),
('Seeking Alpha','https://seekingalpha.com/feed.xml','Stocks & Trading',true)
on conflict (rss_url) do update
  set name = excluded.name,
      category = excluded.category,
      is_active = excluded.is_active;
