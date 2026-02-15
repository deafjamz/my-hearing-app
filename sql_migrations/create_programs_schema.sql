-- =====================================================================
-- PROGRAMS SCHEMA - Clinical Content Organization
-- =====================================================================
-- Purpose: Structure content into curated clinical programs instead
--          of overwhelming lists of 600+ sentences.
--
-- Hierarchy: Programs → Sessions → Items (stimuli)
-- =====================================================================

-- 1. PROGRAMS TABLE
-- Defines clinical programs (e.g., "First Words", "Restaurant Ready")
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic Info
    title TEXT NOT NULL,
    description TEXT,
    short_description TEXT, -- For card previews

    -- Access Control
    tier TEXT NOT NULL CHECK (tier IN ('free', 'tier1', 'tier2')),

    -- Organization
    category TEXT, -- 'phoneme', 'scenario', 'adaptive', 'foundation'
    order_index INT NOT NULL DEFAULT 0, -- Display order

    -- Metadata
    total_sessions INT NOT NULL DEFAULT 0,
    estimated_duration_mins INT, -- Total time to complete program
    difficulty_range TEXT, -- e.g., "1-2", "3-4"

    -- Visual
    icon_name TEXT, -- Lucide icon name
    color_class TEXT, -- Tailwind color class

    -- Status
    is_published BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for efficient tier-based queries
CREATE INDEX idx_programs_tier ON programs(tier);
CREATE INDEX idx_programs_published ON programs(is_published) WHERE is_published = true;
CREATE INDEX idx_programs_order ON programs(order_index);

-- =====================================================================
-- 2. PROGRAM SESSIONS TABLE
-- Defines individual sessions within a program (e.g., "Session 3: Kitchen Sounds")
-- =====================================================================
CREATE TABLE IF NOT EXISTS program_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Program Reference
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,

    -- Session Info
    session_number INT NOT NULL, -- 1, 2, 3... (order within program)
    title TEXT NOT NULL,
    description TEXT, -- "Practice /s/, /t/, /d/ in dining scenarios"

    -- Clinical Focus
    focus_phonemes TEXT[], -- ["/s/", "/t/", "/d/"]
    focus_scenarios TEXT[], -- ["dining", "kitchen"]
    target_difficulty INT, -- 1-5

    -- Metadata
    estimated_duration_mins INT DEFAULT 5,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),

    -- Constraints
    UNIQUE(program_id, session_number)
);

-- Add indexes
CREATE INDEX idx_sessions_program ON program_sessions(program_id);
CREATE INDEX idx_sessions_number ON program_sessions(program_id, session_number);

-- =====================================================================
-- 3. SESSION_ITEMS TABLE
-- Maps individual stimuli to sessions (many-to-many relationship)
-- =====================================================================
CREATE TABLE IF NOT EXISTS session_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    session_id UUID NOT NULL REFERENCES program_sessions(id) ON DELETE CASCADE,
    stimuli_id UUID NOT NULL REFERENCES stimuli_catalog(id) ON DELETE CASCADE,

    -- Ordering
    sequence_order INT NOT NULL, -- Order within session (1, 2, 3...)

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),

    -- Constraints
    UNIQUE(session_id, stimuli_id), -- No duplicate stimuli in a session
    UNIQUE(session_id, sequence_order) -- No duplicate positions
);

-- Add indexes
CREATE INDEX idx_items_session ON session_items(session_id);
CREATE INDEX idx_items_stimuli ON session_items(stimuli_id);
CREATE INDEX idx_items_order ON session_items(session_id, sequence_order);

-- =====================================================================
-- 4. USER_PROGRAM_PROGRESS TABLE
-- Tracks user completion and performance per session
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_program_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES program_sessions(id) ON DELETE CASCADE,

    -- Completion Data
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    accuracy_percent DECIMAL(5,2), -- 0.00 to 100.00
    trials_total INT,
    trials_correct INT,

    -- Performance
    avg_response_time_ms INT,
    snr_level INT, -- SNR used during session

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),

    -- Constraints
    CONSTRAINT unique_user_session UNIQUE(user_id, session_id)
);

-- Add indexes for efficient queries
CREATE INDEX idx_progress_user ON user_program_progress(user_id);
CREATE INDEX idx_progress_program ON user_program_progress(program_id);
CREATE INDEX idx_progress_session ON user_program_progress(session_id);
CREATE INDEX idx_progress_user_program ON user_program_progress(user_id, program_id);

-- =====================================================================
-- 5. SEED DATA - FOUNDATION PROGRAMS
-- =====================================================================

-- PROGRAM 1: "First Words" (Free Tier)
-- Foundation program for new users
INSERT INTO programs (title, description, short_description, tier, category, total_sessions, estimated_duration_mins, difficulty_range, icon_name, color_class, is_published, order_index)
VALUES (
    'First Words',
    'Build confidence with high-frequency phonemes in everyday situations. Perfect for getting started with auditory training.',
    'Foundation training for common sounds',
    'free',
    'foundation',
    8,
    40, -- 8 sessions × 5 mins
    '1-2',
    'Sparkles',
    'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    true,
    1
);

