# SoundSteps Comprehensive Assessment

> **Date:** 2026-02-07
> **Trigger:** Recovery of 33 documentation files that had been siloed in the iCloud Desktop copy. This assessment cross-references every recovered doc against the live codebase.
> **Assessment scope:** CTO, Chief Designer, Aural Rehab Specialist, Data Engineer, Security Specialist, CMO

---

## Executive Summary

The codebase is **functional and well-structured** (7.5/10 code quality). The clinical audio engine is excellent. But the app has been built without access to its own specifications for weeks, resulting in:

- **3 conflicting Smart Coach algorithms** across docs vs code
- **A LUFS normalization discrepancy** (-18 vs -20) between rules
- **Zero test coverage** (testing.md requires 80%)
- **42 regulatory language violations** ("clinical" in user-facing code)
- **Purple/gradient UI** when the design system mandates teal/flat
- **Dead code and legacy references** to deprecated voices (marcus, david)
- **Missing infrastructure**: no `browserDetect.ts`, no `LoadingSpinner`, no `ErrorMessage` component
- **~7,700 audio files still needed** (sentences v2 + scenarios)

With 500K ElevenLabs credits, the audio gap is trivially closeable. The code and design gaps require focused work.

---

## 1. CTO Assessment — Architecture & Code Quality

### 1.1 Smart Coach Algorithm: THREE DIFFERENT SPECS

This is the most dangerous discrepancy. Three sources define the adaptive algorithm differently:

| Source | Trigger | Up Threshold | Down Threshold | Step Size |
|--------|---------|-------------|----------------|-----------|
| `core_docs/2_DATA_SPEC.md` | "Last 10 trials" | >85% | <60% | Not specified |
| `docs/rules/10_CLINICAL_CONSTANTS.md` | Every 10 trials | ≥80% (8/10) | ≤50% (5/10) | **5 dB** |
| `src/lib/api.ts` (ACTUAL CODE) | Caller-decided | ≥80% | ≤50% | **2 dB** |

**Impact:** A 5 dB step vs 2 dB step is clinically significant. A 5 dB step means the app adapts aggressively (3 steps from +20 to +5). A 2 dB step means gentle adaptation (5 steps for the same range). Both are valid clinical approaches, but the specs must agree.

**Recommendation:** Adopt the `10_CLINICAL_CONSTANTS.md` values (80%/50%/5 dB) as canonical — they're the most clinically specific document. Update `api.ts` to use `SNR_STEP = 5`. Update `2_DATA_SPEC.md` to match.

### 1.2 LUFS Normalization: -18 vs -20

| Source | Target |
|--------|--------|
| `.claude/rules/audio.md` | **-18 LUFS** |
| `.claude/skills/audio-workflow.md` | **-18 LUFS (target), -20 acceptable** |
| `docs/rules/00_MASTER_RULES.md` | **-20 LUFS** |
| `docs/rules/10_CLINICAL_CONSTANTS.md` | **-20 LUFS** |
| `core_docs/1_TECH_SPEC.md` | **-20 LUFS** |
| `docs/AUDIO_MASTER_INVENTORY.md` | **-20 LUFS** |
| `docs/VOICE_LIBRARY.md` | **-20 LUFS** |
| `docs/CLINICAL_NOISE_SPEC.md` | **-20 dB FS RMS** |

**Impact:** 2 dB difference affects SNR math. If speech is at -18 LUFS and noise is normalized to -20 LUFS, the actual SNR is 2 dB higher than the display shows.

**Recommendation:** Standardize on **-20 LUFS** (5 of 7 sources agree). Update `.claude/rules/audio.md` and `.claude/skills/audio-workflow.md` to say `-20 LUFS`.

### 1.3 Zero Test Coverage

`testing.md` mandates 80% coverage with Vitest + Testing Library + Playwright. The codebase has **zero test files** — no `.test.ts`, no `.spec.ts`, nothing.

**What needs tests (priority order):**

| Priority | What | Why |
|----------|------|-----|
| P0 | `src/lib/api.ts` (Smart Coach) | Clinical algorithm — wrong math = wrong difficulty |
| P0 | `src/hooks/useSNRMixer.ts` | Audio engine — gain calculation must be exact |
| P1 | `src/hooks/useProgressData.ts` | Data aggregation — wrong stats = misleading feedback |
| P1 | `src/hooks/useAudio.ts` | Audio lifecycle — memory leaks, error states |
| P1 | `src/store/UserContext.tsx` | Auth flow — tier gating, guest migration |
| P2 | `src/hooks/useActivityData.ts` | Data fetching — URL construction, voice fallback |
| P2 | Page components (Detection, RapidFire) | User flows — session length, scoring |
| P3 | UI components | Rendering, accessibility |

