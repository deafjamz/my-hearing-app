-- Fix Word Pairs Constraint
-- First, remove duplicates if any exist (optional but safe)
DELETE FROM word_pairs a USING word_pairs b WHERE a.id < b.id AND a.word_1 = b.word_1 AND a.word_2 = b.word_2;

-- Then add the constraint
ALTER TABLE word_pairs ADD CONSTRAINT unique_word_pair UNIQUE (word_1, word_2);

-- Fix Stories Constraint (Pre-emptive)
ALTER TABLE stories ADD CONSTRAINT unique_story_title UNIQUE (title);
