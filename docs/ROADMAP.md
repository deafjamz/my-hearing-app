# SoundSteps Roadmap

## Current Status (v0.5 - "The Polish Build")
- **UI:** Premium "Slate/Cyberpunk" theme implemented globally.
- **State:** UserContext tracks Goal and Voice settings.
- **Layout:** Fixed "Sandwich" layouts for games (No scrolling bugs).

## Phase 1: The Audio Engine (Next Priority)
- [ ] Create `src/data/wordPairs.ts` to hold 50+ minimal pairs.
- [ ] Implement a real Audio Hook (`useAudio`) to handle playback.
- [ ] Connect "Voice Selection" to the audio path (e.g., `/audio/sarah/bear.mp3`).

## Phase 2: Gamification Logic
- [ ] Implement Real Streak Counter (Check dates in UserContext).
- [ ] Wire up the Dashboard Graph to read from `user.history`.
- [ ] Add "Level Up" animations when XP/Minutes goals are met.

## Phase 3: New Activities
- [ ] **Interactive Stories:** Text-highlighting reader.
- [ ] **Scenarios:** Chat-based audio roleplay.