### 1.4 `console.log` in Production

26 `console.log` statements across 9 files. `security.md` says: "No console.log in production."

**Files:** main.tsx(1), ClinicalReport.tsx(1), useProgress.ts(1), haptics.ts(4), syncService.ts(4), ScenarioPlayer.tsx(1), UserContext.tsx(4), useSNRMixer.ts(7), RapidFire.tsx(3)

**Recommendation:** Replace with a logger utility that's silent in production, or gate behind `import.meta.env.DEV`.

### 1.5 TypeScript `any` Usage

7 occurrences across 5 files. `coding-style.md` says: "no `any`."

**Files:** CategoryPlayer.tsx(3), ProgressChart.tsx(1), AuthModal.tsx(1), useProgressData.ts(1), useProgressByActivity.ts(1)

### 1.6 Dead Code

| File | Issue | Action |
|------|-------|--------|
| `src/hooks/useAudioPlayer.ts` | Never imported, imports non-existent `FileSystemService` | Delete |
| `src/pages/ClinicalReport.tsx` | Not in routes, not imported | Delete |
| `src/lib/audioUtils.ts` | Legacy, references deprecated voices (david, marcus) | Delete (all callers use `lib/audio.ts` now) |
| `src/hooks/useAudioMixer.ts` | `updateVolumes()` not implemented, superseded by `useSNRMixer` | Assess — may be used by some page |

### 1.7 Missing Infrastructure Referenced in Docs

| Component | Referenced In | Exists? |
|-----------|--------------|---------|
| `LoadingSpinner` | `react-patterns.md` | No — pages use inline `<div>Loading...</div>` |
| `ErrorMessage` | `react-patterns.md` | No — pages use inline error text |
| `src/lib/browserDetect.ts` | `BROWSER_COMPATIBILITY.md` | No |
| `src/components/primitives/` | `DESIGN_SYSTEM.md` component library | No — directory doesn't exist |
| `src/components/visualizers/` | `DESIGN_SYSTEM.md` component library | No — AuraVisualizer is in `components/ui/` |
| `src/components/feedback/` | `DESIGN_SYSTEM.md` component library | No — SessionSummary is in `components/` root |

### 1.8 Error Handling Inconsistency

11+ different patterns across 15+ hooks (per audit). `coding-style.md` says: "Always wrap async in try/catch, show user-friendly messages."

**Recommendation:** Create a shared `handleError(error, context)` utility. Standardize all hooks on a single `{data, loading, error}` return pattern.

---

## 2. Chief Designer Assessment — Design System Alignment

### 2.1 Screens Violating the Aura Design System

(Cross-referenced against `docs/STYLE_GUIDE.md`, `docs/DESIGN_SYSTEM.md`, `core_docs/4_DESIGN_SYSTEM.md`)

| Screen | Violations | Severity |
|--------|-----------|----------|
| **Layout.tsx** | Purple gradient orbs (`bg-purple-500/20`) visible on every page | CRITICAL — sets wrong tone globally |
| **Dashboard.tsx** | Purple Quick Start (`from-violet-500 to-purple-600`), `font-black`, gradient aura | CRITICAL — first thing users see |
| **SessionSummary.tsx** | Purple gradient CTA (`from-violet-600 to-purple-700`), gradient stat cards | HIGH |
| **ActivityBriefing.tsx** | Purple glow button (`shadow-purple-500/30`) | HIGH |
| **Detection.tsx** | Play button likely purple gradient, colored shadows | MEDIUM |
| **RapidFire.tsx** | Play button likely purple gradient, colored shadows | MEDIUM |
| **GrossDiscrimination.tsx** | Purple play button, AuraVisualizer glows | MEDIUM |
| **CategoryLibrary.tsx** | Per-card gradient accent orbs | MEDIUM |
| **SmartCoachFeedback.tsx** | Action-specific gradient backgrounds, Sparkles icon | MEDIUM |
| **WelcomeScreen.tsx** | `font-black` (should be `font-bold`), orbs acceptable for hero screen | LOW |
| **ProgramLibrary.tsx** | Uses "clinical training pathways" text (regulatory violation too) | MEDIUM |

