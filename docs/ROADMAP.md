# SoundSteps Roadmap

## Current Status (v0.8 - "Stable Core")
- The `RapidFire` (Word Pairs) module is feature-complete and stable.
- The core audio engine (`useAudio`) is implemented and functional.
- The visual identity ("Slate/Cyberpunk") is applied consistently.
- Gamification MVP (Streak Counter) is live.
- **Status:** Ready for Phase 2: Content Expansion & Advanced Audio.

## Next Steps (Immediate Priorities)
- [ ] **Content Pipeline:** Generate all missing audio files for `wordPairs.ts` using the new content strategy.
- [ ] **Stories Module:** Begin building the UI and data structures for the "Interactive Stories" activity, leveraging ElevenLabs Forced Alignment.

---

## Completed Milestones

### Phase 1: The Audio Engine
- [x] Create `src/data/wordPairs.ts` to hold minimal pairs.
- [x] Implement a real Audio Hook (`useAudio`) to handle playback.
- [x] Connect "Voice Selection" to the dynamic audio path.

### UI/UX Foundation
- [x] Implemented premium "Slate/Cyberpunk" theme globally.
- [x] Established "Layout Sandwich" pattern for activity screens.
- [x] Implemented `StreakFlame` visual feedback component.

## Future Phases

### Phase 2: Gamification & Analytics
- [ ] Implement "Real" Streak Counter (Date-aware).
- [ ] Wire up the Dashboard Graph to read from `user.history`.
- [ ] Implement a "Zoomable" Progress View (Day/Week/Month).

### Phase 3: New Activities (Powered by ElevenLabs)
- [ ] **Interactive Stories:** Karaoke Highlighting via Forced Alignment.
- [ ] **Scenarios:** Multi-Voice Dialogue Generation for roleplay.

### Phase 4: Pro Tier Features
- [ ] **Real-time Conversational Agent:** Flagship feature for advanced, unscripted practice.
