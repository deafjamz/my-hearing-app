# Testing Findings — Production Readiness

> **Started:** 2026-02-07
> **Tester:** Bruce (developer, CI user)
> **Environment:** Desktop browser, https://my-hearing-app.vercel.app
> **Status:** IN PROGRESS

---

## Severity Guide

| Level | Meaning | Action |
|-------|---------|--------|
| **P0** | Broken — blocks usage or causes crash | Fix before launch |
| **P1** | Major UX gap — confuses or loses users | Fix before public launch |
| **P2** | Notable — impacts experience but usable | Fix in first update |
| **P3** | Polish — nice to have | Backlog |

---

## Fix Tracker

| ID | Severity | Title | Status | Fix Batch | Notes |
|----|----------|-------|--------|-----------|-------|
| F-001 | P1 | No first-time user onboarding | OPEN | — | Needs design work |
| F-002 | P2 | Audio carrier phrase bleed (Detection) | SUPERSEDED | — | Escalated to F-009 |
| F-003 | P1 | Theme inconsistency (dark vs light) | **FIXED** | Batch 2 | Added `class="dark"` globally, converted PracticeHub |
| F-004 | P1 | Stats hidden behind user icon | **FIXED** | Batch 2 | Added `mr-14` to Detection stats |
| F-005 | P1 | No progress indicator during activities | **FIXED** | Batch 2+4 | Detection, CategoryPlayer already had bars; RapidFire now has progress bar + session limit |
| F-006 | P2 | Play button no feedback on re-click | **FIXED** | Batch 2 | Button grays out + 50% opacity when disabled |
| F-007 | P1 | Activities feel infinite — no end | **FIXED** | Batch 2+4 | Detection: 10 rounds, RapidFire: 15 rounds, CategoryPlayer: 10 rounds — all have SessionSummary |
| F-008 | P1 | No pre-activity briefing | OPEN | — | Needs design work (connected to F-005/F-007) |
| F-009 | ~~P0~~ **P3** | Carrier phrase contamination (~80% words) | **INVESTIGATED** | Batch 3 | Audit shows files CLEAN — no carrier phrases. Daniel voice has longer files (0.78-1.15s) with late onsets. Needs user re-test. |
| F-010 | **P0** | Guest mode silently discards progress | **FIXED** | Batch 3 | RequireAuth gate blocks activities for guests — sign-in prompt with AuthModal |
| F-011 | P1 | App should require sign-in | **FIXED** | Batch 3 | 12 activity routes now wrapped in RequireAuth; browsing routes remain open |
| F-012 | P2 | Share with Audiologist — compliance risk | OPEN | — | Needs regulatory review |
| F-013 | P1 | Word Pairs cards unapproachable | OPEN | — | Needs copy + design pass |
| F-014 | P1 | Voice changes unexpectedly between activities | **FIXED** | Batch 2+4 | All activities use voice from UserContext; SessionPlayer fixed in Batch 4 |
| F-015 | **P0** | Word Pairs ends after 1 word | **FIXED** | Batch 2 | Voice fallback + muted praise for short sessions |
| F-016 | P1 | No per-answer feedback in Word Pairs | **FIXED** | Batch 4 | CategoryPlayer shows correct/incorrect with 1.5s feedback delay; RapidFire already had it |
| F-017 | P2 | No dev/test mode for locked content | **FIXED** | Batch 3 | `VITE_DEV_UNLOCK_ALL=true` in .env.local bypasses tier locks |

**Summary:** 17 findings | 12 fixed | 3 open | 1 superseded | 1 investigated
**P0s:** 3 total — 2 fixed (F-010, F-015), 1 investigated/downgraded (F-009)

### Fix Batches

**Batch 1** (Session 13 — 2026-02-07): Build fixes, audio hardening, accessibility, code quality — 19 files, 475 insertions

**Batch 2** (Session 14 — 2026-02-07): Testing triage fixes — dark theme, z-index, Detection session, Word Pairs voice, praise calibration — 7 files, 63 insertions