### 2.2 What the Design System Specifies vs What Exists

| Spec | Design System Says | Code Does | Gap |
|------|-------------------|-----------|-----|
| Primary CTA | Solid teal `bg-teal-500`, pill shape, optional glow | Purple gradient `from-violet-500 to-purple-600` | Full replacement |
| Play button | Solid teal, rounded-full, no colored shadow | Purple gradient + `shadow-purple-500/30` | Full replacement |
| Background | Clean `bg-slate-950`, no decorative orbs | Purple gradient orbs in Layout.tsx | Remove orbs |
| Cards | `bg-slate-900 border-slate-800`, no gradients | Some use gradient borders/backgrounds | Flatten |
| Headings | `font-bold` (700 max) | `font-black` (900) in Dashboard, WelcomeScreen | Downgrade |
| Touch targets | 48px minimum, 54px preferred | Some buttons 28-32px | Enlarge |
| Typography | Display 36px weight 900, H1 30px weight 700 | Mix of sizes/weights | Standardize |
| Focus states | `outline: 2px solid #00A79D` | Not consistently applied | Add |
| `prefers-reduced-motion` | Must be respected | Not implemented | Add |

### 2.3 `tokens.ts` Is Not Used Anywhere

The design token file (`src/styles/tokens.ts`) exists but **no component imports it**. The `DESIGN_SYSTEM.md` shows usage like `tokens.colors.brand.teal` — this pattern isn't implemented.

**Recommendation:** Don't force-adopt tokens.ts right now. The Tailwind config already has the correct values. Use `tokens.ts` when/if you move to a component library or need programmatic token access. For now, Tailwind classes are the token layer.

### 2.4 Component Library Structure Gap

`DESIGN_SYSTEM.md` specifies:
```
src/components/
├── primitives/     # Button, Card, Input, Modal
├── ui/             # ActivityHeader, AudioPlayer, QuizCard
├── auth/           # AuthModal
├── feedback/       # SessionSummary, SmartCoachFeedback
└── visualizers/    # Aura, AudioVisualizer
```

**Actual structure:**
```
src/components/
├── ui/             # Mixed: ActivityHeader, AudioPlayer, QuizCard, SNRMixer, etc.
├── auth/           # AuthModal ✓
├── (root)          # SessionSummary, WelcomeScreen, ErrorBoundary, Layout, etc.
```

Missing: `primitives/`, `feedback/`, `visualizers/`. Not blocking, but the intended organization is clear.

---

## 3. Aural Rehab Specialist Assessment — Clinical Accuracy

### 3.1 Erber Hierarchy Implementation

The app implements 4 of Erber's 4 levels:

| Erber Level | Activity | Status | Clinical Accuracy |
|-------------|----------|--------|-------------------|
| 1. Detection | Detection.tsx | ✅ Implemented | Good — 70/30 sound/silence ratio, 10-item sessions |
| 2. Discrimination | GrossDiscrimination.tsx, CategoryPlayer.tsx, RapidFire.tsx | ✅ Implemented | Good — syllable-count pairing, minimal pairs by category |
| 3. Identification | SentenceTraining.tsx | ✅ Implemented | Adequate — needs more sentence v2 content |
| 4. Comprehension | StoryPlayer.tsx, ScenarioPlayer.tsx | ✅ Implemented | Good — karaoke alignment, multi-speaker |

### 3.2 Audio Content Gaps (Where 500K Credits Should Go)

| Content Type | Have | Need | Gap | Priority | ElevenLabs Cost Est. |
|-------------|------|------|-----|----------|---------------------|
| Sentences v2 | 2,790 | 5,652 | **2,862 files** | HIGH | ~28K credits |
| Scenarios | 15 | 544 | **529 files** | HIGH | ~53K credits |
| Noise: Tier 2 (modulated, competing talker) | 0 | 3 | **3 files** | MEDIUM | ~300 credits |
| Noise: Tier 3 (doctor, grocery, transit) | 0 | 3 | **3 files** | MEDIUM | ~300 credits |
| Carrier phrase re-gen (F-009) | 0 | ~16,000 | **~16,000 files** | P0 | ~160K credits |

