# SoundSteps: Technical Execution Roadmap (v1.0)
**Role:** CTO & Lead Systems Architect
**Stack:** React (Vite), Capacitor, Supabase, Python (QA Pipeline), ElevenLabs

## 1. Architectural Overview
SoundSteps is a Digital Therapeutic (DTx) built on a "Thick Client, Cloud Sync" architecture.
* **Frontend:** React/TypeScript + Vite.
* **Mobile Bridge:** Capacitor (iOS/Android) for native haptics and filesystem access.
* **Backend:** Supabase (Auth, Postgres, Storage, Edge Functions).
* **Audio Engine:** Web Audio API (Client-Side Mixing) + ElevenLabs (Asset Generation).

## 2. Phased Execution Plan

### Phase 1: Architecture & "The Spine"
**Objective:** Establish the foundational data model, authentication, and security.
* **Auth:** Supabase Auth with RLS policies.
* **Database:** PostgreSQL schema for `profiles`, `stimuli_catalog`, and `user_trials` (See `2_DATA_SPEC.md`).
* **Native Shell:** Capacitor configured for iOS and Android.

### Phase 2: Core Audio Engine (The "Web Audio" Pivot)
**Objective:** Low-latency playback and Client-Side SNR Mixing.
* **Strategy:** We do NOT pre-mix noise. We store clean speech and separate noise tracks. The client mixes them in real-time.
* **Web Audio API:**
    * Implement `AudioContext` to load `speech_buffer` and `noise_buffer`.
    * Use `GainNode` to adjust the noise volume dynamically based on the target SNR and the speech file's `verified_rms_db` metadata.
* **Offline Caching:** Use Capacitor Filesystem to cache frequently used assets (avoiding repeat bandwidth costs).

### Phase 3: The "Truth Layer" (Automated QA Pipeline)
**Objective:** Python-based automated verification of generated assets.
* **Pipeline Logic:**
    1.  **Generate:** ElevenLabs API creates raw audio.
    2.  **Trim:** `librosa` detects and trims start/end silence (>0.5s).
    3.  **Normalize:** `pydub` normalizes active speech to a standard target (e.g., -20 LUFS).
    4.  **Verify:** `pystoi` checks intelligibility.
    5.  **Metadata:** Calculate `active_speech_rms` and store in Supabase.

### Phase 4: The Clinical Loop
**Objective:** Secure data logging and reporting.
* **Edge Functions:** All progress logging goes through `log_progress` (Supabase Edge Function) to prevent client-side tampering.
* **PDF Generation:** `@react-pdf/renderer` generates the "Audiologist Report" on the client side.

## 3. Key Technical Prompts (for AI Coding)
* **Client-Side Mixer:** "Create a React Hook `useSNRMixer(speechUrl, noiseUrl, targetSNR)` that uses the Web Audio API to play two tracks simultaneously. It must fetch the `verified_rms` from Supabase for the speech track and calculate the required gain for the noise track to achieve the `targetSNR`."
* **Capacitor Caching:** "Write a `FileSystemService` class using Capacitor. It should check if a file exists locally. If yes, return the URI. If no, fetch from Supabase, save to the `Data` directory, and return the URI."
