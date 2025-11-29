# SoundSteps Content Strategy & Pipeline (Gen 2 - "High Fidelity")

## 🎯 Mission
To build the premier hearing rehabilitation content library, scaling from ~200 assets to **1,000+ clinically validated items**.
**Content Generation:** Managed by AI Agents (driven by clinical research data) $\to$ Reviewed by Humans $\to$ Deployed to Cloud.

---

## 1. Content Hierarchy (Clinical Best Practices)
We will restructure our content into 4 specific modules based on Erber's Hierarchy of Auditory Skills.

### Module A: Phoneme Discrimination (The Foundation)
*Target: 1,000 Pairs*
- **Level 1: Gross Discrimination** (Long vs. Short words)
- **Level 2: Suprasegmentals** (Intonation/Stress patterns)
- **Level 3: Vowel Contrasts** (e.g., "Heat" vs. "Hat")
- **Level 4: Consonant Manner** (e.g., "Pat" vs. "Fat" - Plosive vs. Fricative)
- **Level 5: Consonant Place** (e.g., "Key" vs. "Tea")
- **Level 6: Consonant Voicing** (e.g., "Bear" vs. "Pear")
- **Level 7: Final Consonants** (e.g., "Cap" vs. "Cat" - Hardest for CI users)

### Module B: Speech Tracking (Sentences)
*Target: 500 Sentences*
- **Set A: High Predictability** (Common idioms, simple structures).
- **Set B: Low Predictability** (Random semantic content).
- **Set C: Noise Training** (Sentences played with specific +5dB, 0dB, -5dB SNR).

### Module C: Interactive Stories (Comprehension)
*Target: 50 Stories*
- **"Karaoke" Mode:** All stories must have **Forced Alignment** data to highlight words in real-time.
- **Rich Performance:** Use `[stage directions]` with ElevenLabs V3 model for emotional nuance.
- **Dual Voice:** Toggle between Male/Female narrators to train different frequency responses.

### Module D: Real-World Scenarios (Soundscapes)
*Target: 30 Scenarios*
- **Environment:** Coffee Shop, Restaurant, Airport, Family Dinner.
- **Task:** "Target Speech" (Order number, Name called) vs. "Distractor Speech".
- **Dynamic Ambience:** Generated variations (e.g., "Quiet Cafe", "Busy Lunch Rush").

---

## 2. The "Cloud-First" Pipeline

### Step 1: Research & Synthesis (The "Brain")
*   **Agent:** We (AI) query clinical databases and rehab guidelines to generate content lists.
*   **Output:** Structured CSVs in `content/source_csvs/`.
*   **Review:** User reviews CSVs in VS Code or Google Sheets (optional) for quality assurance.

### Step 2: Asset Generation (The "Factory")
*   **Script:** `scripts/generate_assets_premier.py`
    *   **TTS & Alignment:** Uses ElevenLabs `/v1/text-to-speech/{voice_id}/with-timestamps` to generate audio and word-level alignment JSON.
    *   **Upload:** Pushes files directly to **Supabase Storage** (`audio` and `alignment` buckets).

### Step 3: Database Sync (The "Catalog")
*   **Script:** `scripts/sync_db.py`
    *   Reads the local CSVs.
    *   Upserts metadata (Title, Transcript, Tier, Storage URLs) to **Supabase Database**.

### Step 4: App Consumption (The "Player")
*   **App:** Fetches data from Supabase API (`supabase.from('stories').select('*')`).
*   **Playback:** Streams audio directly from the CDN URL.

---

## 3. Official Voice Strategy: The Clinical Quartet

We will utilize a set of four clinically-chosen voices to provide varied acoustic experiences crucial for CI users.

| Role | Name | Voice ID | Clinical Purpose | Status in Pipeline |
| :--- | :--- | :--- | :--- | :--- |
| **Female Primary** | **Sarah** | `EXAVITQu4vr4xnSDxMaL` | **Standard Clarity.** High intelligibility, warm tone. The "baseline" for initial training. | ✅ Implemented |
| **Male Primary** | **Marcus** | `TxGEqnHWrfWFTfGW9XjX` | **Low Frequency Training.** Deep resonance to challenge CI low-frequency coding strategies. | ✅ Implemented |
| **Female Challenge** | **Emma** | `ThT5KcBeYPX3keUQqHPh` | **Higher Pitch / Fast Paced.** Simulates younger speakers or "clear but quick" speech. | ⏳ To be implemented |
| **Male Challenge** | **David** | `pNInz6obpgDQGcFmaJgB` | **Casual / Texture.** A more relaxed, "everyday" male voice to train against less structured prosody. | ⏳ To be implemented |

---

## 4. Subscription Tiers

| Feature | Free | Standard ($9.99) | Premium ($19.99) |
| :--- | :--- | :--- | :--- |
| **Word Pairs** | 50 (Basic Contrasts) | 500 (All Vowels/Manner) | 1,000+ (All + Final Consonants) |
| **Sentences** | 20 (Quiet) | 200 (Quiet + Mild Noise) | 500+ (All Noise Levels) |
| **Stories** | 1 Story | 10 Stories | 50 Stories (New added monthly) |
| **Scenarios** | 1 (Coffee Shop) | 10 (Common Places) | 30+ (Complex/High Noise) |
| **Voices** | 1 (Standard) | 4 (All Clinical Voices) | Custom Voice Cloning (Future) |

---

## 5. Implementation Checklist

- [x] **Phase 1: Infrastructure (The Backend)**
    -   [x] Init Supabase: Create project, set up Tables and Storage Buckets.
    -   [x] Schema Upgrade: Apply Schema V2.1 Clinical Metadata & Reporting.
    -   [x] Create empty "Master" CSV templates for the new content hierarchy.

- [x] **Phase 2: Cloud Asset Generation**
    -   [x] Set up Supabase Project, Tables, and Storage Buckets.
    -   [x] Implement `scripts/generate_assets_premier.py` for Words and Stories (Sarah & Marcus).
    -   [x] Rename `bill` folders to `marcus` in Supabase Storage.
    -   [x] Run `scripts/sync_db.py` to populate DB metadata.

- [x] **Phase 3: Frontend Integration**
    -   [x] Update `useAudio` hook for Supabase CDN playback.
    -   [x] Update `useActivityData` to fetch content metadata from Supabase DB.
    -   [x] Implement Story "Karaoke Mode" using alignment JSON.
    -   [ ] Implement Tier-based content locking in UI.

- [ ] **Phase 4: Content Scaling & Advanced Features**
    -   [ ] Add Emma and David voices to generation pipeline.
    -   [ ] Develop Sentence generation and integration.
    -   [ ] Implement Scenario generation and integration (with ElevenLabs Sound Effects).
    -   [ ] Develop User Progress Tracking (Supabase DB).
    -   [ ] Implement Subscription Logic (Supabase Auth/Edge Functions).