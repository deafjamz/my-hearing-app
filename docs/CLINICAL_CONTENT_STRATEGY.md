# Clinical Content Strategy
**Premier Aural Rehabilitation Structure**

---

## 📊 Current Content Inventory

### ✅ Validated Assets (As of 2025-12-02)

**Sentences: 628 stimuli**
- Storage: 1,235 audio files (98% complete)
- Sarah: 618 files | Marcus: 617 files
- Database: 1,000 audio_assets records

**Distribution:**
- Level 1 (Foundation): 86 sentences (14%)
- Level 2 (Building): 228 sentences (36%)
- Level 3 (Advancing): 204 sentences (32%)
- Level 4 (Mastery): 94 sentences (15%)
- Level 5 (Expert): 16 sentences (3%)

**Scenarios:**
- Daily Life: 302 sentences
- Outdoors: 146 sentences
- Dining: 102 sentences
- Social: 78 sentences

**Phoneme Coverage:** 15+ phonemes with 13-50 sentences each

---

## 🎯 Clinical Best Practices Framework

### Aural Rehab Hierarchy (Erber's Model)

```
Level 1: DETECTION      → "Did you hear something?"
Level 2: DISCRIMINATION → "Are these the same or different?"
Level 3: IDENTIFICATION → "Which word did you hear?"
Level 4: COMPREHENSION  → "What does this mean?"
```

### Our Implementation

**Word Pairs** → Erber Level 2-3 (Discrimination + Identification)
**Sentences** → Erber Level 4 (Comprehension with Q&A)
**Stories** → Erber Level 4+ (Advanced Comprehension)

---

## 🏗️ Premier Content Architecture

### **The "Program" Model (Not Lists)**

Instead of overwhelming 600+ sentence lists, we structure content into **curated clinical programs** of 8-12 sessions each.

---

## 🆓 FREE TIER - "Foundation Programs"

### Program 1: **First Words** (Free)
**Goal:** Build confidence with high-frequency phonemes
**Duration:** 8 sessions × 10 sentences = 80 sentences
**Content:**
- Session 1-2: /b/, /p/, /m/ in Daily Life (20 sentences)
- Session 3-4: /s/, /t/, /d/ in Dining (20 sentences)
- Session 5-6: /k/, /g/, /h/ in Outdoors (20 sentences)
- Session 7-8: Mixed Review (20 sentences)

**Difficulty:** Level 1-2 only
**Scenarios:** Daily Life, Dining
**Voices:** Sarah only (male voice locked)

---

### Program 2: **Daily Essentials** (Free)
**Goal:** Master everyday scenarios
**Duration:** 10 sessions × 8 sentences = 80 sentences
**Content:**
- Daily Life scenarios only
- Level 1-2 difficulty
- Rotation through common phonemes

**Sample Session:**
```
Session 1: Kitchen Conversations (/b/, /p/, /m/)
1. "Can you pass the butter?"
2. "The milk is in the fridge."
3. "Please set the table."
... (8 total)
```

---

## 💎 TIER 1 - "Professional Programs"

**Price:** $9.99/month or $79/year
**Unlocks:**
- Advanced difficulty (Levels 3-4)
- All scenarios (Daily Life, Dining, Outdoors, Social)
- Marcus voice (deep male alternative)
- Adaptive SNR training (background noise)
- Progress analytics

### Program 3: **Phoneme Mastery Series**
**Goal:** Systematic phoneme training
**Structure:** 12 programs × 10 sessions = 120 sessions total

**Sample Programs:**
- **Plosive Power** (/p/, /b/, /t/, /d/, /k/, /g/) - 60 sentences
- **Fricative Focus** (/f/, /v/, /s/, /z/, /θ/, /ð/) - 60 sentences
- **Liquid & Glide** (/l/, /r/, /w/, /j/) - 40 sentences
- **Affricate Attack** (/tʃ/, /dʒ/) - 30 sentences
- **Nasal Navigator** (/m/, /n/, /ŋ/) - 30 sentences

Each program: 8-10 sessions, 6-10 sentences per session

---

### Program 4: **Scenario-Based Training**
**Goal:** Real-world listening situations
**Structure:** 4 scenario tracks

**Track A: Restaurant Ready**
- Session 1-3: Ordering food (Level 2)
- Session 4-6: Conversations at table (Level 3)
- Session 7-10: Noisy environments (Level 4)

**Track B: Social Butterfly**
- Session 1-3: Greetings & small talk (Level 2)
- Session 4-6: Group conversations (Level 3)
- Session 7-10: Party/event settings (Level 4)

**Track C: Outdoor Adventures**
- Parks, hiking, travel scenarios

**Track D: Home & Family**
- Kitchen, living room, family interactions

---

## 🌟 TIER 2 - "Clinical Excellence"

**Price:** $19.99/month or $149/year
**Unlocks Everything + Advanced Features**

### Program 5: **Adaptive Precision Training**
**Goal:** Personalized difficulty progression
**Technology:**
- Smart Coach AI adjusts SNR based on performance
- Automatic difficulty progression
- Targeted phoneme recommendations
- Weekly clinical reports

### Program 6: **Professional Case Studies**
**Goal:** Advanced comprehension in complex scenarios
**Content:**
- 50+ multi-sentence story sequences
- Medical appointments, job interviews, technical discussions
- Level 4-5 only
- Requires 85% accuracy on Tier 1 programs

### Program 7: **Voice Variability Training**
**Goal:** Generalization across speakers
**Content:**
- Emma voice (bright female) + David voice (warm male)
- Same sentences across 4 voices
- Accent variation (future: regional accents)

