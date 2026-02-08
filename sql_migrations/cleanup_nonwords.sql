-- F-009 Word List Scrub: Remove non-words and replace with real-word pairs
-- Run AFTER sync_db.py to clean up orphaned rows from old non-word pairs
-- Date: 2026-02-07

-- Delete old pairs that contained non-words (replaced in CSV)
DELETE FROM word_pairs WHERE word_1 = 'map' AND word_2 = 'bap';
DELETE FROM word_pairs WHERE word_1 = 'sun' AND word_2 = 'sud';
DELETE FROM word_pairs WHERE word_1 = 'talk' AND word_2 = 'calk';
DELETE FROM word_pairs WHERE word_1 = 'team' AND word_2 = 'keem';
DELETE FROM word_pairs WHERE word_1 = 'fast' AND word_2 = 'fas';
DELETE FROM word_pairs WHERE word_1 = 'hand' AND word_2 = 'han';
DELETE FROM word_pairs WHERE word_1 = 'soft' AND word_2 = 'sof';
DELETE FROM word_pairs WHERE word_1 = 'send' AND word_2 = 'sen';
DELETE FROM word_pairs WHERE word_1 = 'help' AND word_2 = 'hep';
DELETE FROM word_pairs WHERE word_1 = 'yesterday' AND word_2 = 'ester-day';
DELETE FROM word_pairs WHERE word_1 = 'happy' AND word_2 = 'pappy';

-- Verify: should show 0 rows with non-words
SELECT word_1, word_2 FROM word_pairs
WHERE word_2 IN ('bap', 'sud', 'calk', 'keem', 'fas', 'han', 'sof', 'sen', 'hep', 'ester-day', 'pappy');

-- Verify: new pairs should exist (inserted by sync_db.py)
SELECT word_1, word_2, clinical_category FROM word_pairs
WHERE word_2 IN ('bat', 'bud', 'caulk', 'keen', 'miss', 'fun', 'lot', 'kin', 'yell', 'Saturday', 'snappy')
ORDER BY clinical_category;