**Batch 3** (Session 14 — 2026-02-07): Auth gate, dev mode, audio audit
- F-017: Added `VITE_DEV_UNLOCK_ALL` env var to bypass tier locks in ActivityList + ProgramLibrary
- F-010/F-011: Created `RequireAuth` component, wrapped 12 activity routes in App.tsx — guests see sign-in prompt
- F-009: Created `scripts/audit_audio_quality.py` (librosa-based onset detection). Audited 60 files across 3 voices + targeted audit of user-reported words across 4 voices. **Result: All files are CLEAN** — no carrier phrase contamination detected. Daniel voice has notably longer files (0.78-1.15s vs 0.3-0.5s for others) with late onsets (81-221ms silence), which may explain user perception. Downgraded from P0 to P3 pending user re-test.

**Batch 4** (Session 14 — 2026-02-07): Activity experience polish
- F-005/F-007: RapidFire now has SESSION_LENGTH=15, progress bar ("Round X of Y"), and SessionSummary on completion instead of infinite loop
- F-016: CategoryPlayer shows per-answer feedback — correct (teal) / incorrect (red) with 1.5s auto-advance delay, reveals correct word on miss
- F-014: SessionPlayer voice now initialized from UserContext instead of hardcoded 'sarah' — all 5 activity pages now use user's voice

---

## Findings

### F-001: No first-time user onboarding
**Severity: P1** | **Category: UX / First Impression**
**Page:** Dashboard (`/`)

**Problem:**
The very first thing a new user sees is an empty dashboard with technical metrics. There is no:
- Welcome screen or app explanation
- Guidance on what SoundSteps is or what to do first
- Context for who this app is for (CI users, hearing loss rehab)
- Clear first action ("Start your first exercise")

The dashboard shows:
- "0 / 100 Steps Today" — meaningless without context
- "+10 dB Signal-to-Noise Ratio" — clinical jargon most users won't understand
- "Intermediate" level label — based on what? User hasn't done anything
- Empty "Words Heard" card with a dash

**Impact:** First-time users (especially non-technical CI recipients or family members helping them) will feel lost and may leave immediately. This is the single most important screen for conversion and retention.

**Recommendation:** Add a first-visit experience that:
1. Briefly explains what SoundSteps does (1-2 sentences)
2. Shows who it's for ("designed for cochlear implant users and people with hearing loss")
3. Has ONE clear CTA: "Start Your First Exercise" → routes to Sound Detection (easiest activity)
4. Hides or simplifies technical stats (SNR, steps) until the user has completed at least one session
5. After first session, transition to the current dashboard with context ("You've completed your first session!")

**Empty state specifically:**
- Replace "0 / 100 Steps Today" with encouraging language ("Ready for your first session?")
- Hide SNR gauge until user has done a noise-enabled exercise
- Replace "Words Heard: —" with "Complete an exercise to start tracking"

**Design references:** Duolingo's first-open experience, Headspace onboarding, Apple Fitness+ first launch

---

### F-002: Audio carrier phrase bleed-through on Detection words
**Severity: P2** | **Category: Audio / Polish**
**Page:** Sound Detection (`/practice/detection`)

**Problem:**
When playing Detection words, users hear the tail end of the ElevenLabs carrier phrase — e.g., "is pond", "is food" instead of just "pond" or "food". The audio files in Supabase Storage contain the full carrier phrase ("The word is ___") used during generation to prevent cold-start artifacts, but the Detection playback code does **no audio offset/skip**.

**Root cause:** `src/pages/Detection.tsx` lines 86-116 — `handlePlay` creates `new Audio(url)` and calls `audio.play()` directly without setting `audio.currentTime` to skip the carrier prefix. No offset logic exists in this file at all.

**Impact:** Sloppy first impression. Detection is the easiest activity — likely the first one new users try. Hearing garbled carrier phrase remnants undermines confidence in the app quality. Less impactful than in Word Pairs (since Detection is Yes/No, not recognition), but still notable.

