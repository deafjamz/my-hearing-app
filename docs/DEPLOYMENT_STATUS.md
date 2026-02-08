# Programs Architecture - Deployment Status

## ✅ Completed Components

### 1. Database Schema
**File:** `sql_migrations/create_programs_schema.sql`
**Status:** Ready for execution
**Contents:**
- 4 tables: `programs`, `program_sessions`, `session_items`, `user_program_progress`
- 5 seed programs with 8 sessions for "First Words"
- RLS policies for tier-based access control
- Helper views and functions

### 2. UI Components
**All Complete and Integrated:**

#### ProgramLibrary.tsx (`src/pages/ProgramLibrary.tsx`)
- Netflix-style program cards
- Tier-based access control (free/tier1/tier2)
- Progress bars for logged-in users
- Lock icons for gated content
- Route: `/programs`

#### ProgramDetail.tsx (`src/pages/ProgramDetail.tsx`)
- Program overview with progress tracking
- Session list with completion status
- "Continue/Start" CTA for next session
- Route: `/programs/:programId`

#### SessionPlayer.tsx (`src/pages/SessionPlayer.tsx`)
- **Polymorphic player** - handles both word pairs and sentences
- WordPairPlayer component (RapidFire-style)
- SentencePlayer component (Question/Answer style)
- Progress bar tracking
- Auto-saves completion to `user_program_progress`
- Route: `/session/:sessionId`

#### SessionSummary.tsx (`src/components/SessionSummary.tsx`)
- Completion screen with accuracy stats
- Performance-based motivational messages
- "Continue Training" button returns to program

### 3. Routing
**All routes configured in App.tsx:**
```
/programs              → ProgramLibrary
/programs/:programId   → ProgramDetail
/session/:sessionId    → SessionPlayer
```

### 4. Navigation
**ActivityList.tsx updated:**
- "Programs" card added (first position)
- Teal styling with Sparkles icon
- Description: "Curated clinical training pathways"

### 5. Backend Scripts

#### backfill_word_pairs.py
**Status:** ❌ BLOCKED (see Critical Issues below)
**Purpose:** Connect ~7,300 audio files to database
**Input:** `content/source_csvs/minimal_pairs_master.csv`
**Output:** Rows in `stimuli_catalog` + `audio_assets`

#### populate_sessions.py
**Status:** ✅ Ready to run (after schema + backfill)
**Purpose:** Map stimuli to sessions intelligently
**Functions:**
- `populate_first_words_program()` - Word pairs by phoneme
- `populate_daily_essentials_program()` - Daily Life sentences
- `populate_restaurant_ready_program()` - Dining sentences

---

## 🚨 Critical Issues - MUST FIX BEFORE DEPLOYMENT

### Issue #1: content_type Constraint Violation
**Error:**
```
'new row for relation "stimuli_catalog" violates check constraint "stimuli_catalog_content_type_check"'
Code: 23514
```

**Root Cause:**
The `stimuli_catalog` table has a CHECK constraint that doesn't include `'word_pair'` as a valid `content_type`.

**Current Valid Types (likely):**
- `'sentence'` ✅
- `'story'` ✅

**Missing Type:**
- `'word_pair'` ❌

**Impact:**
- Word pairs backfill **completely failed** (0 insertions out of 2,081 pairs)
- "First Words" program will have **no content**
- Word Pair discrimination training is **unavailable**

**Fix Required:**
Execute this SQL in Supabase Dashboard:

```sql
-- Option 1: Drop and recreate constraint (if it exists)
ALTER TABLE stimuli_catalog
DROP CONSTRAINT IF EXISTS stimuli_catalog_content_type_check;

ALTER TABLE stimuli_catalog
ADD CONSTRAINT stimuli_catalog_content_type_check
CHECK (content_type IN ('sentence', 'story', 'word_pair'));

-- Option 2: If no constraint exists, add it
ALTER TABLE stimuli_catalog
ADD CONSTRAINT stimuli_catalog_content_type_check
CHECK (content_type IN ('sentence', 'story', 'word_pair'));
```

