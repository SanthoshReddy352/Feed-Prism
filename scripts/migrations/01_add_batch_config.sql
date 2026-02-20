
-- Add batch configuration columns
ALTER TABLE public.sources 
ADD COLUMN IF NOT EXISTS fetch_full_content BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS batch_weight INT DEFAULT 1;

-- Configure Hugging Face Blog (Heavy, needs scraping)
UPDATE public.sources 
SET fetch_full_content = true, batch_weight = 10 
WHERE name = 'Hugging Face Blog';

-- Configure Hacker News (Heavy due to many links, needs scraping)
UPDATE public.sources 
SET fetch_full_content = true, batch_weight = 10 
WHERE name = 'Hacker News';

-- Configure other potential sparse feeds if needed (optional)
-- UPDATE public.sources SET fetch_full_content = true, batch_weight = 5 WHERE name = 'Some Other Sparse Feed';