**Recommendation:**
1. Add `audio.currentTime = CARRIER_SKIP_SECONDS` after creating the Audio element in Detection.tsx
2. The skip value needs empirical tuning — 0.95s is too short; try 1.1–1.3s or measure actual carrier durations
3. Alternatively, regenerate Detection audio without carrier phrases (shorter files, cleaner playback)
4. Consider a shared constant in `src/lib/audio.ts` for the carrier skip offset used across activities

---

### F-003: Theme inconsistency — dark Dashboard vs. light activity pages
**Severity: P1** | **Category: Visual Design / Consistency**
**Pages:** Dashboard (`/`), Practice Hub (`/practice`), Detection (`/practice/detection`)

**Problem:**
The app has a jarring theme split:
- **Dashboard:** Dark theme — `bg-slate-950` with white text (premium bento grid feel)
- **Practice Hub:** Light theme — no explicit background (inherits white), `text-gray-900`, white cards
- **Detection:** Light theme — `bg-slate-50 dark:bg-slate-950` (light-first with dark mode fallback)

Navigating from the dark Dashboard to the bright Practice Hub feels like switching apps entirely. There is no cohesive design language.

**Specific files:**
- `src/pages/Dashboard.tsx` line 72: `bg-slate-950`
- `src/pages/PracticeHub.tsx` line 41: no background class, hardcoded `text-gray-900`
- `src/pages/Detection.tsx` line 182: `bg-slate-50 dark:bg-slate-950`

**Impact:** Undermines professional feel. Users (especially audiologists evaluating the app) will perceive it as unfinished. The dark Dashboard sets an expectation that the entire app is dark-themed.

**Recommendation:**
Pick ONE direction and apply consistently:
- **Option A (Dark everywhere):** Convert Practice Hub and activity pages to `bg-slate-950` dark theme matching Dashboard. This is the more premium, modern look.
- **Option B (Light everywhere):** Convert Dashboard to light theme matching activities. Simpler but less distinctive.
- **Option C (System preference):** Use `dark:` Tailwind variants consistently across ALL pages and respect `prefers-color-scheme`. Detection already has this partially — extend to Dashboard and Practice Hub.

Option A recommended — the dark Dashboard already looks polished. Extend that treatment.

---

### F-004: Accuracy stats hidden behind user icon (z-index overlap)
**Severity: P1** | **Category: UI Layout / Usability**
**Page:** Sound Detection (`/practice/detection`)

**Problem:**
The accuracy percentage and round counter (e.g., "100% · 1/5") in the Detection header are positioned at the far right via `flex justify-between`, but the Layout component's user icon is fixed at `top-0 right-0` with `z-40`. The Detection header only has `z-10`. Result: the stats are completely obscured by the person icon circle.

**Root cause — two competing layers:**
1. `src/pages/Detection.tsx` line 187: header is `sticky top-0 z-10` with stats on the right
2. `src/components/Layout.tsx` line 38: user icon container is `fixed top-0 ... z-40` on the right

The Layout's fixed overlay always wins, covering any right-aligned content in page headers.

**Impact:** Users can't see their score or progress during the exercise. This is core feedback — knowing "I got 4/5 right" motivates continued practice. For CI users building confidence, hiding positive feedback is actively harmful to engagement.

**Recommendation:**
1. **Quick fix:** Add right padding to Detection header stats (`pr-14` or similar) to dodge the user icon
2. **Better fix:** Move stats to the left side of the Detection header, or center them
3. **Best fix:** Rethink Layout.tsx — the floating user icon at z-40 will conflict with ANY page that puts content in the top-right. Consider:
   - Moving the user icon into the bottom nav bar
   - Making it part of the page flow instead of fixed overlay
   - Reducing its z-index and having activity pages account for it

This likely affects ALL activity pages with headers, not just Detection — check RapidFire, Stories, etc.

---

### F-005: No progress indicator during activities — no finish line visible
**Severity: P1** | **Category: UX / Motivation**
**Pages:** Sound Detection (`/practice/detection`), Word Recognition (`/practice/rapid-fire`), all activities

**Problem:**
During an activity session, there is zero indication of progress. No progress bar, no "7 of 20", no visual gauge filling up. Users complete round after round with no sense of whether they're at the beginning, middle, or end.