-- PROGRAM 2: "Daily Essentials" (Free Tier)
-- Real-world listening practice
INSERT INTO programs (title, description, short_description, tier, category, total_sessions, estimated_duration_mins, difficulty_range, icon_name, color_class, is_published, order_index)
VALUES (
    'Daily Essentials',
    'Master everyday conversations and common scenarios. Practice listening in the situations you encounter most often.',
    'Real-world listening practice',
    'free',
    'scenario',
    10,
    50, -- 10 sessions × 5 mins
    '1-2',
    'Home',
    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    true,
    2
);

-- PROGRAM 3: "Restaurant Ready" (Tier 1)
-- Dining scenario mastery
INSERT INTO programs (title, description, short_description, tier, category, total_sessions, estimated_duration_mins, difficulty_range, icon_name, color_class, is_published, order_index)
VALUES (
    'Restaurant Ready',
    'Master the challenging acoustic environment of restaurants and cafes. Practice ordering, conversations at the table, and handling noisy settings.',
    'Dining scenarios with noise',
    'tier1',
    'scenario',
    10,
    50,
    '2-4',
    'Coffee',
    'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    true,
    10
);

-- PROGRAM 4: "Plosive Power" (Tier 1)
-- Systematic phoneme training
INSERT INTO programs (title, description, short_description, tier, category, total_sessions, estimated_duration_mins, difficulty_range, icon_name, color_class, is_published, order_index)
VALUES (
    'Plosive Power',
    'Master plosive consonants (/p/, /b/, /t/, /d/, /k/, /g/) through systematic discrimination and identification exercises.',
    'Master stop consonants',
    'tier1',
    'phoneme',
    10,
    50,
    '2-3',
    'Zap',
    'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    true,
    11
);

-- PROGRAM 5: "Social Butterfly" (Tier 1)
-- Social scenarios
INSERT INTO programs (title, description, short_description, tier, category, total_sessions, estimated_duration_mins, difficulty_range, icon_name, color_class, is_published, order_index)
VALUES (
    'Social Butterfly',
    'Build confidence in social situations: greetings, small talk, group conversations, and events. Practice the language of connection.',
    'Social interactions & conversations',
    'tier1',
    'scenario',
    8,
    40,
    '2-4',
    'Users',
    'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    true,
    12
);

-- =====================================================================
-- 6. SEED SESSIONS - "First Words" Program
-- =====================================================================

-- Get First Words program ID
DO $$
DECLARE
    first_words_id UUID;
BEGIN
    SELECT id INTO first_words_id FROM programs WHERE title = 'First Words';

    -- Session 1: Bilabial Basics (/b/, /p/, /m/)
    INSERT INTO program_sessions (program_id, session_number, title, description, focus_phonemes, focus_scenarios, target_difficulty, estimated_duration_mins)
    VALUES (
        first_words_id, 1,
        'Bilabial Basics',
        'Practice distinguishing /b/, /p/, and /m/ sounds in daily life contexts',
        ARRAY['/b/', '/p/', '/m/'],
        ARRAY['Daily Life'],
        1,
        5
    );

    -- Session 2: Sibilant Start (/s/, /z/)
    INSERT INTO program_sessions (program_id, session_number, title, description, focus_phonemes, focus_scenarios, target_difficulty, estimated_duration_mins)
    VALUES (
        first_words_id, 2,
        'Sibilant Start',
        'Focus on /s/ and /z/ sounds in common phrases',
        ARRAY['/s/', '/z/'],
        ARRAY['Daily Life'],
        1,
        5
    );

    -- Session 3: Kitchen Sounds (/t/, /d/)
    INSERT INTO program_sessions (program_id, session_number, title, description, focus_phonemes, focus_scenarios, target_difficulty, estimated_duration_mins)
    VALUES (
        first_words_id, 3,
        'Kitchen Sounds',
        'Practice /t/ and /d/ in dining scenarios',
        ARRAY['/t/', '/d/'],
        ARRAY['Dining'],
        1,
        5
    );

    -- Session 4: Velar Voice (/k/, /g/)
    INSERT INTO program_sessions (program_id, session_number, title, description, focus_phonemes, focus_scenarios, target_difficulty, estimated_duration_mins)
    VALUES (
        first_words_id, 4,
        'Velar Voice',
        'Master /k/ and /g/ sounds in outdoor contexts',
        ARRAY['/k/', '/g/'],
        ARRAY['Outdoors'],
        2,
        5
    );

    -- Session 5: Fricative Flow (/f/, /v/)
    INSERT INTO program_sessions (program_id, session_number, title, description, focus_phonemes, focus_scenarios, target_difficulty, estimated_duration_mins)
    VALUES (
        first_words_id, 5,
        'Fricative Flow',
        'Practice /f/ and /v/ distinctions',
        ARRAY['/f/', '/v/'],
        ARRAY['Daily Life'],
        2,
        5
    );

    -- Session 6: Liquid Listening (/l/, /r/)
    INSERT INTO program_sessions (program_id, session_number, title, description, focus_phonemes, focus_scenarios, target_difficulty, estimated_duration_mins)
    VALUES (
        first_words_id, 6,
        'Liquid Listening',
        'Focus on /l/ and /r/ in various scenarios',
        ARRAY['/l/', '/r/'],
        ARRAY['Daily Life'],
        2,
        5
    );

    -- Session 7: Mixed Review Part 1
    INSERT INTO program_sessions (program_id, session_number, title, description, focus_phonemes, focus_scenarios, target_difficulty, estimated_duration_mins)
    VALUES (
        first_words_id, 7,
        'Mixed Review Part 1',
        'Combine multiple phonemes for integrated practice',
        ARRAY['/b/', '/p/', '/m/', '/s/', '/t/', '/d/'],
        ARRAY['Daily Life', 'Dining'],
        2,
        5
    );

    -- Session 8: Mixed Review Part 2
    INSERT INTO program_sessions (program_id, session_number, title, description, focus_phonemes, focus_scenarios, target_difficulty, estimated_duration_mins)
    VALUES (
        first_words_id, 8,
        'Mixed Review Part 2',
        'Final integration of all learned phonemes',
        ARRAY['/k/', '/g/', '/f/', '/v/', '/l/', '/r/'],
        ARRAY['Daily Life', 'Outdoors'],
        2,
        5
    );