---

## 📱 UI/UX Implementation Strategy

### **Current Problem:**
- `SentenceTraining.tsx` fetches all 628 sentences at once
- No structure, just a linear list
- Overwhelming for users

### **Premier Solution:**

```
Dashboard
├── 🆓 Free Programs (2 unlocked)
│   ├── First Words (8 sessions)
│   └── Daily Essentials (10 sessions)
├── 💎 Tier 1 Programs (locked with upgrade CTA)
│   ├── Phoneme Mastery (12 programs)
│   └── Scenario Training (4 tracks)
└── 🌟 Tier 2 Programs (locked)
    ├── Adaptive Precision
    ├── Case Studies
    └── Voice Variability
```

### **Session View:**
```
Program: First Words
Session 3 of 8: "Kitchen Sounds"

Progress: ████████░░░░░░░░ 50% (4/8 sessions)

Today's Focus: /s/, /t/, /d/ in Dining

[Start Session] → 10 sentences
```

### **No More 628-Item Lists**
Users see:
- Current program
- Current session (8-12 sentences)
- Next recommended session
- Overall program progress

---

## 🔬 Clinical Rationale

### Why Programs > Lists?

**Neuroplasticity Research:**
- Distributed practice > massed practice
- 8-12 items per session = optimal working memory load
- Spaced repetition across sessions = better retention

**Motivation Psychology:**
- Finite sessions create completion satisfaction
- Progress bars trigger dopamine reward system
- Clear milestones maintain engagement

**Clinical Efficacy:**
- Systematic phoneme progression
- Controlled difficulty curve
- Measurable outcomes per program

---

## 📊 Proposed Database Schema Enhancement

### Add `programs` Table:

```sql
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    tier TEXT CHECK (tier IN ('free', 'tier1', 'tier2')),
    category TEXT, -- 'phoneme', 'scenario', 'adaptive'
    total_sessions INT,
    order_index INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE program_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id),
    session_number INT,
    title TEXT,
    focus_description TEXT,
    stimuli_ids UUID[] -- Array of stimuli IDs
);

CREATE TABLE user_program_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    program_id UUID REFERENCES programs(id),
    session_id UUID REFERENCES program_sessions(id),
    completed_at TIMESTAMPTZ,
    accuracy_percent DECIMAL,
    UNIQUE(user_id, session_id)
);
```

---

## 🎨 UI Component Structure

### New Components Needed:

```typescript
// src/pages/ProgramLibrary.tsx
- Display all programs with tier gates
- Upgrade CTAs for locked tiers
- Progress indicators

// src/pages/ProgramDetail.tsx
- Show program overview
- List all sessions with completion status
- "Start Next Session" button

// src/pages/SessionPlayer.tsx
- Replace current SentenceTraining.tsx
- Fetch specific session (8-12 sentences)
- Progress bar for session
- Smart Coach feedback after session
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create `programs` and `program_sessions` tables
- [ ] Build "First Words" program (80 sentences from existing content)
- [ ] Create `ProgramLibrary.tsx` component
- [ ] Create `ProgramDetail.tsx` component

### Phase 2: Tier System (Week 2)
- [ ] Implement tier-based access control
- [ ] Add upgrade CTAs with Stripe integration
- [ ] Build paywall UI components
- [ ] Create Tier 1 programs (Phoneme Mastery × 5)

### Phase 3: Advanced Features (Week 3)
- [ ] Tier 2 adaptive training
- [ ] Add Emma + David voices
- [ ] Clinical reports dashboard
- [ ] Smart Coach recommendations

---

## 💰 Revenue Model

### Pricing Strategy

**Free Tier:**
- 160 sentences (25% of content)
- Sarah voice only
- No SNR training
- Basic progress tracking

**Tier 1 - $9.99/mo:**
- 400+ sentences (65% of content)
- Both voices (Sarah + Marcus)
- SNR training with Smart Coach
- Detailed analytics

**Tier 2 - $19.99/mo:**
- All 628 sentences (100%)
- 4 voices (Sarah, Marcus, Emma, David)
- Adaptive AI training
- Clinical reports
- Priority support

### Market Comparison

| Product | Price | Content | Target |
|---------|-------|---------|--------|
| **Our App** | $9.99/mo | 628 sentences | CI users |
| Angel Sound | Free | Limited | CI users |
| LACE | $95 one-time | 20 hours | Hearing aids |
| Listening Room | $40/mo | Custom | Clinical |

**Value Proposition:** Best-in-class content at competitive pricing

---

## 🎯 Success Metrics

### Engagement KPIs:
- **Free Users:** 2+ sessions per week
- **Tier 1 Users:** 4+ sessions per week
- **Tier 2 Users:** 5+ sessions per week

### Conversion Goals:
- Free → Tier 1: 15% conversion rate
- Tier 1 → Tier 2: 25% conversion rate

### Clinical Outcomes:
- Average accuracy improvement: 10% per program
- Session completion rate: >80%
- User retention (30-day): >60%

---

## 📝 Next Steps

1. **Approve this strategy** - Confirm clinical structure and tier model
2. **Build program database** - Curate first 3 programs from existing sentences
3. **Refactor UI** - Replace list view with program-based navigation
4. **Implement paywall** - Stripe integration for tier upgrades
5. **Launch beta** - Test with 20 CI users for feedback

---

**Document Version:** 1.0
**Last Updated:** 2025-12-02
**Author:** Clinical Content Team
