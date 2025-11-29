-- Add unique constraint to word_pairs
ALTER TABLE word_pairs
ADD CONSTRAINT unique_word_pair UNIQUE (word_1, word_2);