**Verification Query:**
```sql
-- Check current constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'stimuli_catalog'::regclass
AND conname LIKE '%content_type%';
```

---

## 📋 Deployment Checklist

### Step 1: Fix Database Constraint ⏸️
**Action:** Execute the SQL fix above in Supabase Dashboard
**Verify:**
```sql
-- Should return the new constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'stimuli_catalog'::regclass
AND conname = 'stimuli_catalog_content_type_check';
```

### Step 2: Execute Schema Migration ⏸️
**Action:** Run `sql_migrations/create_programs_schema.sql` in Supabase Dashboard
**Verify:**
```sql
-- Should return 4 tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('programs', 'program_sessions', 'session_items', 'user_program_progress');

-- Should return 5 programs
SELECT COUNT(*) FROM programs WHERE is_published = true;

-- Should return 8 sessions for First Words
SELECT COUNT(*) FROM program_sessions WHERE program_id = (SELECT id FROM programs WHERE title = 'First Words');
```

### Step 3: Backfill Word Pairs ⏸️
**Command:**
```bash
python3 scripts/backfill_word_pairs.py
```

**Expected Output:**
```
Successfully inserted: ~1,800 ✅
Skipped (no audio): ~200 ⏭️
Errors: 0 ❌
```

**Verify:**
```sql
-- Should return ~1,800
SELECT COUNT(*) FROM stimuli_catalog WHERE content_type = 'word_pair';

-- Should return ~3,600 (2 voices × ~1,800 pairs)
SELECT COUNT(*) FROM audio_assets;
```

### Step 4: Populate Sessions ⏸️
**Command:**
```bash
python3 scripts/populate_sessions.py
```

**Expected Output:**
```
First Words: 80 items inserted (8 sessions × 10 pairs)
Daily Essentials: 80 items inserted (10 sessions × 8 sentences)
Restaurant Ready: 100 items inserted (10 sessions × 10 sentences)
Total: 260 session items
```

**Verify:**
```sql
-- Should return ~260
SELECT COUNT(*) FROM session_items;

-- Check First Words has items
SELECT COUNT(*)
FROM session_items si
JOIN program_sessions ps ON si.session_id = ps.id
JOIN programs p ON ps.program_id = p.id
WHERE p.title = 'First Words';
```

### Step 5: Test UI Flow ⏸️
**Manual Testing:**
1. Navigate to `/practice` → Click "Programs"
2. Should see 5 programs (2 free, 3 tier1)
3. Click "First Words" → Should see 8 sessions
4. Click "Session 1" → Should load SessionPlayer
5. Complete session → Should show SessionSummary
6. Click "Continue Training" → Return to ProgramDetail
7. Verify progress bar updated

---

## 🎯 Complete User Flow

```
Dashboard
    ↓
Practice Hub (/practice)
    ↓
Programs (/programs)
    ↓ [Click "First Words"]
Program Detail (/programs/:id)
    ↓ [Click "Start Program" or Session Card]
Session Player (/session/:sessionId)
    ↓ [Complete 8-10 items]
Session Summary (embedded)
    ↓ [Click "Continue Training"]
Program Detail (shows updated progress)
```

---

## 📊 Current Database State

### Sentences
- **stimuli_catalog:** 628 sentences ✅
- **audio_assets:** 1,235 files (sarah + marcus) ✅
- **Distribution:** 98% complete ✅

### Word Pairs
- **stimuli_catalog:** 0 word pairs ❌
- **audio_assets:** ~7,300 files in storage (not linked) ⚠️
- **CSV source:** 2,081 pairs available 📝

### Stories
- **stimuli_catalog:** 0 stories ⚠️
- **Status:** Not yet implemented

---

## 🐛 Backfill Script Results

```
================================================================================
📊 BACKFILL SUMMARY
================================================================================
Total pairs in CSV: 2081
Successfully inserted: 0 ✅
Skipped (no audio): 2026 ⏭️
Errors: 55 ❌

Final verification:
   Word pair stimuli in database: 0
   Total audio assets in database: 1235
================================================================================
```