END $$;

-- =====================================================================
-- 7. HELPER VIEWS
-- =====================================================================

-- View: Program overview with completion stats per user
CREATE OR REPLACE VIEW program_overview AS
SELECT
    p.id AS program_id,
    p.title,
    p.tier,
    p.category,
    p.total_sessions,
    p.is_published,
    COUNT(DISTINCT ps.id) AS sessions_count
FROM programs p
LEFT JOIN program_sessions ps ON p.id = ps.program_id
GROUP BY p.id, p.title, p.tier, p.category, p.total_sessions, p.is_published;

-- View: User program progress summary
CREATE OR REPLACE VIEW user_program_summary AS
SELECT
    upp.user_id,
    upp.program_id,
    p.title AS program_title,
    COUNT(DISTINCT upp.session_id) AS completed_sessions,
    p.total_sessions,
    ROUND((COUNT(DISTINCT upp.session_id)::DECIMAL / NULLIF(p.total_sessions, 0)) * 100, 2) AS completion_percent,
    AVG(upp.accuracy_percent) AS avg_accuracy,
    MAX(upp.completed_at) AS last_completed_at
FROM user_program_progress upp
JOIN programs p ON upp.program_id = p.id
GROUP BY upp.user_id, upp.program_id, p.title, p.total_sessions;

-- =====================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Enable RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_program_progress ENABLE ROW LEVEL SECURITY;

-- Programs: Anyone can read published programs
CREATE POLICY "Anyone can view published programs"
    ON programs FOR SELECT
    USING (is_published = true);

-- Sessions: Anyone can read sessions for published programs
CREATE POLICY "Anyone can view sessions for published programs"
    ON program_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM programs
            WHERE programs.id = program_sessions.program_id
            AND programs.is_published = true
        )
    );

-- Session Items: Anyone can read items for published programs
CREATE POLICY "Anyone can view session items for published programs"
    ON session_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM program_sessions ps
            JOIN programs p ON ps.program_id = p.id
            WHERE ps.id = session_items.session_id
            AND p.is_published = true
        )
    );

-- User Progress: Users can only see their own progress
CREATE POLICY "Users can view own progress"
    ON user_program_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
    ON user_program_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
    ON user_program_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================================
-- 9. FUNCTIONS
-- =====================================================================

-- Function: Get next recommended session for a user in a program
CREATE OR REPLACE FUNCTION get_next_session(
    p_user_id UUID,
    p_program_id UUID
)
RETURNS TABLE (
    session_id UUID,
    session_number INT,
    title TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ps.id,
        ps.session_number,
        ps.title,
        ps.description
    FROM program_sessions ps
    WHERE ps.program_id = p_program_id
    AND NOT EXISTS (
        SELECT 1 FROM user_program_progress upp
        WHERE upp.user_id = p_user_id
        AND upp.session_id = ps.id
    )
    ORDER BY ps.session_number
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================

COMMENT ON TABLE programs IS 'Clinical programs containing structured learning sessions';
COMMENT ON TABLE program_sessions IS 'Individual sessions within a program (8-12 sentences each)';
COMMENT ON TABLE session_items IS 'Maps stimuli to sessions for curated content delivery';
COMMENT ON TABLE user_program_progress IS 'Tracks user completion and performance per session';