This is a critical motivation killer. Modern apps (Duolingo, fitness apps, even long web articles) universally show progress — a bar that fills, a step counter, a scroll indicator. The dopamine of "I'm almost done" or "I'm halfway there" is what keeps users pushing through when the task is fatiguing (and listening exercises ARE fatiguing for CI users).

**What's missing:**
- No session length shown before starting (e.g., "10 rounds")
- No progress bar or fraction during the activity (e.g., "4/10" or a filling circle)
- No "almost there!" encouragement as user approaches the end
- No completion celebration when done

**Impact:** Without visible progress, every round feels like it might go on forever. This causes:
- Frustration and fatigue — especially for CI users who are already working hard to listen
- Users quitting mid-session because they don't know how close they are to finishing
- No sense of accomplishment even when they DO finish

**Recommendation:**
1. Add a slim progress bar at the top of every activity (like the scroll-progress bars on modern articles)
2. Show "Round X of Y" text alongside the progress bar
3. Define clear session lengths per activity (e.g., Detection = 10 rounds, RapidFire = 20 words)
4. At 80%+ progress, add subtle encouragement ("Almost there!")
5. On completion, show a summary screen with stats and a "Well done!" moment
6. Consider an animated circular gauge that fills — more visually satisfying than a bar for short sessions

**Design references:** Duolingo lesson progress bar, Apple Fitness ring closing, Medium article read progress

---

### F-006: Play button accepts repeated clicks with no feedback
**Severity: P2** | **Category: UX / Feedback**
**Page:** Sound Detection (`/practice/detection`)

**Problem:**
After the audio plays once, the purple play button remains fully styled and interactive-looking. Users can tap it repeatedly — nothing happens, but there's no visual feedback indicating "you've already played this" or "replay not available." The button just silently does nothing.

**Expected behavior (either):**
- The button visually changes to a disabled/played state (grayed out, checkmark, or different icon)
- OR: Tapping it gives a brief "bump" / shake animation to acknowledge the tap while communicating "no replay"
- OR: It actually replays the audio (if replay is intentional)

**Impact:** Confusing. Users think the app is broken or frozen. They tap harder, tap more, then give up and guess without confidence. For a hearing exercise app, "did I hear it or did the app not play it?" is the worst ambiguity possible.

**Recommendation:**
1. After audio plays, visually transition the button: reduce opacity, add a checkmark overlay, or swap to a "played" state icon
2. If tapped after playing, show a brief shake/wiggle animation (CSS `@keyframes shake`) to acknowledge the tap
3. Consider showing a tooltip-style hint: "Listen carefully — one play per round"
4. If the clinical intent allows replays, enable them with a replay counter ("2 plays remaining")

---

### F-007: Activities have no defined session length — they feel infinite
**Severity: P1** | **Category: UX / Session Design**
**Pages:** Sound Detection (`/practice/detection`), Word Recognition (`/practice/rapid-fire`)

**Problem:**
Activities appear to continue indefinitely. The tester completed 20-31+ Detection rounds with no indication the session would ever end. Word Recognition ("Which word did you hear?") similarly had no clear stopping point.

This is a fundamental session design issue — there are no defined session boundaries.

**What's needed BEFORE starting:**
- "This session has 10 rounds" or "About 3 minutes"
- What the activity is testing (in plain language)
- Whether this is an assessment or practice

**What's needed DURING:**
- See F-005 (progress indicator)

**What's needed AT THE END:**
- Clear completion screen: "Session complete!"
- Summary: accuracy, time spent, words heard
- Next action: "Try another activity" or "Take a break"

**Impact:** Infinite-feeling exercises are the opposite of motivating. CI rehabilitation is already effortful — users need clear start/middle/end structure to feel accomplishment and manage their energy. An audiologist recommending the app needs to be able to say "do 10 minutes a day" and have the app support that.

**Recommendation:**
1. Define default session lengths: Detection = 10 rounds, RapidFire = 15 words, Stories = 1 passage
2. Show session length on the pre-activity screen (see F-008)
3. Allow "Quick" (5) / "Standard" (10) / "Extended" (20) session options
4. Hard-stop at session end with a summary/celebration screen
5. Optionally: "Want to keep going?" prompt after completion (not automatic continuation)

