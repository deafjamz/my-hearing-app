-- =====================================================================
-- Update Session Titles to User-Friendly Names
-- =====================================================================
-- Replace technical phonetic terms with accessible, inviting titles
-- that everyday users can understand and relate to

DO $$
DECLARE
    first_words_id UUID;
BEGIN
    SELECT id INTO first_words_id FROM programs WHERE title = 'First Words';

    -- Session 1: Bilabial Basics → B, P & M Sounds
    UPDATE program_sessions
    SET
        title = 'B, P & M Sounds',
        description = 'Practice listening to B, P, and M sounds in everyday words'
    WHERE program_id = first_words_id AND session_number = 1;

    -- Session 2: Sibilant Start → S & Z Sounds
    UPDATE program_sessions
    SET
        title = 'S & Z Sounds',
        description = 'Focus on S and Z sounds in common phrases'
    WHERE program_id = first_words_id AND session_number = 2;

    -- Session 3: Kitchen Sounds (Already good!)
    UPDATE program_sessions
    SET
        title = 'T & D Sounds',
        description = 'Practice T and D sounds in dining scenarios'
    WHERE program_id = first_words_id AND session_number = 3;

    -- Session 4: Velar Voice → K & G Sounds
    UPDATE program_sessions
    SET
        title = 'K & G Sounds',
        description = 'Master K and G sounds in outdoor contexts'
    WHERE program_id = first_words_id AND session_number = 4;

    -- Session 5: Fricative Flow → F & V Sounds
    UPDATE program_sessions
    SET
        title = 'F & V Sounds',
        description = 'Practice telling apart F and V sounds'
    WHERE program_id = first_words_id AND session_number = 5;

    -- Session 6: Liquid Listening → L & R Sounds
    UPDATE program_sessions
    SET
        title = 'L & R Sounds',
        description = 'Focus on L and R sounds in various situations'
    WHERE program_id = first_words_id AND session_number = 6;

    -- Session 7: Mixed Review Part 1 → Practice Mix 1
    UPDATE program_sessions
    SET
        title = 'Practice Mix 1',
        description = 'Combine multiple sounds for integrated practice'
    WHERE program_id = first_words_id AND session_number = 7;

    -- Session 8: Mixed Review Part 2 → Practice Mix 2
    UPDATE program_sessions
    SET
        title = 'Practice Mix 2',
        description = 'Final integration of all the sounds you learned'
    WHERE program_id = first_words_id AND session_number = 8;

END $$;

-- Verify the updates
SELECT session_number, title, description
FROM program_sessions
WHERE program_id = (SELECT id FROM programs WHERE title = 'First Words')
ORDER BY session_number;
