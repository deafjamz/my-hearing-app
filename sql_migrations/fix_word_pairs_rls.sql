-- Fix RLS policies for public content tables
-- Enable RLS but allow ANONYMOUS (anon) and AUTHENTICATED users to read

-- 1. WORD PAIRS - Enable RLS with public read policy
ALTER TABLE public.word_pairs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.word_pairs;
CREATE POLICY "Public Read Access"
  ON public.word_pairs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. SCENARIOS - Enable RLS with public read policy
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.scenarios;
CREATE POLICY "Public Read Access"
  ON public.scenarios
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. SENTENCES - Enable RLS with public read policy
ALTER TABLE public.sentences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.sentences;
CREATE POLICY "Public Read Access"
  ON public.sentences
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4. STORIES - Enable RLS with public read policy
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.stories;
CREATE POLICY "Public Read Access"
  ON public.stories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. STORY QUESTIONS - Enable RLS with public read policy
ALTER TABLE public.story_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.story_questions;
CREATE POLICY "Public Read Access"
  ON public.story_questions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 6. NOISE ASSETS - Enable RLS with public read policy
ALTER TABLE public.noise_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.noise_assets;
CREATE POLICY "Public Read Access"
  ON public.noise_assets
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Verify data exists
SELECT 'word_pairs' as table_name, count(*) as row_count FROM public.word_pairs
UNION ALL
SELECT 'scenarios', count(*) FROM public.scenarios
UNION ALL
SELECT 'sentences', count(*) FROM public.sentences
UNION ALL
SELECT 'stories', count(*) FROM public.stories
UNION ALL
SELECT 'story_questions', count(*) FROM public.story_questions
UNION ALL
SELECT 'noise_assets', count(*) FROM public.noise_assets;

-- Keep RLS enabled on user-specific tables
-- (profiles, user_progress should remain protected with user-specific policies)