**Total estimated credits needed: ~242K** (well within 500K budget)

### 3.3 F-009: Carrier Phrase Contamination (P0)

Per `10_CLINICAL_CONSTANTS.md`, carrier phrases ("The next word is...") should be trimmed with `librosa.effects.split`. The `TESTING_FINDINGS.md` documents ~80% contamination of word files.

**Impact:** Carrier phrases before target words give CI users extra processing time and contextual cues, inflating accuracy scores. This makes the Smart Coach think users are performing better than they actually are.

**Recommendation:** This is the #1 audio priority. Regenerate affected word files using the verification pipeline spec'd in `1_TECH_SPEC.md`. With 500K credits, regenerating all 20K word files costs ~200K credits.

### 3.4 SNR Mixing — Code Is Clinically Sound

`useSNRMixer.ts` correctly implements:
- Speech gain always 1.0 (per `10_CLINICAL_CONSTANTS.md`)
- Noise gain = `10^(-SNR/20)` (correct dB-to-linear)
- Range clamped [-10, +20] dB
- Silent Sentinel (0.0001 gain for Bluetooth keepalive)
- Continuous noise bed (clinically valid — babble should be ongoing, not restarted per trial)

### 3.5 Session Length Inconsistency

| Activity | Session Length | Smart Coach Block Size |
|----------|--------------|----------------------|
| Detection | 10 items | N/A (no noise) |
| GrossDiscrimination | 15 items | N/A (no noise) |
| RapidFire | 15 items | 10 trials |
| `10_CLINICAL_CONSTANTS.md` | — | **10 trials** |

RapidFire's 15-item session means the Smart Coach fires after trial 10 but the session continues for 5 more trials at the **new** difficulty. This is actually fine clinically — the adjustment just happens mid-session rather than between sessions.

---

## 4. Data Engineer Assessment — Schema & Data Flow

### 4.1 Schema Tables (Cross-Referenced Against `2_DATA_SPEC.md`)

| Table | Spec Says | Exists in Code? | Used? |
|-------|-----------|-----------------|-------|
| `profiles` | Auth extension, subscription_tier, audiogram_data | ✅ (UserContext reads it) | Yes |
| `stimuli_catalog` | Master content list | ✅ (6+ hooks query it) | Yes |
| `audio_assets` | Links content to storage URLs, `verified_rms_db` | ✅ (SessionPlayer, SentenceTraining join it) | Yes |
| `user_trials` | Immutable interaction log | ✅ (useStimuli has `useTrialLogger`) | Yes |
| `user_progress` | Progress tracking | ✅ (useProgress, useProgressData) | Yes |
| `word_pairs` | Word pair content | ✅ (CategoryPlayer, useActivityData) | Yes |
| `noise_assets` | Noise file metadata | ✅ (api.ts queries it) | Yes |
| `programs` | Training programs | ✅ (ProgramLibrary) | Yes |
| `noise_assets` spectral columns | Per `CLINICAL_NOISE_SPEC.md` ALTER TABLE | ❓ Unknown | Check DB |

### 4.2 Data Quality Concerns

1. **`verified_rms_db` not used in code:** The `2_DATA_SPEC.md` and `1_TECH_SPEC.md` specify that `audio_assets.verified_rms_db` should be used for precise SNR mixing. The current `useSNRMixer` assumes all speech is at 0 dB (gain 1.0) and calculates noise gain from that. If speech files have varying actual levels, the displayed SNR will be inaccurate.

2. **Guest data isolation:** Guest progress in localStorage is keyed simply (`guest_current_snr`, `guest_total_trials`). If a user has multiple browsers or clears data, everything is lost. Per findings, this is F-010 (P0).

3. **Schema version ambiguity:** `useProgressData` has fallback code for both `condition_snr` (v5) and `content_tags.snr` (current). This suggests a migration happened but old data still exists.

### 4.3 Missing Edge Function

`1_TECH_SPEC.md` Phase 4 specifies a `log_progress` **Supabase Edge Function** to prevent client-side data tampering. Currently, all progress logging goes directly from the client to the `user_progress` table. RLS policies are the only protection.

**Risk level:** Low for a training app (not competitive/monetized), but worth noting for audiologist-facing reports where data integrity matters.

---

## 5. Security Specialist Assessment

### 5.1 Credential Safety: PASS