**Related:** F-005 (progress indicator), F-008 (pre-activity briefing)

---

### F-008: No pre-activity briefing — users jump in with zero context
**Severity: P1** | **Category: UX / Onboarding**
**Pages:** All activities

**Problem:**
When a user taps into any activity, they are immediately in the exercise with no explanation of:
- What this activity is ("Listen for words mixed with silence rounds")
- What they should do ("Tap Yes if you hear a word, No if you hear silence")
- How many rounds to expect ("10 rounds, about 2 minutes")
- Whether this is an assessment or practice
- What the app is measuring or adapting

Users are dropped into a clinical exercise cold. This is disorienting even for the developer — it's unacceptable for a first-time CI user or a family member helping with rehab.

**Impact:** Without context, users:
- Don't know what's expected → hesitate, make mistakes from confusion not hearing
- Don't understand the purpose → feel like they're wasting time
- Can't set expectations for effort/duration → fatigue and quit
- Miss the clinical intent → don't appreciate that difficulty adapts to them

**Recommendation:**
Add a pre-activity "briefing" screen for each activity:
1. **Title + 1-sentence description:** "Sound Detection — Can you tell when a word is played?"
2. **Simple instructions:** "You'll hear either a word or silence. Tap Yes or No."
3. **Session info:** "10 rounds · About 2 minutes"
4. **Start button:** Large, clear "Begin" CTA
5. **Optional settings:** Voice selection, noise on/off (where applicable)
6. First time only: slightly more detailed explanation; repeat visits can show a condensed version

**Design references:** Duolingo lesson intro, Lumosity game briefings, Apple Fitness+ workout previews

**Related:** F-001 (onboarding), F-007 (session length)

---

### F-009: Carrier phrase audio contamination — INVESTIGATED, files are CLEAN
**Severity: ~~P0~~ P3 (downgraded after audit)** | **Category: Audio Quality / Core Product**
**Pages:** All word-based activities (Detection, Word Recognition / RapidFire)

**Original report:**
~80% of words with the British voice had audible carrier phrase bleed ("is pond", "is food"). Occasionally onset clipping ("rival" → "ival"). Reported as pervasive and critical.

**Audit results (2026-02-07):**
Automated analysis using librosa speech onset detection (`scripts/audit_audio_quality.py`) found:

| Voice | Files Tested | Duration Range | Onset Range | Category |
|-------|-------------|---------------|-------------|----------|
| sarah | 12 | 0.35–0.48s | 12–58ms | ALL CLEAN |
| alice | 12 | 0.35–0.49s | 12–35ms | ALL CLEAN |
| charlie | 12 | 0.30–0.50s | 12–47ms | ALL CLEAN |
| daniel | 12 | 0.78–1.15s | 81–221ms | ALL CLEAN (but 2-3x longer) |

**Key findings:**
1. **Zero carrier phrase contamination detected.** Energy analysis shows no speech signal before word onset in any file.
2. **Daniel voice is an outlier** — files are 2-3x longer than other voices (0.78-1.15s vs 0.3-0.5s) with 81-221ms of silence before the word starts. This late onset + longer duration may be what the CI user perceived as "is" before words.
3. **Multi-syllable words** (apple, basket, finger, etc.) do NOT exist in `words_v2/` — only word-pair words are stored.
4. No carrier phrase exists in any audio path (`words_v2/{voice}/{word}.mp3`). The code uses `buildWordAudioUrl()` → `words_v2/` directly — no offset/skip logic is needed because files are already clean.

**Remaining question:**
The user's perception of carrier phrase bleed was strong and specific. Possible explanations:
- Daniel's late onset (175ms silence) interpreted differently through a CI processor
- CI audio processing may introduce artifacts at boundaries between silence and speech
- The user may have been testing with a different audio source or app version
- Needs user re-test with voice explicitly set to a short-onset voice (sarah/alice/charlie)

**Status:** Downgraded to P3. No code fix needed — files are clean. Recommend defaulting to shorter-onset voices and re-testing with user.

