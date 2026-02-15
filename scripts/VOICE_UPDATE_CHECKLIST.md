# Voice Update Checklist

**Use this checklist when adding or modifying voices in the 4-voice system.**

## ✅ Pre-Flight: Voice Selection

Before adding a new voice, verify:

- [ ] F0 is within CI-optimal range (50-200 Hz for target gender)
- [ ] F0 gap from nearest existing voice is >10 Hz (clinically significant)
- [ ] Voice is clear and articulate in ElevenLabs preview
- [ ] Voice has stable quality across different phonemes
- [ ] You have noted the **exact ElevenLabs Voice ID** from the voice library

---

## 📝 Documentation Updates (MANDATORY)

### 1. Update Voice Library (PRIMARY)
**File:** `docs/VOICE_LIBRARY.md`

- [ ] Add voice to "Active Voices" section with full profile
- [ ] Update "Clinical Parameters Matrix" table
- [ ] Calculate and document F0 gaps from other voices
- [ ] Update "Version History" section at bottom
- [ ] Update "Last Updated" timestamp at top

---

### 2. Update Master Rules
**File:** `docs/rules/00_MASTER_RULES.md`

- [ ] Update Section 7 "Active Voices" list with new voice ID
- [ ] Update clinical gaps if voice changes system architecture

---

### 3. Update Generation Script
**File:** `scripts/generate_batch_pilot.py` (lines 42-47)

**Current:**
```python
VOICES = [
    {"name": "sarah", "id": "EXAVITQu4vr4xnSDxMaL", "gender": "female"},
    {"name": "marcus", "id": "TxGEqnHWrfWFTfGW9XjX", "gender": "male"},
    {"name": "emma", "id": "iP95p4xoKVk53GoZ742B", "gender": "female"},
    {"name": "david", "id": "pNInz6obpgDQGcFmaJgB", "gender": "male"}
]
```

**Action:**
- [ ] Add new voice to VOICES array
- [ ] Verify voice ID is correct (404 errors = wrong ID)
- [ ] Ensure name matches database constraints

---

## 🗄️ Database Updates (If Adding New Voice)

### Update User Profiles Constraint
**File:** Create new migration in `sql_migrations/`

```sql
-- Example migration
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS valid_voice_preference;

ALTER TABLE user_profiles
ADD CONSTRAINT valid_voice_preference
CHECK (voice_preference IN ('sarah', 'marcus', 'emma', 'david', 'NEW_VOICE_NAME'));
```

- [ ] Create migration file
- [ ] Run migration on development database
- [ ] Test constraint with invalid voice name
- [ ] Document in `docs/VOICE_LIBRARY.md`

---

## 🎨 Frontend Updates

### Update Voice Selector UI
**File:** `src/pages/Settings.tsx` (or wherever voice selection lives)

**Find:**
```typescript
const AVAILABLE_VOICES = [
  { id: 'sarah', name: 'Sarah', gender: 'female', f0: 171.6 },
  { id: 'marcus', name: 'Marcus', gender: 'male', f0: 144.4 },
  { id: 'emma', name: 'Emma', gender: 'female', f0: 186.9 },
  { id: 'david', name: 'David', gender: 'male', f0: 118.4 },
];
```

- [ ] Add new voice to array
- [ ] Verify display name, gender, and F0
- [ ] Test voice selector renders new option

---

## 🧪 Testing Protocol

### 1. Pilot Generation Test
```bash
cd /Users/clyle/Desktop/my-hearing-app
python3 scripts/generate_batch_pilot.py
```

**Verify:**
- [ ] Script runs without 404 errors
- [ ] 10 word pairs generated (20 words)
- [ ] Files uploaded to Supabase Storage (`audio/words/{voice_name}/`)
- [ ] All files >0.3s duration (no corruption)
- [ ] Files are normalized to -20 LUFS

### 2. Manual Audio Quality Check
- [ ] Download 3-5 random files from Supabase Storage
- [ ] Listen for clipping, distortion, or unnatural pauses
- [ ] Verify carrier phrase has been trimmed correctly
- [ ] Confirm voice matches expected characteristics

### 3. Frontend Integration Test
```bash
npm run dev
```

**Verify:**
- [ ] New voice appears in Settings/voice selector
- [ ] Switching to new voice works without errors
- [ ] Audio files play correctly in RapidFire mode
- [ ] Voice persistence works (refresh page, voice still selected)

### 4. Mobile Device Test (Critical for CI/HA users)
- [ ] Test on actual device or `npm run dev -- --host`
- [ ] Verify audio quality over Bluetooth (if available)
- [ ] Check for clipping or timing issues
- [ ] Confirm Silent Sentinel works (no connection beeps)

---

## 🚀 Production Deployment

### 1. Full Content Generation
**Once pilot is validated, generate all content:**

```bash
# Example - adapt based on your content pipeline
python3 scripts/generate_all_words.py  # All word pairs
python3 scripts/generate_sentences.py   # Sentences (if applicable)
python3 scripts/generate_stories.py     # Stories (if applicable)
```

- [ ] Generate all word pairs for new voice
- [ ] Generate all sentences for new voice (if applicable)
- [ ] Generate all stories for new voice (if applicable)
- [ ] Verify all uploads to Supabase Storage succeeded

### 2. Database Migration
- [ ] Run production migration to update constraints
- [ ] Verify migration succeeded
- [ ] Test constraint on production database

### 3. Frontend Deployment
- [ ] Merge voice updates to main branch
- [ ] Deploy frontend with new voice selector
- [ ] Verify deployment succeeded
- [ ] Test production app with new voice

### 4. User Communication (Optional)
- [ ] Update changelog/release notes
- [ ] Notify existing users of new voice option (if applicable)
- [ ] Update user documentation/help section

---

## 🐛 Troubleshooting

### Voice Not Found (404)
**Symptom:** `{"detail":{"status":"voice_not_found","message":"..."}}`

**Fix:**
1. Log into ElevenLabs dashboard
2. Go to Voice Library
3. Click on voice → Copy Voice ID from URL or settings
4. Update voice ID in `generate_batch_pilot.py`
5. Re-run generation

### Audio Corruption (< 0.3s)
**Symptom:** Files rejected during generation with "Corrupted" message

**Fix:**
1. Check carrier phrase is being used: `"The next word is {TARGET}."`
2. Verify trimming offset: should be `0.95s - 0.05s = 0.90s` start point
3. Try adjusting `carrier_duration` variable if systematic across voice
4. Re-generate individual words if isolated cases

### Voice Sounds Wrong
**Symptom:** Voice quality or pitch differs from ElevenLabs preview

**Fix:**
1. Verify `model_id` is `eleven_turbo_v2_5`
2. Check voice settings: `stability: 0.5, similarity_boost: 0.75, style: 0.0`
3. Test in ElevenLabs playground with carrier phrase before bulk generation
4. Confirm you're using correct voice (not a similar-sounding clone)

---

## 📋 Final Checklist

Before marking voice update as complete:

- [ ] All documentation updated (`VOICE_LIBRARY.md`, `00_MASTER_RULES.md`)
- [ ] Generation script updated and tested
- [ ] Database constraints updated (if new voice)
- [ ] Frontend voice selector updated
- [ ] Pilot generation successful (20 files)
- [ ] Audio quality verified manually
- [ ] Frontend integration tested
- [ ] Mobile device tested (optional but recommended)
- [ ] Full content generated (if production-ready)
- [ ] Production deployment complete (if applicable)

---

**Questions?** See `docs/VOICE_LIBRARY.md` for detailed procedures and troubleshooting.