- No hardcoded API keys, passwords, or secrets in source
- Supabase anon key is public by design (RLS enforces access)
- `.env.example` exists with placeholders
- `.env.local` is gitignored

### 5.2 Regulatory Language Violations: FAIL

`regulatory.md` bans "clinical" in user-facing text. Found **42+ instances** of "clinical" in .tsx files:

| File | Count | User-Facing? |
|------|-------|-------------|
| `SessionPlayer.tsx` | 9 | No — database column name `clinical_metadata` |
| `SentenceTraining.tsx` | 9 | No — database column name |
| `ClinicalReport.tsx` | 6 | **YES — page title "Clinical Report"** |
| `ProgramLibrary.tsx` | 1 | **YES — "Curated clinical training pathways"** |
| `CategoryLibrary.tsx` | 3 | No — database column name |
| `CategoryPlayer.tsx` | 3 | No — database column name |
| `RapidFire.tsx` | 4 | No — function name `getClinicalBabble` |
| `GrossDiscrimination.tsx` | 1 | No — metadata field |
| `SNRMixerTest.tsx` | 6 | Dev-only page |
| `ProgressSummary.tsx` | 1 | No — hook name `useClinicalSummary` |
| `ProgressChart.tsx` | 1 | No — comment |

**User-facing violations requiring immediate fix:**
1. `ClinicalReport.tsx` — dead code, delete it
2. `ProgramLibrary.tsx:134` — "Curated clinical training pathways" → "Curated training pathways"

**Database column names** (`clinical_metadata`, `clinical_category`) are internal and not user-facing. They're fine from a regulatory perspective but could be renamed for consistency if doing a migration.

**Function/hook names** (`getClinicalBabble`, `useClinicalSummary`) are code-internal. Low risk but worth renaming for consistency with regulatory posture.

### 5.3 User-Facing Disclaimers: PASS

`ProgressReport.tsx`, `PrivacyPolicy.tsx`, and `TermsOfService.tsx` all contain the required disclaimer: "SoundSteps is designed for hearing training and practice. It is not intended to diagnose, treat, cure, or prevent any medical condition."

### 5.4 Input Validation

- Supabase client sanitizes env vars (`.replace(/[\n\r\s]+/g, '')` in `lib/supabase.ts`)
- No user-generated URLs passed to audio elements
- No raw HTML rendering (React escapes by default)
- RLS policies enforce data access

### 5.5 Missing: `prefers-reduced-motion` Support

`DESIGN_SYSTEM.md` mandates respecting `prefers-reduced-motion`. The codebase uses Framer Motion extensively but never checks this media query. Users with vestibular disorders or motion sensitivity could have negative experiences.

---

## 6. CMO Assessment — Brand, Launch Readiness, Market Position

### 6.1 Brand Alignment

`core_docs/3_BRAND_STRATEGY.md` positions SoundSteps as "The Apple of Hearing." The current UI with purple gradients and glowing orbs reads more like a gaming app. The brand promise and the product visual don't match.

**Growth Loops spec'd but not built:**

| Loop | Status | What's Needed |
|------|--------|---------------|
| **The Spouse Loop** | Not built | Voice recording portal where a partner records their voice; app generates exercises with it |
| **The Prescription Pad** | Not built | PDF resource for audiologists to "prescribe" the app |

The Spouse Loop is a powerful differentiator. With 500K ElevenLabs credits, generating personalized voice exercises from recorded samples is technically feasible using ElevenLabs voice cloning.

### 6.2 Launch Readiness (per `docs/LAUNCH_STRATEGY.md`)

| Requirement | Status |
|-------------|--------|
| LLC formed | ❓ Unknown (guide exists at `docs/LLC_FORMATION_GUIDE.md`) |
| Privacy Policy | ✅ Published (`PrivacyPolicy.tsx`) |
| Terms of Service | ✅ Published (`TermsOfService.tsx`) |
| Pricing tiers ($7.99/$14.99) | ❓ Defined in docs, not in Stripe/payment integration |
| Tier gating in UI | ✅ `hasAccess()` check in `ActivityList.tsx` |
| App Store submission (iOS) | ❌ Guide exists, not submitted |
| Play Store submission (Android) | ❌ Guide exists, not submitted |
| Audiologist report PDF | ❌ ClinicalReport.tsx is dead code |

### 6.3 Content Completeness for Launch