**Related:** F-002 (initial carrier finding)

---

### F-010: Guest mode silently discards all activity progress
**Severity: P0** | **Category: Data / Trust**
**Pages:** Dashboard (`/`), Progress (`/progress`), all activities

**Problem:**
A user can complete 10+ minutes of activities (Detection, Word Pairs) in guest mode, return to the Dashboard, and see absolutely nothing recorded:
- "0 / 100 Steps Today" — unchanged
- Daily ascent shows nothing
- Words Heard card still shows a dash
- Progress page shows: 0 total exercises, 0% average accuracy, no practice time, "No practice data yet"

The only hint is buried on the Progress page: "Sign in to track your full progress history across sessions." But this warning comes AFTER the user has already invested significant effort. There is no prompt to sign in before or during activities.

**Why this is P0:**
The user just spent 10 minutes doing exercises — effortful listening work for a CI user — and the app threw it all away without warning. This is a trust-destroying experience. The user will feel cheated and may never return. "Why did I just do all that?" is the exact reaction the tester had.

**Impact:**
- Complete waste of user effort — demoralizing for someone working hard at rehabilitation
- Users won't discover the problem until AFTER they've invested time
- No opportunity to recover the lost data retroactively
- Undermines the core value proposition: "track your progress over time"

**Recommendation:**
1. **Before ANY activity starts in guest mode:** Show a clear modal: "Sign in to save your progress. Guest sessions are not saved."
2. **Better: Require sign-in before activities.** Free tier is fine, but require an email. The app has no value without progress tracking — anonymous usage is pointless.
3. **If guest mode must exist:** Save progress to localStorage AND display it on the Dashboard with a persistent banner: "Your progress is saved locally. Sign in to sync across devices."
4. **After completing an activity in guest mode:** Prompt immediately: "Great work! Sign in now to save your results."

**Related:** F-011 (mandatory sign-in recommendation)

---

### F-011: App should require sign-in — guest mode adds no value
**Severity: P1** | **Category: Product Design / Architecture Decision**
**Pages:** App-wide

**Problem:**
The app currently allows fully anonymous guest usage. But since nothing is tracked or saved in guest mode (see F-010), this creates a misleading experience. Users do exercises, see no results, and feel frustrated.

Guest mode makes sense for a content app (read articles, watch videos). It does NOT make sense for a rehabilitation training app whose entire value is progressive tracking and adaptive difficulty.

**The case for mandatory sign-in:**
- Progress tracking is the core value — without it, the app is just a one-time toy
- Adaptive difficulty (SNR, word complexity) requires persistent user data
- Audiologist sharing requires identity
- Even a minimal email-only sign-up creates accountability and return visits
- Every major training app requires sign-in: Duolingo, Headspace, Apple Fitness+, Lumosity

