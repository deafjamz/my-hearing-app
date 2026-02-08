# 00_MASTER_RULES: System Architecture

## 1. Core Stack
* **Frontend:** React + Vite + TypeScript.
* **Mobile Bridge:** Capacitor (iOS/Android).
* **Backend:** Supabase (Auth, Postgres, Edge Functions, Storage).
* **Audio Engine:** Web Audio API (Client-Side Mixing).

## 2. The Audio Engine (The Ear)
* **Strategy:** Continuous Noise Bed.
    * Noise does NOT stop between words.
    * Noise fades in at session start, loops continuously, fades out at session end.
* **Mixing Logic:** Client-side only. `Target Audio` plays over `Noise Audio`.
* **Latency:** All assets must be cached via Service Worker or Capacitor Filesystem.

## 3. The Data Layer (The Brain)
* **RLS Policies:** Public Read Access enabled for `stimuli_catalog` and `audio_assets` (Guest Mode support).
* **Auth:** Optional. Users can play as "Guest."
* **Persistence:**
    * If Logged In: Save SNR to `profiles` table.
    * If Guest: Save SNR to `localStorage`.

## 4. The Truth Layer (QA)
* **Asset Pipeline:** `scripts/verify_audio.py` is the gatekeeper.
* **Requirement:** All speech assets must be normalized to **-20 LUFS** (active speech only).
* **Babble:** Must be 10:1 Compressed, Multi-talker, normalized.

## 5. CONTENT GENERATION STANDARDS (ZERO TOLERANCE)
* **The "Cold Start" Ban:** NEVER generate single words in isolation. Generative TTS models clip the start (attack) without context.
* **The Ellipsis Padding Rule:** All target stimuli must be generated with ellipsis padding to prevent cold-start clipping.
    * *Standard:* `"... [TARGET] ..."`
    * *Reason:* Gives the TTS model prosodic "breath" context without producing audible carrier content. Post-generation silence trimming removes the padding.
    * *WARNING:* NEVER use a carrier phrase like `"The next word is [TARGET]"` — this caused F-009 contamination in the daniel voice (92.5% of files had audible "is [word]" prefix). See `docs/F009_INCIDENT_REPORT.md`.
* **The "Smoke Test" Rule:** Never execute a batch > 20 items without a manual "Ear Check" of the first 5 files.
* **The Cross-Voice Check:** After generating audio for any voice, run `scripts/audit_carrier_phrases.py` and verify 0% contamination. Compare durations across voices — outliers indicate problems.

## 6. HEARING DEVICE COMPATIBILITY (MFi/ASHA)
* **Context:** Primary users are Cochlear Implant and Hearing Aid users who stream audio via Bluetooth (MFi/ASHA/LE Audio).
* **Problem:** Frequent audio start/stop causes connection beeps and latency penalties.
* **Solution:** The "Always-On Sentinel" - Keep AudioContext active with silent audio to prevent Bluetooth teardown.

### The Sentinel Rules:
* **NEVER suspend AudioContext** during an active session.
* **Play continuous audio** from session start to session end (even if user-facing audio is "off").
* **Silent Sentinel Gain:** Use `0.0001` (not `0.0`) to prevent OS optimization from killing the stream.
    * *Rationale:* Pure zero triggers aggressive battery savers on iOS/Android. Microscopic signal (-90dB) keeps stream alive.
* **Noise Toggle = Gain Control:** User toggling "noise" adjusts gain between `0.0001` (silent) and calculated SNR value (audible).
    * *Implementation:* Do NOT stop/start the noise buffer. Only adjust `gainNode.gain.value`.

### Progressive Disclosure (Consumer Model):
* **Default State:** Noise OFF (Silent Sentinel at 0.0001 gain).
* **Opt-In Moment:** After user achieves mastery (≥90% accuracy), offer "Ready to try this with background noise?"
* **User Control:** Provide visible toggle to enable/disable noise at any time.
* **Smart Coach Constraint:** If noise is OFF, Smart Coach does NOT adjust SNR. It only tracks accuracy.

## 7. THE 9-VOICE CLINICAL SYSTEM

* **Purpose:** Multi-accent speech perception training for cochlear implant users.
* **Quality Standard:** All voices must have HNR > 10.0 dB (Harmonics-to-Noise Ratio).
* **Regions:** US (4), UK (2), AU (2), IN (1)

### Voice Configuration Reference:
**⚠️ CRITICAL: All voice IDs and specifications are in `docs/VOICE_LIBRARY.md`**

**Active Voices (9):**
* **Sarah** (US Female) - 13.7 dB HNR - Primary reference
* **Emma** (US Female) - 12.1 dB HNR - Higher F0
* **Bill** (US Male) - 11.4 dB HNR - Standard male
* **Michael** (US Male) - 12.4 dB HNR - Deep male
* **Alice** (UK Female) - 11.2 dB HNR - British RP
* **Daniel** (UK Male) - 12.1 dB HNR - News clarity
* **Matilda** (AU Female) - 11.4 dB HNR - Australian
* **Charlie** (AU Male) - 10.6 dB HNR - Australian
* **Aravind** (IN Male) - 10.2 dB HNR - Global English

**Deprecated (DO NOT USE):**
* ~~Marcus~~ (5.2 dB HNR) - Too raspy, replaced by Bill
* ~~David~~ (7.3 dB HNR) - Vocal fry, replaced by Michael

### Standard Operating Procedure:
When adding/modifying voices, **ALWAYS** update:
1. `docs/VOICE_LIBRARY.md` (source of truth)
2. `src/store/VoiceContext.tsx` (frontend)
3. `scripts/generate_library_v3_production.py` (generation)
4. `scripts/backfill_word_pairs_fast.py` (backfill)

See `docs/VOICE_LIBRARY.md` for complete procedures and voice IDs.