| Content Type | Launch-Ready? | Gap |
|-------------|---------------|-----|
| Word Pairs (20K files) | ✅ Yes (if carrier phrases fixed) | F-009 regen |
| Stories (440 files) | ✅ Yes | — |
| Conversations (1,400 files) | ✅ Yes | — |
| Sentences v1 (5,659 files) | ✅ Yes | — |
| Sentences v2 | ❌ 49% complete | 2,862 files needed |
| Scenarios | ❌ 3% complete | 529 files needed |
| Noise assets | ⚠️ Tier 1 only | Tier 2-3 noise missing |
| Phoneme Drills (3,600 files) | ✅ Yes | — |

---

## 7. Prioritized Action Plan

### P0 — Must Fix Before Any Launch

| # | Action | Domain | Effort | Impact |
|---|--------|--------|--------|--------|
| 1 | **Reconcile Smart Coach algorithm** — standardize on 80%/50%/5dB per `10_CLINICAL_CONSTANTS.md`, update `api.ts` | Clinical/Code | 1 hour | Clinical accuracy |
| 2 | **Standardize LUFS to -20** — update `audio.md` and `audio-workflow.md` | Audio/Docs | 15 min | Prevents spec confusion |
| 3 | **Regenerate carrier-phrase-contaminated word files** (F-009) — build verification pipeline per `1_TECH_SPEC.md`, regen with 500K credits | Audio | 2-3 days | Clinical validity of all word exercises |
| 4 | **Fix regulatory language** — delete `ClinicalReport.tsx`, fix "clinical" in `ProgramLibrary.tsx` | Regulatory | 30 min | FDA posture |
| 5 | **Design alignment sweep** — replace all purple CTAs with teal, remove gradient orbs from Layout.tsx, flatten gradient cards | Design | 4-6 hours | Brand alignment |

### P1 — Should Fix Before Launch

| # | Action | Domain | Effort | Impact |
|---|--------|--------|--------|--------|
| 6 | **Add test coverage** — start with Smart Coach (`api.ts`) and SNR mixer | Testing | 2-3 days | Prevents regressions |
| 7 | **Remove dead code** — `useAudioPlayer.ts`, `ClinicalReport.tsx`, `audioUtils.ts` | Code quality | 30 min | Reduces confusion |
| 8 | **Remove `console.log`** from production paths (26 instances) | Security | 1 hour | Production hygiene |
| 9 | **Eliminate `any` types** (7 instances) | Code quality | 1 hour | Type safety |
| 10 | **Add `prefers-reduced-motion` support** | Accessibility | 2 hours | A11y compliance |
| 11 | **Generate remaining Sentences v2** (~2,862 files) | Content | 1 day (scripted) | Completes Erber Level 4 |
| 12 | **Generate remaining Scenarios** (~529 files) | Content | 1-2 days | Completes ecological training |
| 13 | **Create `LoadingSpinner` and `ErrorMessage` components** | Code quality | 1 hour | Eliminates inline loading/error states |
| 14 | **Guest mode warning** (F-010) — warn users their progress won't persist | UX | 1 hour | Prevents frustration |

### P2 — Should Do Before Scaling

| # | Action | Domain | Effort | Impact |
|---|--------|--------|--------|--------|
| 15 | **Generate Tier 2-3 noise assets** (modulated, competing talker, scenarios) | Audio/Clinical | 1 day | Advanced difficulty levels |
| 16 | **Build `browserDetect.ts`** per `BROWSER_COMPATIBILITY.md` | Infrastructure | 2 hours | iOS/Android detection |
| 17 | **Standardize error handling** — create shared handler, refactor hooks | Code quality | 3-4 hours | Maintainability |
| 18 | **Implement `verified_rms_db` in SNR mixing** per `2_DATA_SPEC.md` | Clinical accuracy | 2-3 hours | More precise SNR |
| 19 | **Payment/Stripe integration** for tier gating | Launch | 2-3 days | Monetization |
| 20 | **Implement cloud sync** (`syncService.ts` is all stubs) | Infrastructure | 3-5 days | Multi-device support |
| 21 | **Organize component directory** per `DESIGN_SYSTEM.md` structure | Code organization | 2 hours | Developer experience |
| 22 | **Add focus states** (`outline: 2px solid #00A79D`) globally | Accessibility | 1-2 hours | Keyboard navigation |

### P3 — Growth Features