**Recommendation:**
1. Require email sign-up before accessing activities (not just for progress, but for the app to function as intended)
2. Allow browsing the Practice Hub / Program Library without sign-in (let users see what's available)
3. Block activity start with: "Create a free account to begin training" → email + password
4. Support magic link (email-only, no password) for accessibility — CI users may have dexterity issues
5. Keep the free tier generous — sign-in is about identity, not payment

---

### F-012: "Share with Audiologist" behind paywall — compliance and ethics risk
**Severity: P2** | **Category: Compliance / Product Ethics**
**Page:** Progress (`/progress`)

**Problem:**
The Progress page shows a "Share with Audiologist" button with a lock icon, indicating it requires a paid subscription. This raises concerns:

1. **Clinical ethics:** If a user is tracking rehab progress, sharing with their audiologist is arguably a clinical necessity, not a premium feature. Locking clinical data sharing behind a paywall could be seen as holding medical-adjacent data hostage.
2. **Regulatory language:** The app's regulatory language guide positions SoundSteps as a "training app" not a medical device. But "Share with Audiologist" explicitly frames it as part of clinical care. This tension needs resolution.
3. **User perception:** A CI user who wants to show their audiologist their progress and sees a paywall may feel exploited — "you're charging me to share MY data with MY doctor?"

**Recommendation:**
- **Option A:** Make sharing free for all tiers — it's a trust/safety feature, not premium
- **Option B:** Remove the feature entirely for now — revisit when the product positioning is clearer
- **Option C:** If keeping it paid, rename to something less clinical: "Export Progress Report" and frame it as a convenience, not clinical need
- Consult `docs/REGULATORY_LANGUAGE_GUIDE.md` — does this feature cross the "training app" ↔ "medical device" line?

---

### F-013: Word Pairs cards are unapproachable — clinical names, random counts, unclear icons
**Severity: P1** | **Category: UX / Approachability**
**Page:** Word Pairs activity menu (`/practice/word-pairs` or similar)

**Problem:**
The Word Pairs selection screen presents activities with:
- **Clinical/professional terminology** as titles — intimidating for non-audiologists. Names like "Consonant Voicing Practice" or "Minimal Pair Discrimination" mean nothing to a CI user or family member.
- **Random pair counts** displayed (e.g., 388 pairs, 127 pairs) — not round numbers, feels arbitrary and overwhelming. "388 pairs" sounds exhausting.
- **Unclear icon color coding** — purple lightning bolt vs. blue lightning bolt vs. orange. What do the colors mean? No legend, no explanation.
- **Dark-on-dark card design** — text is legible but cards don't visually pop against the dark background. Low contrast between card and page.
- **No clear indication of what clicking into a card will do** — is it a lesson? A test? How long will it take?

**Impact:** The Word Pairs menu is the gateway to the most clinically valuable part of the app. If users are intimidated by the presentation and don't click in, the whole feature is wasted. "Overwhelming" and "not clear what I'm clicking into" are the exact words from testing.

**Recommendation:**
1. **Rename activities to plain language:** "Consonant Voicing" → "Similar Sounds" or "Spot the Difference." Use subtitles for clinical detail.
2. **Round the pair counts or hide them:** Show "25+ pairs" or "50+ pairs" instead of exact numbers. Or replace with estimated time: "~5 minutes"
3. **Explain icon colors** or simplify to one color. If colors indicate difficulty, add a visible legend.
4. **Increase card contrast:** Add border, subtle gradient, or lighter card background to pop against dark page
5. **Add 1-line description per card:** "Can you tell 'bat' from 'pat'? Practice hearing the difference."

---

### F-014: Voice changes unexpectedly between activities
**Severity: P1** | **Category: Audio / Consistency**
**Pages:** Detection → Word Pairs transition

**Problem:**
The tester completed Detection exercises with a British male voice, then moved to Word Pairs where a female English voice played — with no explanation, no choice, and no way to control it.

This is confusing and potentially harmful for rehabilitation:
- CI users may be training their ear to a specific voice's characteristics
- Switching voices mid-session means the user has to readjust
- Users may think they're doing worse (not recognizing words) when really they're just hearing an unfamiliar voice
- No voice selection is offered before activities start

**Additional note:** The play/listen button on Word Pairs looks different (3D icon style) compared to Detection's flat purple circle. This visual inconsistency adds to the feeling of using disconnected pages.

**Recommendation:**
1. **Persist voice selection across activities** — if a user starts with "British Male," keep that voice unless they change it
2. **Add voice selection to pre-activity briefing** (see F-008) — let users pick or confirm their voice
3. **Show which voice is active** somewhere visible during exercises
4. **Standardize the play button design** across all activities — same icon, same shape, same interaction

**Related:** F-008 (pre-activity briefing should include voice selection)

---

### F-015: Word Pairs session ends after 1 word with absurd praise
**Severity: P0** | **Category: Bug / Session Logic**
**Page:** Word Pairs activity

**Problem:**
In one Word Pairs sub-activity (not the "ben/bent" one), the session completed after a SINGLE word pair. The completion screen showed:
- "Excellent work!"
- "Outstanding performance"
- "You're mastering these skills with confidence"
- 100% accuracy (1 out of 1)

This is laughably wrong. The user got one pair right and was told they're "mastering" the skill. Then they were bounced back to the Word Pairs menu, despite the card showing 388 available pairs.

Meanwhile, a different sub-activity ("ben/bent — Consonant Voicing Practice") showed "1 out of 10" progress, suggesting it has a 10-round session. This inconsistency means session length is either undefined, set to 1 for some activities, or bugged.

**Why this is P0:**
- A session that ends after 1 round is functionally broken
- The hyperbolic praise undermines credibility — users will not trust feedback from the app
- Inconsistent session lengths between sub-activities suggest missing/wrong configuration

**Impact:** Users will think the app is broken (because it is). "Outstanding performance" after 1 round is insulting to someone working hard at rehabilitation.

**Recommendation:**
1. **Minimum session length:** No activity should end in fewer than 5 rounds. Investigate why some end at 1.
2. **Calibrate praise to actual performance:** Scale feedback language to session length AND accuracy:
   - 1-3 rounds: No superlatives. "Good start!" at most.
   - 10+ rounds with 90%+: Then "Excellent" is earned
   - 10+ rounds with 50-70%: "Keep practicing — you're improving"
3. **Standardize session lengths** across all Word Pair sub-activities (see F-007)
4. **Debug the session config:** Why does one activity have 1-round sessions while another has 10?

**Related:** F-007 (undefined session length), F-005 (no progress indicator)

---

### F-016: No per-answer feedback in Word Pairs — can't see what you got right or wrong
**Severity: P1** | **Category: UX / Learning Feedback**
**Page:** Word Pairs activities

**Problem:**
During Word Pairs exercises, when a user selects an answer:
- No indication of correct/incorrect after each answer
- No reveal of the right answer if wrong
- Only at the END of the session is the percentage shown
- No way to review which pairs were missed

This contrasts with Detection, which does show "The word was 'Cheese'" after answering. Word Pairs gives zero per-round feedback.

**Impact for rehabilitation:**
- Users can't learn from mistakes in real-time — they don't know what they got wrong
- The end-of-session percentage is abstract — "70%" means nothing without knowing WHICH words were confused
- CI users need immediate reinforcement to build auditory patterns ("oh, I keep confusing 'bat' and 'pat'")
- Without per-answer feedback, the exercise is just testing, not training

**Design questions to resolve:**
- Do we WANT users to know immediately? (Clinically: yes, for learning. Might slightly inflate scores if users adjust.)
- Should wrong answers replay both words so the user hears the difference?
- Should the app track confusion patterns? (e.g., "You often confuse voiced/voiceless consonants") — this is high-value clinical insight
- Should a post-session review screen show all pairs with results?

**Recommendation:**
1. **Add immediate feedback:** After each answer, briefly show correct/incorrect with the right answer revealed
2. **For wrong answers:** Optionally replay both words so the user hears the contrast
3. **End-of-session review:** Show all pairs with green (correct) / red (missed) indicators
4. **Track confusion patterns** over time — this is the kind of insight that makes the app clinically valuable and worth paying for

---

### F-017: No dev/test mode — can't access locked content for testing
**Severity: P2** | **Category: Developer Experience / Testing**
**Page:** App-wide (all locked/premium content)

**Problem:**
The tester is locked out of all non-free content (Premium Programs, Elite Programs, most activities beyond Word Pairs). There is no:
- Dev login that bypasses tier restrictions
- URL parameter to unlock content (e.g., `?dev=true`)
- Test account with Premium/Elite access
- Feature flag to disable tier checking

This means large portions of the app CANNOT be tested without either:
- Implementing a payment system (not ready)
- Manually updating the database to set a test user's tier

**Impact:** Testing coverage is severely limited. Bugs in premium content will go undetected until real users encounter them.

**Recommendation:**
1. **Quick fix:** Create a test account in Supabase with `subscription_tier = 'Premium'` and share credentials
2. **Better:** Add a dev mode toggle (environment variable `VITE_DEV_UNLOCK_ALL=true`) that bypasses `isLocked()` checks
3. **Best:** Add a `/dev` settings panel (only in dev/staging) with tier override, voice selection, session length controls

---

<!-- New findings go above this line, using F-002, F-003, etc. -->