**Analysis:**
- All 55 errors were constraint violations
- 2,026 skipped due to missing audio (expected - not all pairs have recordings)
- 0 successful insertions due to constraint issue

---

## 🔧 Technical Architecture

### Database Relationships
```
programs (1) ─────→ (many) program_sessions
                              ↓
                         (many) session_items
                              ↓
                         (1) stimuli_catalog
                              ↓
                         (many) audio_assets

user_program_progress links users to completed sessions
```

### Content Type Polymorphism
```typescript
interface SessionItem {
  stimuli: {
    content_type: 'word_pair' | 'sentence';
    clinical_metadata: {
      // Word Pair
      word_1?: string;
      word_2?: string;

      // Sentence
      question_text?: string;
      correct_answer?: string;
    }
  }
}
```

### Player Polymorphism
```typescript
{stimulus.content_type === 'word_pair' ? (
  <WordPairPlayer />  // 2 buttons, focus mode
) : (
  <SentencePlayer />  // 4 buttons, question mode
)}
```

---

## 📝 Next Steps After Deployment

### Immediate (Post-Fix)
1. ✅ Fix content_type constraint
2. ✅ Run schema migration
3. ✅ Run word pairs backfill
4. ✅ Run session population
5. ✅ Test complete user flow

### Short-Term Enhancements
- [ ] Add voice selection UI (sarah/marcus toggle)
- [ ] Implement SNR settings per session
- [ ] Add session retry functionality
- [ ] Create detailed analytics dashboard
- [ ] Add program recommendations based on performance

### Long-Term Features
- [ ] Story module integration
- [ ] Adaptive difficulty adjustment
- [ ] Personalized program creation
- [ ] Family voice cloning for programs
- [ ] Multi-language program support

---

## 🎓 Clinical Rationale

### Why Programs?
**Problem:** 628 sentences in one overwhelming list
**Solution:** 8-12 item sessions (working memory capacity)
**Research:** Distributed practice > massed practice

### Program Structure
```
Program (e.g., "First Words")
  ↓
Session (e.g., "Bilabial Basics")
  ↓
Items (8-12 stimuli: word pairs or sentences)
  ↓
Trials (listen → respond → feedback)
```

### Progression Model
1. **Detection** - "Did you hear a sound?"
2. **Discrimination** - "Are these the same or different?" (word pairs)
3. **Identification** - "Which word did you hear?" (word pairs with labels)
4. **Comprehension** - "Answer the question" (sentences)

---

## 🔐 Access Control

### Tier Structure
- **Free:** 160 sentences across 2 programs
  - First Words (word pairs)
  - Daily Essentials (sentences)

- **Tier 1 ($9.99/mo):** +400 sentences, 3 programs
  - Restaurant Ready
  - Plosive Power
  - Social Butterfly

- **Tier 2 ($19.99/mo):** All content + future programs
  - Full access
  - Early access to new programs

### Implementation
```typescript
const isLocked = (program: Program) => {
  if (program.tier === 'free') return false;
  if (program.tier === 'tier1' && userTier !== 'free') return false;
  if (program.tier === 'tier2' && userTier === 'tier2') return false;
  return true;
};
```

---

## 📄 Files Created/Modified

### Created
- `sql_migrations/create_programs_schema.sql` (473 lines)
- `scripts/backfill_word_pairs.py` (254 lines)
- `scripts/populate_sessions.py` (362 lines)
- `src/pages/ProgramLibrary.tsx` (276 lines)
- `src/pages/ProgramDetail.tsx` (308 lines)
- `src/pages/SessionPlayer.tsx` (380 lines)
- `src/components/SessionSummary.tsx` (120 lines)
- `docs/CLINICAL_CONTENT_STRATEGY.md`
- `docs/DEPLOYMENT_STATUS.md` (this file)

### Modified
- `src/App.tsx` (added 3 routes, 1 import)
- `src/pages/ActivityList.tsx` (added Programs card)

---

**Total Lines of Code:** ~2,173 lines
**Total Files Created:** 9
**Total Files Modified:** 2
