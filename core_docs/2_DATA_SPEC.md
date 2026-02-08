# Data Schema & Clinical Logic
**Role:** Chief Data Scientist

## Database Strategy
We use a normalized schema to separate content definitions from physical audio assets.

## Core Tables Needed
1.  `profiles`: Extends auth.users. Stores `subscription_tier` and `audiogram_data` (JSONB).
2.  `stimuli_catalog`: The master list of words/sentences (Erber's Hierarchy).
3.  `audio_assets`: Links content to storage URLs. MUST include `verified_rms_db` (float) for client-side mixing.
4.  `user_trials`: Immutable log of every interaction. Tracks `condition_snr` and `reaction_time_ms`.

## The Smart Coach (DDA)
* **Algorithm:** 2-down / 1-up Adaptive Staircase.
* **Logic:**
    * If Accuracy > 85% (Last 10 trials) -> Decrease SNR (Make harder).
    * If Accuracy < 60% (Last 10 trials) -> Increase SNR (Make easier).