| # | Action | Domain | Effort | Impact |
|---|--------|--------|--------|--------|
| 23 | **The Spouse Loop** — voice recording portal + ElevenLabs voice cloning | Growth/Product | 1-2 weeks | Key differentiator |
| 24 | **The Prescription Pad** — audiologist PDF resource | Growth/Marketing | 1-2 days | Channel acquisition |
| 25 | **Audiologist Report** — rebuild ClinicalReport as proper PDF export | Product | 3-5 days | B2B value |
| 26 | **App Store submissions** (iOS + Android) | Launch | 2-3 days | Distribution |
| 27 | **Edge Function for progress logging** per `1_TECH_SPEC.md` | Data integrity | 1 day | Tamper-proof logs |
| 28 | **Clinical validation** with 5-10 CI users per `CLINICAL_NOISE_SPEC.md` | Clinical | 1-2 weeks | Evidence base |

---

## 8. ElevenLabs 500K Credits Deployment Plan

| Priority | Asset | Files Needed | Est. Credits | Notes |
|----------|-------|-------------|-------------|-------|
| P0 | Word pair regen (carrier phrase fix) | ~16,000 | ~160,000 | Regenerate all contaminated files |
| P1 | Sentences v2 completion | ~2,862 | ~28,000 | 9 voices × ~318 sentences |
| P1 | Scenarios completion | ~529 | ~53,000 | Multi-speaker, longer clips |
| P2 | Noise Tier 2 (modulated, competing) | 3 | ~300 | Sound effects API |
| P2 | Noise Tier 3 (doctor, grocery, transit) | 3 | ~300 | Sound effects API |
| P3 | Spouse Loop voice cloning exercises | Variable | ~50,000 | Per-user generation |
| **Total** | | ~19,400 | **~291,600** | **58% of budget** |

Remaining credits (~208K) available for: iteration, quality fixes, new voices, additional content types.

---

## 9. Documentation Conflicts to Resolve

| Conflict | Source A | Source B | Resolution |
|----------|---------|---------|------------|
| Smart Coach step size | `10_CLINICAL_CONSTANTS.md`: 5 dB | `api.ts`: 2 dB | Adopt 5 dB, update code |
| Smart Coach thresholds | `2_DATA_SPEC.md`: 85%/60% | `10_CLINICAL_CONSTANTS.md`: 80%/50% | Adopt 80%/50%, update data spec |
| LUFS target | `audio.md`: -18 | 5 other docs: -20 | Adopt -20, update audio.md |
| Touch target minimum | `20_DESIGN_TOKENS.md`: 54px | `UI_REVIEW_CHECKLIST.md`: 48px | Adopt 48px minimum, 54px preferred |
| Display heading weight | `DESIGN_SYSTEM.md`: 900 (Black) | `STYLE_GUIDE.md`: "never font-black" | Allow 900 for Display (36px hero) only, 700 max everywhere else |
| Voice IDs | `audio-check.md`: "marcus, david" | `audio.md`: 9-voice roster | Update audio-check to current roster |
| Doc hierarchy | `INSTRUCTIONS.md`: "core_docs/ is ABSOLUTE TRUTH" | `STYLE_GUIDE.md`: standalone | Enforce hierarchy — core_docs > docs > code |

---

## 10. Files to Delete

| File | Reason |
|------|--------|
| `src/pages/ClinicalReport.tsx` | Dead code + regulatory violation ("Clinical Report") |
| `src/hooks/useAudioPlayer.ts` | Dead code, imports non-existent modules |
| `src/lib/audioUtils.ts` | Legacy, references deprecated voices, superseded by `lib/audio.ts` |

## 11. Files to Create

| File | Purpose |
|------|---------|
| `src/components/ui/LoadingSpinner.tsx` | Reusable loading indicator (replace inline states) |
| `src/components/ui/ErrorMessage.tsx` | Reusable error display (replace inline states) |
| `src/lib/browserDetect.ts` | Platform detection per `BROWSER_COMPATIBILITY.md` |
| `src/lib/logger.ts` | Production-safe logging (replaces raw console.log) |
| `src/__tests__/api.test.ts` | Smart Coach unit tests |
| `src/__tests__/useSNRMixer.test.ts` | Audio engine unit tests |

---

*This assessment should be reviewed alongside `docs/TESTING_FINDINGS.md` which tracks 17 specific UX findings and their fix status.*
