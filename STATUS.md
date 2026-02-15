# SoundSteps - Current Status

> **Last Updated:** 2026-02-14
> **Last Session:** Session 28 — Design System Primitives + Identity Polish
> **Build Status:** ✅ PASSING
> **Deployment:** ✅ DEPLOYED — pushed to main (Vercel auto-deploy)
> **Tests:** ✅ 31 PASSING (Vitest)
> **Testing:** 27 findings tracked in `docs/TESTING_FINDINGS.md` (25 fixed, 0 open, 1 deferred, 1 superseded)
> **Data Engine:** Sprint 1 ✅ (per-trial logging) | Sprint 2 ✅ (analytics cards) | Sprint 3 ✅ Phases A-C (phoneme mastery, longitudinal, export) | Phase D planned (weekly email)
> **Today's Practice:** ✅ COMPLETE — hero card + 2-step navigation sequencer + dynamic nextActivity on 5 activities
> **Placement Assessment:** ✅ COMPLETE — 10-trial Listening Check across 4 Erber levels at `/placement`
> **Marketing:** ✅ Strategy doc + 5 skills + MCP setup guide
> **Branding:** ✅ Logo v1 integrated — favicon, PWA icons, nav header, WelcomeScreen, PlacementAssessment. Gradients purged (0 remaining).
> **Design System:** Phase 1 ✅ (Satoshi font, deeper teal, haptics, ring burst) | Phase 2 ✅ (Button/Card primitives, full adoption across 14 files, QuizCard dark-mode fix, brand token purge, SNRMixer dark-mode alignment)

---

## Quick Start for New Sessions

```
1. Read STATUS.md (this file)
2. For voice/audio questions, see docs/VOICE_LIBRARY.md (CRITICAL architecture info)
3. For infrastructure, see docs/INFRASTRUCTURE_AUDIT.md
4. Deploy: git push to main (auto-deploys via Vercel)
```

---

## 🚀 DEPLOYED - 2026-02-06

### What's Live
- **Code Splitting:** Bundle reduced from 797KB → 272KB + vendor chunks
- **9-Voice Roster:** All voices working (sarah, emma, bill, michael, alice, daniel, matilda, charlie, aravind)
- **Hard Mode:** Toggle in Settings to hide answers until audio plays
- **Tier Locking:** Activities gated by subscription (Free/Standard/Premium)
- **Progress Reports:** /progress page with charts and print-to-PDF

### Known Issues (Low Priority)
- PWA meta tag deprecation warning in console
- Auth spinner on login (cosmetic)

### Deployment
Git push to `main` auto-deploys to production via Vercel.

---

## ✅ Session 28: Design System Primitives + Full Adoption (COMPLETE)

### What Was Done

**Part A — Button/Card Primitives Created**
- Created `src/components/primitives/Button.tsx` — 3 variants (primary/secondary/ghost) × 3 sizes (sm/md/lg), auto `hapticSelection()` on click, `forwardRef`, uses `cn()` from `@/lib/utils` for class merging via clsx + tailwind-merge
- Created `src/components/primitives/Card.tsx` — 3 variants (default/highlighted/subtle), configurable `padding` prop (default `p-6`), uses `cn()`
- Created `src/components/primitives/index.ts` — barrel export

**Part B — Initial Primitive Migration + Brand Token Purge**
- `ActivityBriefing.tsx` — Card (subtle) + Button (lg)
- `ErrorBoundary.tsx` — 2 Buttons (primary + secondary)
- `WelcomeScreen.tsx` — Button (ghost for "Skip for now")
- `Player.tsx` — 2 brand-* → teal-500/slate-200
- `AudioPlayer.tsx` — 5 brand-* → teal-500/teal-400/red-400/slate-400
- `SNRMixer.tsx` — 6 brand-* + full dark-mode realignment (bg-white→bg-slate-900, bg-gray-50→bg-slate-800/50)
- `QuizCard.tsx` — 3 primary-* → teal-500/10, teal-300
- `AudioQA.tsx` — 1 primary-600 → teal-500
- `tailwind.config.js` — Removed entire legacy `brand` block (red #FF6B6B, yellow #FFD93D, purple #6C5CE7) + `primary`/`secondary`/`success`/`error` palette blocks. CSS bundle -1.1KB.

**Part C — QuizCard Dark-Mode Fix (9 class replacements)**
- `text-gray-900` → `text-slate-200`
- `border-gray-200 hover:border-teal-300 hover:bg-teal-50` → `border-slate-700 hover:border-teal-500 hover:bg-teal-500/10`
- `border-gray-100 bg-gray-50` → `border-slate-700 bg-slate-800`
- `border-green-500 bg-green-50 text-green-800` → `border-green-500 bg-green-500/10 text-green-400`
- `border-red-500 bg-red-50 text-red-800` → `border-red-500 bg-red-500/10 text-red-400`
- `border-green-200 bg-green-50/50 text-green-700` → `border-green-700 bg-green-500/5 text-green-500`
- `border-gray-100` → `border-slate-700`
- `bg-blue-50 text-blue-800` → `bg-teal-500/10 text-teal-300`
- `bg-teal-50` → `bg-teal-500/10`

**Part D — Full Primitive Adoption (14 Buttons + 13 Cards across 11 additional files)**

Button migrations:
- `RequireAuth.tsx` — 1 primary Button ("Sign In or Create Account")
- `TodaysPracticeCard.tsx` — 4 Buttons (1 secondary + 3 primary)
- `AuthModal.tsx` — 1 Button (SubmitButton internal component)
- `ResetPassword.tsx` — 3 Buttons (2 primary + 1 secondary)
- `PlacementAssessment.tsx` — 4 Buttons
- `StoryPlayer.tsx` — 1 Button ("Next"/"Finish" quiz submit)

Card migrations:
- `ProgressChart.tsx` — 2 subtle Cards (empty state + chart container)
- `CategoryPlayer.tsx` — 1 subtle Card (autoplay toggle)
- `SessionPlayer.tsx` — 1 subtle Card (autoplay toggle)
- `PlacementAssessment.tsx` — 3 default Cards (Erber levels, question, recommendation)
- `ResetPassword.tsx` — 3 default Cards
- `CategoryLibrary.tsx` — 1 default Card (category item)

### Exclusion Rules (why some elements were NOT migrated)
- `motion.div` / `motion.button` / `motion.a` — can't replace without losing Framer Motion animations
- `<Link>` elements styled as buttons — Button renders `<button>`, not `<a>`
- Play circle buttons, answer grid buttons, toggle switches — specialized interactions
- Analytics cards — have `print:` styles and `bg-white dark:bg-slate-900` dual-mode for PDF export
- `AudioQA.tsx` — dev-only page, low priority for dark-mode alignment

### Files Modified (14 total)
| File | Button | Card | Brand Purge | Dark-Mode Fix |
|------|--------|------|-------------|---------------|
| `src/components/primitives/Button.tsx` | NEW | | | |
| `src/components/primitives/Card.tsx` | | NEW | | |
| `src/components/primitives/index.ts` | NEW | | | |
| `src/components/ActivityBriefing.tsx` | 1 | 1 | | |
| `src/components/ErrorBoundary.tsx` | 2 | | | |
| `src/components/WelcomeScreen.tsx` | 1 | | | |
| `src/components/RequireAuth.tsx` | 1 | | | |
| `src/components/TodaysPracticeCard.tsx` | 4 | | | |
| `src/components/auth/AuthModal.tsx` | 1 | | | |
| `src/components/ProgressChart.tsx` | | 2 | | |
| `src/components/ui/QuizCard.tsx` | | | 3 | 9 replacements |
| `src/components/ui/AudioPlayer.tsx` | | | 5 | |
| `src/components/ui/SNRMixer.tsx` | | | 6 | full realignment |
| `src/pages/Player.tsx` | | | 2 | |
| `src/pages/AudioQA.tsx` | | | 1 | |
| `src/pages/ResetPassword.tsx` | 3 | 3 | | |
| `src/pages/PlacementAssessment.tsx` | 4 | 3 | | |
| `src/pages/StoryPlayer.tsx` | 1 | | | |
| `src/pages/CategoryPlayer.tsx` | | 1 | | |
| `src/pages/SessionPlayer.tsx` | | 1 | | |
| `src/pages/CategoryLibrary.tsx` | | 1 | | |
| `tailwind.config.js` | | | legacy blocks removed | |

**Total: 3 new files, 18 modified files. 18 Buttons + 14 Cards + 17 brand-token fixes + 9 QuizCard dark-mode fixes.**

### Verification
- `npm run build` — passes clean (5.16s, CSS 56.28KB)
- 0 `brand-*` classes remaining in `.tsx` files
- 0 `primary-N` / `secondary-N` tokens remaining
- 0 `bg-gray-50` / `bg-blue-50` / `text-gray-900` / `border-gray-200` remaining in QuizCard
- `tokens.ts` still has `brand: { teal, amber }` — this is Aura palette, NOT legacy. Kept intentionally.

---

## ✅ Sprint 3: World-Class Data Engine (Phases A-C COMPLETE)

**Full plan:** `.claude/plans/splendid-riding-wombat.md`

**Phase A — Phoneme Intelligence + Recommendations: ✅ COMPLETE**
- [x] `usePhonemeAnalytics` hook — lifetime RapidFire phoneme-pair mastery, confusion matrix, position breakdown
- [x] `PhonemeMasteryGrid` card — CSS Grid heatmap (no new deps), upper-triangle, color-coded by accuracy
- [x] `ConfusionPatternCard` card — top 3 confused sound pairs with confusion direction
- [x] `useRecommendations` hook — pure computation, 6 priority rules, returns top 3 recommendations
- [x] `RecommendationCard` card — wired into Dashboard bento grid

**Phase B — Longitudinal Intelligence + Erber Journey: ✅ COMPLETE**
- [x] `useLongitudinalAnalytics` hook — lifetime trends, weekly/monthly bucketing, streaks, fatigue, Erber 4-level progression
- [x] `ErberJourneyCard` — horizontal 4-node progression (Detection → Discrimination → Identification → Comprehension)
- [x] `WeeklyTrendCard` — recharts LineChart with weekly/monthly toggle
- [x] `SNRProgressionCard` — AreaChart with reversed Y-axis (lower SNR = harder = better)
- [x] `FatigueAnalysisCard` — early/mid/late trial accuracy bars with fatigue warning
- [x] `ConsistencyStreakCard` — 7-day heatmap + streak count, wired into Dashboard

**Phase C — Data Export: ✅ COMPLETE**
- [x] `exportCsv.ts` utility — browser-side CSV (training data + phoneme summary), Blob + hidden anchor
- [x] `ExportButton` card — Premium-gated dropdown menu, wired into ProgressReport header

**Wiring: ✅ COMPLETE**
- [x] `ProgressReport.tsx` — 3 new sections: Sound Pattern Mastery, Training Journey, Session Intelligence
- [x] `Dashboard.tsx` — RecommendationCard (3-col) + ConsistencyStreakCard (1-col) in bento grid
- [x] `analytics/index.ts` — 14 barrel exports (5 Sprint 2 + 8 Sprint 3 cards + ExportButton)

**Phase D — Weekly Email Report (Premium): PLANNED (not started)**
- [ ] Supabase Edge Function + Resend API (educational weekly summary, not diagnostic)
- [ ] Settings toggle for opt-in, pg_cron Monday 8am UTC schedule
- [ ] SQL migration: `email_weekly_digest BOOLEAN DEFAULT false` on profiles table
- [ ] React Email template with rotating "Listening Tips", regulatory-safe framing
- [ ] Infrastructure: Resend API key as Supabase secret, Edge Function deploy, pg_cron schedule

**Sprint 3 Stats:** 13 new files, 3 modified files, 0 new npm dependencies, build clean (4.75s)

---

## 🚨 CRITICAL: Voice Audio Architecture

**DO NOT add database columns for new voices.**

Audio URLs are built dynamically from Supabase Storage:
```
{SUPABASE_URL}/storage/v1/object/public/audio/words_v2/{voice}/{word}.mp3
```

To add a new voice:
1. Generate audio to `audio/words_v2/{voice}/` in Supabase Storage
2. Add to `AVAILABLE_VOICES` in `src/hooks/useActivityData.ts`
3. Add to `VOICES` in `src/store/VoiceContext.tsx`
4. Update `docs/VOICE_LIBRARY.md`

**See `docs/VOICE_LIBRARY.md` for full documentation.**

---

## 🚀 Go-Live Readiness (2026-02-06)

| Component | Status | Notes |
|-----------|--------|-------|
| Build | ✅ Ready | 3.6s build time |
| PWA | ✅ Ready | Manifest, SW v2, icons configured |
| Security | ✅ Ready | All keys rotated, 0 npm vulnerabilities |
| Core Features | ✅ Ready | Detection, Gross Discrim, Word Pairs, Stories |
| Error Handling | ✅ Ready | ErrorBoundary catches crashes |
| Deployment | ✅ Ready | Can deploy to Vercel |
| Privacy Policy | ⚠️ TODO | Required for app stores |
| Terms of Service | ⚠️ TODO | Required for app stores |

### Security Hardening (2026-01-25)
- ✅ Rotated all API keys (Supabase anon, service role, ElevenLabs)
- ✅ Fixed npm vulnerabilities (tar override to 7.5.6)
- ✅ Removed VITE_DEV_MODE bypass (premium features now gated)
- ✅ Added React ErrorBoundary for crash protection
- ✅ Updated .env.local with new keys

### Infrastructure Fixes Applied
- ✅ Removed 162MB of unused audio from public/
- ✅ Added PWA manifest, service worker, icons
- ✅ Fixed react-router-dom XSS vulnerability
- ✅ Hidden dev routes (/qc, /qa, /db-test) in production
- ✅ Removed dead code (minimalPairs.ts)

---

## Current State

### Database (Supabase) - Updated 2026-01-23
| Table | Status | Count | Notes |
|-------|--------|-------|-------|
| `stimuli_catalog` | ✅ Ready | ~3,100+ | +80 conversations, +200 drills, +50 env sounds |
| `audio_assets` | ✅ Ready | ~25,000+ | +5,050 new content expansion files |
| `word_pairs` | ✅ Ready | 2,026 | All linked to 4 voices |
| `stories` | ✅ Ready | 62 | 440 audio files (50 stories × 9 voices) |
| `programs` | ✅ Ready | 5 | All published (2 free, 3 tier1) |
| `program_sessions` | ✅ Ready | 28 | Across all 5 programs |
| `session_items` | ✅ Ready | 224 | Populated and ready |
| `noise_assets` | ✅ Ready | 8 | All clinical noise files |
| `user_progress` | ✅ Ready | - | Smart Coach tracking |

### Frontend Features
| Feature | Status | Notes |
|---------|--------|-------|
| RapidFire (Word Pairs) | ✅ Working | Guest mode functional |
| Scenarios | ✅ Working | Dialogue + ambient noise |
| Stories | ✅ Working | Karaoke mode |
| Smart Coach | ✅ Working | SNR adaptive difficulty |
| Programs | ✅ Ready | UI built, schema deployed, 224 items |
| Authentication | ✅ Working | Cross-device sync on login |

### Audio Pipeline
| Component | Status |
|-----------|--------|
| 9-Voice System | ✅ See voice table below |
| TTS Method | ✅ Ellipsis padding (`"... word ..."`) — carrier phrase banned (see F-009) |
| LUFS Normalization | ✅ -20 dB target |
| Babble Noise | ✅ 6-talker, compressed |
| Word List | ✅ 100 real-word pairs (non-words scrubbed, 11 replaced) |

### Voice Status (9-Voice Professional Roster)
| Voice | Region | HNR | Word Coverage | Status |
|-------|--------|-----|---------------|--------|
| Sarah | US | 13.7 dB | 100% | ✅ Ready |
| Emma | US | 12.1 dB | 100% | ✅ Ready |
| Bill | US | 11.4 dB | 100% (regen complete) | ✅ Ready |
| Michael | US | 12.4 dB | 100% (regen complete) | ✅ Ready |
| Alice | UK | 11.2 dB | 100% (regen complete) | ✅ Ready |
| Daniel | UK | 12.1 dB | 100% (regen complete) | ✅ Ready (F-009 fixed, 350 files uploaded) |
| Matilda | AU | 11.4 dB | 100% (regen complete) | ✅ Ready |
| Charlie | AU | 10.6 dB | 100% (regen complete) | ✅ Ready |
| Aravind | IN | 10.2 dB | 100% (1847/1847) | ✅ Ready |

**Deprecated:** Marcus (5.2 dB), David (7.3 dB) - removed from frontend

**Note:** All voices verified in Supabase storage `audio/words_v2/{voice}/` on 2026-01-19

**F-009 Status:** ✅ RESOLVED. Daniel had 92.5% carrier phrase contamination. 350 files regenerated and uploaded to Supabase Storage (179 daniel + 19 new words × 9 voices).

---

## Blockers

1. ~~**Voice Audio Gaps**~~ - ✅ RESOLVED: All 9 voices now have full word coverage
2. ~~**Authentication**~~ - ✅ RESOLVED: Mandatory sign-in, no guest mode
3. ~~**Supabase Service Role Key**~~ - ✅ RESOLVED: Key obtained, F-009 audio uploaded

---

## Content Expansion v2 - ⚠️ PARTIALLY COMPLETE (Credits Exhausted)

### Generation Status (2026-01-24)
| Type | CSV Rows | Audio Files | Status | Notes |
|------|----------|-------------|--------|-------|
| Conversations (Q&A) | 80 pairs | 1,400 | ✅ COMPLETE | 80×2×9 voices - prompt + response |
| Phoneme Drill Packs | 200 pairs | ~3,600 | ✅ COMPLETE | 200×2×9 voices - minimal pairs |
| Environmental Sounds | 50 sounds | 50 | ✅ COMPLETE | 50 unique sounds |
| Scenarios (Dialogue) | 129 lines | 529 | ✅ COMPLETE | 4 voice combos × dialogue lines |
| Rate Variants | 100 items | 1,800 | ✅ COMPLETE | 100×2 rates×9 voices |
| Stories v3 | 50 stories | 449 | ✅ COMPLETE | 50×9 voices (1 failed) |
| Sentences v2 | 628 sentences | 2,790 | ⚠️ PARTIAL | See details below |

**Completed Audio Files:** ~10,618 files
**Remaining (need credits):** ~2,862 files
**Total Planned:** ~13,480 files

### ⚠️ REMAINING WORK - Sentences v2 (When Credits Available)

**What's done:**
- Sentences 1-310: ALL 9 voices complete (2,790 files)
- Storage path: `audio/sentences_v2/{voice}/sentence_{1-310}.mp3`

**What's remaining:**
- Sentences 311-628: Need ALL 9 voices (318 sentences × 9 = 2,862 files)
- Estimated credits needed: ~8,000-10,000

**To resume generation:**
```bash
# The script has progress tracking - just run it again
python3 scripts/generate_sentences_v2.py

# It will skip already-generated files and continue from where it stopped
```

**Voice file counts (as of quota exhaustion):**
| Voice | Files | Status |
|-------|-------|--------|
| sarah | 310 | ✅ |
| emma | 310 | ✅ |
| bill | 310 | ✅ |
| michael | 309 | ✅ |
| alice | 310 | ✅ |
| daniel | 310 | ✅ |
| matilda | 310 | ✅ |
| charlie | 310 | ✅ |
| aravind | 309 | ✅ |

### Schema Migration
- `sql_migrations/content_expansion_v2_final.sql` - ✅ Run with PL/pgSQL exception handling
- `sql_migrations/fix_content_types.sql` - ✅ Dropped constraint to allow new content types

### Files Created

**CSV Content Files:**
- `content/source_csvs/conversations_v1.csv` - 80 Q&A pairs (6 categories)
- `content/source_csvs/environmental_sounds_v1.csv` - 50 sounds (5 categories)
- `content/source_csvs/phoneme_drills_v1.csv` - 200 minimal pairs (10 packs) - IPA chars fixed

**Generation Scripts:**
- `scripts/generate_conversations.py` - Q&A audio generation ✅
- `scripts/generate_environmental_sounds.py` - Sound effects generation ✅
- `scripts/generate_phoneme_drills.py` - Minimal pair audio ✅
- `scripts/generate_rate_variants.py` - Slow/fast speech variants (not run yet)

**Ingestion Scripts:**
- `scripts/ingest_conversations.py` - CSV → stimuli_catalog ✅
- `scripts/ingest_environmental.py` - CSV → stimuli_catalog ✅
- `scripts/ingest_phoneme_drills.py` - CSV → stimuli_catalog ✅

**Frontend Hooks:**
- `src/hooks/useConversationData.ts` - Fetch Q&A pairs
- `src/hooks/useEnvironmentalData.ts` - Fetch environmental sounds
- `src/hooks/useDrillPackData.ts` - Fetch phoneme drill packs

**Updated Files:**
- `src/types/database.types.ts` - Added new content types, views, metadata interfaces
- `src/hooks/useProgress.ts` - Added metadata fields for new content types

### Key Fixes Applied (2026-01-23)
1. **Schema mismatch:** Actual columns are `content_text`, `content_type`, `clinical_metadata` (not `text`, `type`, `tags`)
2. **UUID primary keys:** ID column is UUID, not TEXT - ingestion scripts now generate UUIDs
3. **Constraint dropped:** `stimuli_catalog_content_type_check` blocked new content types
4. **IPA characters in paths:** Replaced IPA chars (ʃ, θ, ð, ɪ, ɛ, æ) with ASCII equivalents for Supabase storage

---

## Next Actions (Priority Order)

### TODO — Next Session

#### Design Polish (remaining from Session 26 audit)
- [ ] **Continue logo iteration** — Current logo is v1 placeholder from Weavly (Ideogram V3 inpaint). 50-prompt pipeline ready at `branding/logo-gen/` for batch generation via DALL-E 3 or Ideogram API.

#### Testing & Verification
- [ ] **Live test Placement Assessment** — Verify comprehension question fix (visible card container + fallback text) and loading spinner fix (debug logging added).
- [ ] **Live test Today's Practice** — Verify hero card, run 2-step plan, confirm "Up Next" chaining and "Practice Complete" state.
- [ ] **Verify BT audio routing** — Have Mark (iPhone + BT hearing aids) test placement + all activities.

#### Marketing & Growth
- [ ] **Marketing Phase 2 — Competitive research** — Use Playwright MCP to screenshot LACE, Angel Sound, AB Clix. Save to `/tmp/competitive_research.md`.
- [ ] **Marketing Phase 2 — Landing pages** — Build 3 audience-specific landing pages (CI Users, Audiologists, Family Members) using positioning + copy skills.

#### Infrastructure
- [ ] **Sprint 3 Phase D — Weekly email** — Set up Resend account, create Supabase Edge Function, deploy pg_cron schedule.
- [ ] **Configure Apple OAuth** — Pending D-U-N-S number and Apple Developer enrollment as Organization (Wyoming LLC). See `docs/AUTH_SETUP.md`.
- [ ] **Supabase Custom Domain** — Upgrade to Pro ($25/mo), `auth.soundsteps.app` CNAME so OAuth doesn't show raw Supabase URL.
- [ ] **F-012 product decision** — "Share with Audiologist" behind paywall: make free, remove, or rename? See `docs/TESTING_FINDINGS.md`

### Done (previously TODO)
- [x] Replace Inter font ✅ (Session 27 — Satoshi configured, zero Inter references remain)
- [x] Extract Button/Card primitives ✅ (Session 28 — `src/components/primitives/` with Button + Card)
- [x] Full primitive adoption ✅ (Session 28 — 14 Buttons + 13 Cards across 14 files)
- [x] Migrate brand-* tokens ✅ (Session 28 — Player.tsx, SNRMixer.tsx, AudioPlayer.tsx, QuizCard.tsx, AudioQA.tsx all purged. Legacy palette removed from tailwind.config.js)
- [x] QuizCard dark-mode fix ✅ (Session 28 — 9 class replacements, all light patterns→dark equivalents)
- [x] SNRMixer dark-mode alignment ✅ (Session 28 — bg-white/bg-gray-50 → bg-slate-900/bg-slate-800/50)
- [x] Integrate Logo v1 ✅ (Session 27 — favicon, PWA icons, nav header, WelcomeScreen, PlacementAssessment)
- [x] Kill 14 gradient instances ✅ (Session 27 — all 14 replaced with solid fills, 0 gradients remaining)
- [x] Remove neumorphic shadows ✅ (Session 27 — 5 shadow tokens removed from tailwind.config.js)
- [x] Fix manifest theme_color ✅ (Session 27 — #7c3aed → #020617)
- [x] Fix manifest icon sizes ✅ (Session 27 — 72x72→192x192, 1024x1024→512x512)
- [x] Run performance indexes SQL ✅ (Session 23 — user ran manually)
- [x] Surface progress errors to UI ✅ (Session 22 — `useProgress` returns `{ error, clearError }`)
- [x] Verify progress tracking ✅ (Session 20 — all 7 activities log rich per-trial data)
- [x] BT hearing aid audio routing fixed ✅ (Session 19 — F-018)
- [x] Slow loading optimized ✅ (Session 19 — F-019)
- [x] Progress tracking fixed ✅ (Session 19 — F-020, content_id UUID→TEXT)
- [x] Premium granted to 3 test accounts ✅ (Session 19 — wakingupdeaf, lyle7257, mark@rdaadvantage)
- [x] Google OAuth configured, working, and published ✅ (Session 18 — consent screen published for all users)
- [x] VITE_DEV_UNLOCK_ALL removed from Vercel production ✅ (Session 18)
- [x] DNS moved from Namecheap to Cloudflare ✅ (Session 18)
- [x] Email forwarding configured ✅ (Session 18 — support@soundsteps.app → soundstepsapp@gmail.com via Cloudflare Email Routing)
- [x] Email templates pasted into Supabase ✅ (Session 18)
- [x] Supabase security linter SQL fixes run ✅ (Session 18)
- [x] Custom SMTP configured ✅ (Resend via noreply@soundsteps.app)
- [x] Branded email templates written ✅

### Future Opportunities

#### P0 — Core UX
- [x] ~~Bluetooth/CI audio relay: Silent Sentinel~~ ✅ Implemented — `useSilentSentinel` hook active in Detection, RapidFire, CategoryPlayer, GrossDiscrimination, SentenceTraining
- [x] ~~Guided new-user onboarding~~ ✅ Implemented — WelcomeScreen + ActivityBriefing on all activities + nextActivity in SessionSummary
- [x] ~~Redesign Home as propulsive landing~~ ✅ Practice Hub is now `/`, Dashboard moved to `/dashboard`
- [x] ~~"Today's Practice" daily training~~ ✅ Implemented (Session 24) — Hero card on Practice Hub, 2-step Erber-based plan via navigation sequencer, dynamic nextActivity on 5 activities, plan-complete celebration, tier-gated.

#### P1 — Auth & Account
- [ ] **Change email address** — Add email change field to Settings page. Calls `supabase.auth.updateUser({ email })`. Enable "Secure email change" (double opt-in) in Supabase Dashboard → Auth → Settings.
- [x] ~~**Google OAuth**~~ ✅ Working + published (Session 18)
- [ ] **Apple OAuth** — Pending D-U-N-S number / Apple Developer enrollment as Organization (Wyoming LLC). See `docs/AUTH_SETUP.md`.
- [ ] **Supabase Custom Domain** — Upgrade to Pro ($25/mo), set up `auth.soundsteps.app` CNAME so OAuth redirects show your domain instead of `padfntxzoxhozfjsqnzc.supabase.co`. Currently users see the raw Supabase URL during Google sign-in on mobile Safari — looks untrustworthy. Fix before opening to real users.

### Completed
- [x] ~~Verify programs schema exists in Supabase~~ ✅ Confirmed (224 session_items)
- [x] ~~Voice audit~~ ✅ 9-voice roster confirmed, deprecated Marcus/David
- [x] ~~Update VoiceContext.tsx~~ ✅ Removed deprecated, added new voices
- [x] ~~Update VOICE_LIBRARY.md~~ ✅ Synced with current roster
- [x] ~~Test Programs flow~~ ✅ UI verified: `/programs` → `/programs/:id` → `/session/:id`

### Voice Audio Regeneration (Uses ElevenLabs Credits)

**Execution Plan:**

```bash
# Step 1: Alice failed words (763 words)
cd /Users/clyle/Desktop/my-hearing-app
python3 scripts/regenerate_alice_failed.py

# Step 2: Michael, Bill, Charlie, Matilda failed words (1,689 words)
python3 scripts/regenerate_multivoice_failed.py

# Step 3: Generate Daniel & Aravind (new voices, ~4,000 words)
# First run PILOT mode to test (IS_PILOT=True in script)
python3 scripts/generate_new_voices.py

# After pilot success, edit script: IS_PILOT=False, then run again
python3 scripts/generate_new_voices.py
```

**Status:**
- [x] ~~Alice: 763 failed~~ ✅ **COMPLETE (98.7% pass rate)**
- [x] ~~Michael: 454 failed~~ ✅ **COMPLETE (92.3% pass rate)**
- [x] ~~Bill: 414 failed~~ ✅ **COMPLETE (92.3% pass rate)**
- [x] ~~Charlie: 416 failed~~ ✅ **COMPLETE (99.3% pass rate)**
- [x] ~~Matilda: 405 failed~~ ✅ **COMPLETE (98.0% pass rate)**
- [x] ~~Daniel: 0% coverage~~ ✅ **COMPLETE (1845/1847 = 99.9%)**
- [x] ~~Aravind: 0% coverage~~ ✅ **COMPLETE (1847/1847 = 100%)**

**Estimated Cost:** ~$65-100 total (trivial with 700k credits)

**Monitor Progress:**
```bash
# Quick progress check
grep -c "Quality check passed" alice_regeneration_log.txt && echo "/ 763 words"

# Watch live progress
tail -f alice_regeneration_log.txt

# Check if still running
ps aux | grep regenerate | grep -v grep
```

### Phase 6: Multi-Voice Content Generation (CURRENT PRIORITY)

**Audio Content Audit (2026-01-19):**
| Content Type | Target | Current | Gap | Est. Credits |
|--------------|--------|---------|-----|--------------|
| Word Pairs | 1,847 × 9 voices | ✅ 100% | 0 | - |
| Sentences | 628 × 9 voices | Sarah only (618) | **5,024** | ~15,000 |
| Stories | 12 × 9 voices | 4 voices partial | **86** | ~500 |

**Generation Scripts Created:**
```bash
# Sentence Generation (8 voices × 628 sentences = 5,024 files)
python3 scripts/generate_sentences_all_voices.py --pilot  # Test first
python3 scripts/generate_sentences_all_voices.py          # Full run

# Story Generation (7 voices × 12 stories = 84 files + 2 emma gaps)
python3 scripts/generate_stories_all_voices.py --pilot    # Test first
python3 scripts/generate_stories_all_voices.py            # Full run

# Filter by specific voices
python3 scripts/generate_sentences_all_voices.py --voices emma,bill,michael
```

**Execution Order:**
1. [x] Run sentence pilot (10 sentences × 9 voices) ✅ 80/80 passed
2. [x] Run story pilot (2 stories × 2 voices) ✅ 4/4 passed
3. [x] Review pilot quality ✅ All durations and sizes normal
4. [x] Run full sentence generation ✅ **4,953 files generated, 1 failed**
5. [x] Run full story generation ✅ **94 files generated, 0 failed**
6. [x] Run `sql_migrations/add_story_voice_columns.sql` ✅ **42 columns added, 12 stories updated**
7. [ ] Verify all content in app

**Generation Results (2026-01-19):**
| Content | Files Generated | Failures | Notes |
|---------|----------------|----------|-------|
| Sentences | 4,953 | 1 | alice missing 1 sentence |
| Stories | 94 | 0 | All voices complete |
| **Total** | **5,047** | **1** | 99.98% success rate |

**Estimated Total Credits:** ~15,500 (2.4% of 650,000 available)

### Phase 7: UI Polish & Hard Mode
- [x] ~~Implement "Hard Mode" - hide word text until audio plays~~ ✅ DONE 2026-02-06
- [ ] Add animations and typography improvements

### Phase 8: Progress Reports
- [x] ~~Build progress visualization page~~ ✅ DONE 2026-02-06
- [x] ~~Practice focus areas analysis~~ ✅ DONE (included in ProgressReport)
- [x] ~~PDF export (shareable with audiologists)~~ ✅ DONE (window.print())
- [x] ~~Analytics insight cards (Sprint 2)~~ ✅ DONE 2026-02-08 (5 cards: Activity Breakdown, Voice Comparison, Position Analysis, Noise Effectiveness, Replay Patterns)
- [x] ~~Phoneme mastery heatmap + confusion analysis (Sprint 3)~~ ✅ DONE 2026-02-08
- [x] ~~Erber journey + longitudinal trends (Sprint 3)~~ ✅ DONE 2026-02-08
- [x] ~~Smart recommendations on Dashboard (Sprint 3)~~ ✅ DONE 2026-02-08
- [x] ~~CSV export Premium-gated (Sprint 3)~~ ✅ DONE 2026-02-08

### Phase 9: Tier Locking
- [x] ~~Lock Standard/Premium content for non-subscribers~~ ✅ DONE 2026-02-06

### Phase 10: Code Optimization
- [x] ~~Code splitting (bundle size reduction)~~ ✅ DONE 2026-02-06 (797KB → 272KB)
- [x] ~~Fix git-triggered Vercel deploys~~ ✅ Working (auto-deploys on push to main)

---

## Recent Completions

### 2026-02-14 (Session 27: Logo Integration + Gradient Purge + Legacy Cleanup)

**Summary:** Implemented the full logo integration plan from Session 26. Generated 5 icon sizes from `branding/logo-v1.png` (32, 180, 192, 512, 1024px). Replaced placeholder blue X favicon and PWA icons with Stepped S teal lettermark. Fixed manifest `theme_color` from purple `#7c3aed` to dark slate `#020617` and corrected icon size declarations. Added logo to Layout nav header, WelcomeScreen, and PlacementAssessment intro. Bumped service worker cache to v2. Then purged all 14 gradient instances across 8 components, removed 5 neumorphic shadow tokens from `tailwind.config.js`, and simplified ActivityHeader from 62 lines to 22. CSS bundle shrank 7KB (64KB → 57KB). Updated STATUS.md and audited all docs for open action items.

**Commits:**
1. `feat: Logo integration — favicon, PWA icons, nav header, welcome & placement screens` (25 files, +2651 -18)
2. `refactor: Purge gradients + remove neumorphic shadows from Aura design system` (10 files, +32 -84)

**Files Changed:**
- `public/` — favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png, logo.png (new/replaced)
- `index.html` — added favicon-32 link, updated apple-touch-icon
- `public/manifest.json` — fixed theme_color + icon sizes
- `public/sw.js` — bumped to v2, added new assets
- `src/components/Layout.tsx` — logo in nav header (left side)
- `src/components/WelcomeScreen.tsx` — logo above heading
- `src/pages/PlacementAssessment.tsx` — logo replaces Ear icon
- `src/components/ui/ActivityHeader.tsx` — simplified, removed Vitality palette logic
- `src/components/StepTracker.tsx` — solid fill
- `src/pages/CategoryLibrary.tsx` — removed gradient color map
- `src/pages/ProgramLibrary.tsx` — solid badges + progress bars
- `src/pages/ProgramDetail.tsx` — solid CTA + progress bar
- `src/pages/SentenceTraining.tsx` — solid audio visualizer
- `src/pages/ActivityList.tsx` — solid onramp card bg
- `src/pages/Dashboard.tsx` — solid progress bar
- `tailwind.config.js` — removed neumorphic shadows, cleaned comments
- `.gitignore` — added *.swp

---

### 2026-02-14 (Session 26: Logo v1 + Placement Bug Fixes + Design Audit + Logo Generation Pipeline)

**Summary:** Fixed 3 Placement Assessment bugs found during live testing (loading spinner, cheap emoji icons, missing comprehension question). Conducted thorough design audit identifying "vibecoded hallmarks" — the app uses Inter font, standard Tailwind colors, Lucide icons, and no custom visual identity (same as every AI-generated app). Created a 50-prompt logo generation pipeline for the "Stepped S" concept, generated ~30 logos in Weavly, selected v1 placeholder. Wrote integration plan for favicon, PWA icons, nav header, welcome screen, and placement intro. Installed Playwright + Firecrawl MCPs.

**Placement Bug Fixes (committed + deployed):**
- `src/pages/PlacementAssessment.tsx` — Replaced emoji icons (ear, arrows, target, chat) with Lucide React components (Ear, ArrowLeftRight, Target, MessageSquare) in teal-tinted containers. Added visible card container for comprehension question with `'What did you hear?'` fallback. Added dev-only debug logging for loading state diagnosis. Added `sentencesError` display in loading spinner.

**Logo Generation Pipeline (new, not committed):**
- `branding/logo-gen/prompts/all_prompts.json` — 50 structured prompts across 5 batches (Core Form, Depth/Shading, Typography, Stylistic Range, Context/Application)
- `branding/logo-gen/prompts/ALL_PROMPTS.md` — Human-readable copy-paste version for Weavly
- `branding/logo-gen/generate_dalle.py` — DALL-E 3 batch generation (lazy openai import for dry-run)
- `branding/logo-gen/generate_ideogram.py` — Ideogram V2A batch generation (DESIGN style)
- `branding/logo-gen/gallery/index.html` — Dark-themed review gallery with 1-5 scoring, reject, filter, lightbox, localStorage, JSON export
- `branding/logo-gen/run.sh` — Runner script (dalle, ideogram, gallery, dry-run, count)
- `branding/logo-v1.png` — Selected v1 logo (Stepped S, teal on dark, Ideogram V3 inpaint)
- `.gitignore` — Added `branding/logo-gen/outputs/` to prevent generated images from being committed

**MCP Setup (committed):**
- `docs/MCP_SETUP.md` — Fixed package names: Playwright is `@playwright/mcp@latest` (not `@anthropic/playwright-mcp`), Firecrawl is `firecrawl-mcp` (not `@anthropic/firecrawl-mcp`). Perplexity skipped.

**Design Audit Findings:**
- 85% Aura-compliant, grade B+
- 14 gradient instances (should be 0 outside Aura visualizer)
- Inter font (universal AI-app fingerprint)
- No extracted primitives (Button, Card, Badge)
- Legacy Vitality palette in tailwind.config.js
- No logo/visual identity anywhere in UI
- Manifest theme_color still purple `#7c3aed` (should be `#020617`)
- PWA icons are placeholder blue X (Capacitor default)

**Logo Integration Plan (written, not implemented):**
- Plan at `.claude/plans/splendid-riding-wombat.md`
- 7 steps: generate icon sizes → update index.html → fix manifest.json → bump SW cache → add to Layout nav → add to WelcomeScreen → add to PlacementAssessment intro
- 11 files total (5 new icon PNGs, 6 modified source files)

**Commits:**
1. `01c90bb` — feat: Placement Assessment + marketing strategy + 5 marketing skills
2. `11b167b` — fix: Placement Assessment — Lucide icons, question visibility, debug logging

**Build:** ✅ PASSING | **Tests:** ✅ 31 PASSING

---

### 2026-02-11 (Session 25: Placement Assessment + Marketing Strategy + Skills + MCP)

**Summary:** Built the Placement Assessment ("Listening Check") — a 10-trial interactive assessment across all 4 Erber levels that serves as the primary lead magnet and new-user onboarding. Also wrote comprehensive marketing strategy document based on Isenberg AI Marketing Masterclass analysis, created 5 marketing skills for Claude Code, and documented MCP setup for research workflow.

**New files (8):**
- `src/pages/PlacementAssessment.tsx` (~460 lines) — 10-trial Listening Check with 4 phases (intro, trial, interstitial, results). 2 Detection, 3 Discrimination, 3 Identification, 2 Comprehension. Uses `useSilentSentinel.playUrl()` for BT-safe audio. Logs every trial via `useProgress`. Saves results to `localStorage.soundsteps_placement`. Determines starting level (80%/60%/60% thresholds).
- `docs/MARKETING_PLAN.md` (~437 lines) — Full strategy document: Isenberg video analysis with 12-tool matrix, funnel architecture, 3 audience landing pages, SEO keywords, content marketing (blog + Remotion video + Glyph images), pricing tiers, regulatory guardrails, competitive landscape, email strategy, 4-phase implementation plan.
- `docs/MCP_SETUP.md` (~200 lines) — Setup guide for Perplexity MCP (research), Playwright MCP (screenshots/automation), Firecrawl MCP (web scraping). Combined config JSON, workflow walkthrough, troubleshooting.
- `.claude/skills/hearing-health-copy.md` (~130 lines) — Regulatory-safe copywriting skill with prohibited/allowed term matrix, headline frameworks, CTA rules.
- `.claude/skills/audiologist-outreach.md` (~120 lines) — B2B messaging for audiologists: pain points, proof points, objection handling, email templates.
- `.claude/skills/ci-community-voice.md` (~110 lines) — Authentic first-person CI user perspective (Bruce's story), content templates for communities.
- `.claude/skills/soundsteps-positioning.md` (~140 lines) — 10 differentiators, 4 ICPs, 5 positioning frameworks, headline generation process.
- `.claude/skills/soundsteps-orchestrator.md` (~110 lines) — "What's next?" decision skill with funnel checklist and priority routing.

**Modified files (4):**
- `src/App.tsx` — Added `/placement` route (lazy-loaded, RequireAuth)
- `src/pages/ActivityList.tsx` — WelcomeScreen "Start Your First Exercise" → `/placement`
- `src/components/TodaysPracticeCard.tsx` — New user without placement → "Start Listening Check"; with placement → "Start Practice"
- `src/hooks/useTodaysPractice.ts` — `getWorkingLevel()` reads placement level from localStorage when no Erber data exists

**Architecture:**
- Placement is a bootstrap — `localStorage.soundsteps_placement` read by `getWorkingLevel()` only when no Erber journey data exists yet. Once real progress accumulates, Erber journey overrides.
- All placement audio plays through Web Audio API (`playUrl()`) — BT hearing aid compatible.
- Marketing skills follow `.claude/skills/` pattern — domain expertise codified as markdown instructions for Claude Code workflows.

**Build:** ✅ PASSING | **Tests:** ✅ 31 PASSING | **New files:** 8 | **Modified files:** 4

---

### 2026-02-09 (Session 24: Today's Practice — Daily Training Flow)

**Summary:** Built a Duolingo-style daily training flow that eliminates decision fatigue. Hero card on Practice Hub tells users exactly what to practice, then chains 2 activities via dynamic "Up Next" cards. Navigation sequencer reuses all existing activity pages via sessionStorage — zero changes to trial UIs.

**New files (3):**
- `src/hooks/useTodaysPlan.ts` (~83 lines) — sessionStorage read/write helper. Stores 2-step plan with today's date for auto-expiry. `startTodaysPlan()` writes plan + navigates. `useTodaysPlan()` hook reads plan and provides `nextActivity`, `advancePlan()`, `isLastStep`.
- `src/hooks/useTodaysPractice.ts` (~186 lines) — Plan generation algorithm. Composes 5 existing analytics hooks (useLongitudinalAnalytics, usePhonemeAnalytics, useAnalytics, useRecommendations, useProgressData). Determines working Erber level, builds 2-step plan (core + stretch), tier-gates activities, falls back gracefully.
- `src/components/TodaysPracticeCard.tsx` (~119 lines) — Hero card with 3 states: "Ready to practice" (step labels, streak, yesterday accuracy, teal CTA), "Goal met" (checkmark, secondary button), "New user" (Let's Get Started prompt).

**Modified files (7):**
- `src/pages/ActivityList.tsx` — Hero card above "Getting Started" section
- `src/pages/Detection.tsx` — Dynamic nextActivity from plan
- `src/pages/GrossDiscrimination.tsx` — Dynamic nextActivity from plan
- `src/pages/RapidFire.tsx` — Dynamic nextActivity (previously had none)
- `src/pages/CategoryPlayer.tsx` — Dynamic nextActivity from plan
- `src/pages/SentenceTraining.tsx` — Dynamic nextActivity from plan
- `src/components/SessionSummary.tsx` — "Assessment" → "Result" (regulatory fix), plan-complete detection shows "Practice Complete!" title

**Architecture:** Navigation sequencer pattern — sessionStorage stores plan, activity pages read it via `useTodaysPlan()`, `advancePlan()` advances step and navigates. Plan auto-expires at midnight. Direct navigation (not via hero card) falls back to existing hardcoded nextActivity suggestions.

**Not included (future phases):** Placement assessment, inline orchestrator, streak freeze, daily goal picker, spaced repetition for specific pairs.

**Build:** ✅ PASSING (3.58s) | **Tests:** ✅ 31 PASSING | **New files:** 3 | **Modified files:** 7

---

### 2026-02-08 (Session 23: Data Engine Sprint 3 Phases A-C — Phoneme Mastery, Longitudinal Intelligence, CSV Export)

**Summary:** Built the world-class data engine differentiator. No consumer aural rehab app tracks phoneme-pair mastery or generates data-driven practice recommendations. Created 3 new hooks, 8 new cards, 1 export utility, wired everything into ProgressReport (3 new sections) and Dashboard (2 new bento cards). Zero new npm dependencies.

**Phase A — Phoneme Intelligence + Recommendations (5 files):**
- `src/hooks/usePhonemeAnalytics.ts` (~230 lines) — Single Supabase query filtering `content_tags->>activityType = 'rapid_fire'` (lifetime, no time window). Aggregates phoneme-pair accuracy, confusion direction, position breakdown. Normalizes pair keys alphabetically. Returns `masteredPairs` (>=80%, 20+ trials), `strugglingPairs` (<60%, 10+ trials), `uniquePhonemes` for grid axes.
- `src/components/analytics/PhonemeMasteryGrid.tsx` (~120 lines) — CSS Grid heatmap. Upper-right triangle only. Cell colors: teal-500 (>=80%), teal-300 (>=70%), amber-400 (>=50%), red-400 (<50%). Tooltip on hover/tap. Self-hides if <3 pairs have 5+ trials. No charting library.
- `src/components/analytics/ConfusionPatternCard.tsx` (~75 lines) — Top 3 confused pairs (<80% accuracy). Shows confusion direction with arrow icon. Self-hides if all pairs above 80%.
- `src/hooks/useRecommendations.ts` (~180 lines) — Pure computation (NO Supabase query). Takes data from 3 hooks. 6 priority rules: weakest phoneme pair, Erber advancement, voice diversity, noise readiness, position weakness, consistency nudge. Returns top 3.
- `src/components/analytics/RecommendationCard.tsx` (~90 lines) — Dashboard bento card. Type-based icons (Volume2, Zap, Ear, Target, Flame). First item gets teal accent.

**Phase B — Longitudinal Intelligence (6 files):**
- `src/hooks/useLongitudinalAnalytics.ts` (~230 lines) — Single Supabase query, ALL rows (lifetime). Computes: weeklyTrend (date-fns startOfWeek), monthlyTrend, snrProgression (daily avg from RapidFire), consistency (streaks, last7Days booleans), fatigue (early/mid/late trial accuracy), erberJourney (4 Erber levels mapped from activityType).
- `src/components/analytics/ErberJourneyCard.tsx` (~95 lines) — Horizontal 4-node: Detection → Discrimination → Identification → Comprehension. Mastered=teal+checkmark, in-progress=amber+circle, no-data=slate+lock. Connecting lines color-code progress.
- `src/components/analytics/WeeklyTrendCard.tsx` (~105 lines) — Recharts LineChart with weekly/monthly toggle. Teal line, dark tooltip.
- `src/components/analytics/SNRProgressionCard.tsx` (~80 lines) — Recharts AreaChart, reversed Y-axis (lower=harder=better). Gradient fill.
- `src/components/analytics/FatigueAnalysisCard.tsx` (~65 lines) — Three horizontal bars (early 1-3, mid 4-6, late 7-10). Amber warning if fatigue detected (late >10% lower than early).
- `src/components/analytics/ConsistencyStreakCard.tsx` (~75 lines) — Dashboard bento card. 7-day heatmap cells, streak count with flame icon, last-30-days active count.

**Phase C — Data Export (2 files):**
- `src/lib/exportCsv.ts` (~80 lines) — Browser-side CSV: `exportProgressCsv()` (full training data) + `exportPhonemeSummaryCsv()` (phoneme pairs). Blob + hidden anchor download.
- `src/components/analytics/ExportButton.tsx` (~80 lines) — Premium-gated dropdown. Two options: training data, sound patterns. Fetches all user_progress rows on demand.

**Wiring (3 modified files):**
- `src/pages/ProgressReport.tsx` — Added `usePhonemeAnalytics` + `useLongitudinalAnalytics` hooks. Added ExportButton next to Print button. 3 new sections: Sound Pattern Mastery (heatmap + confusion), Training Journey (Erber + trends + SNR), Session Intelligence (fatigue).
- `src/pages/Dashboard.tsx` — Added `usePhonemeAnalytics`, `useAnalytics`, `useLongitudinalAnalytics`, `useRecommendations`. New bento row: RecommendationCard (3-col) + ConsistencyStreakCard (1-col).
- `src/components/analytics/index.ts` — Barrel exports for all 14 analytics components.

**Architecture decisions:**
- All cards self-hide with MIN_TRIALS threshold (graceful empty state for new users)
- ProgressReport new sections each wrapped in `!loading && data &&` guards
- Dashboard cards wrapped in `data && data.length > 0` guards
- Erber level mapping: detection→Detection, rapid_fire/gross_discrimination→Discrimination, category_practice/session_player→Identification, sentence_training/story/scenario→Comprehension
- Streak computation: backward walk from today for current streak, forward scan for longest
- Fatigue threshold: flagged when late-trial accuracy drops >10% from early-trial accuracy with 10+ late trials

**Build:** ✅ PASSING (4.75s) | **Tests:** ✅ 31 PASSING | **New files:** 13 | **Modified files:** 3

---

### 2026-02-08 (Session 21: Data Engine Sprint 2 — Analytics Hooks + Progress Report Enhancement)

**Summary:** Surfaced Sprint 1's enriched per-trial data in the ProgressReport page. Created a single analytics hook that queries `user_progress` once and computes 6 breakdowns from `content_tags` JSONB. Built 5 self-hiding insight cards and wired them into ProgressReport below existing charts. No DB migrations needed.

**New hook:** `src/hooks/useAnalytics.ts` (~180 lines)
- Single Supabase query → 6 computed breakdowns: byActivity, byVoice, byPosition, noiseComparison, replayStats, responseTimeTrend
- `ACTIVITY_LABELS` map: `detection` → 'Sound Detection', `rapid_fire` → 'Word Pairs', etc.
- Follows same pattern as `useProgressData.ts` (single query, JS aggregation)

**New components:** `src/components/analytics/` (5 cards + barrel export)
- `ActivityBreakdownCard.tsx` — Horizontal bars with accuracy per activity, color-coded (teal ≥80%, amber 50-80%, red <50%)
- `VoiceComparisonCard.tsx` — Male vs Female voice accuracy side-by-side
- `PositionAnalysisCard.tsx` — Initial/Medial/Final phoneme position accuracy (3-column)
- `NoiseEffectivenessCard.tsx` — Quiet vs Noise accuracy comparison
- `ReplayInsightCard.tsx` — Avg replays/trial with zero-replay vs multi-replay accuracy
- `index.ts` — Barrel export

**Modified:** `src/pages/ProgressReport.tsx`
- Added "Insights" section below existing charts, above print footer
- 2-column responsive grid (`grid-cols-1 md:grid-cols-2`)
- Cards self-hide when <5 trials exist for that dimension
- Entire section hidden when no analytics data or still loading

**Design verification:**
- All cards match existing Aura design system (teal primary, `font-bold` max, no gradients)
- Dark mode: `bg-white dark:bg-slate-900`, `border-slate-200 dark:border-slate-800`
- Print styles: `print:border-slate-300`, `print:text-black`
- Mobile responsive: single column on mobile, 2 columns on desktop
- Empty states: "Not enough data" text for individual sub-sections; null return hides entire card

**Quality checks:**
- Zero console.log statements (all new code)
- Zero `any` types
- Zero regulatory term violations
- Zero hardcoded secrets
- Zero new TS errors (all pre-existing)
- All files <50 lines (cards) or <200 lines (hook)
- Immutable patterns throughout

**Bug Fix Batch 9 (same session):**
- **F-024 FIXED:** Answer position shuffle bias — replaced biased `.sort(() => Math.random() - 0.5)` with fair coin flip in RapidFire, GrossDiscrimination. CategoryPlayer had zero shuffle — added `useMemo` randomized options.
- **F-025 FIXED:** Voice selection not applied — Player.tsx used stale `useVoice()` (VoiceContext). Changed to `useUser()` (UserContext). Root cause: two competing localStorage keys (`preferredVoice` vs `voice`), VoiceContext never re-reads after mount.
- **F-026 FIXED:** Excessive scrolling — reduced `py-8`→`py-4`, `mb-12`→`mb-6`, `mb-10`→`mb-6` in Detection, RapidFire, GrossDiscrimination. Saves ~80px vertical space.
- **F-022 FIXED:** Scenario list slow — `select('*')` → explicit columns + `.limit(50)` in ScenarioList.
- **F-023 PARTIAL:** StoryPlayer styling — `font-black`→`font-bold`, difficulty buttons → Aura dark cards, dark mode text. Audio URL construction still open.

**Files modified (Batch 9):**
- `src/pages/RapidFire.tsx` — Fair shuffle, reduced padding
- `src/pages/GrossDiscrimination.tsx` — Fair shuffle, Fisher-Yates for array, reduced padding
- `src/pages/CategoryPlayer.tsx` — Added `useMemo` shuffled options, `useMemo` import
- `src/pages/Detection.tsx` — Reduced padding/margins
- `src/pages/Player.tsx` — Removed VoiceContext, use UserContext for voice
- `src/pages/ScenarioList.tsx` — Explicit column selection + limit
- `src/pages/StoryPlayer.tsx` — Aura styling, font-bold, dark mode text

**Remaining open:** F-021 (Sentences audio Safari — CORS/bucket issue), F-023 (Stories audio URL path — needs investigation)

**Build:** ✅ PASSING (3.1s) | **Tests:** ✅ 31 PASSING

---

### 2026-02-08 (Session 22 continued: F-027 Fix + useProgress Error Surfacing)

**Summary:** Fixed final BT audio violation (F-027 — ScenarioPlayer). All 27 findings now resolved (25 fixed, 1 deferred, 1 superseded). Added error state to `useProgress` hook so consumers can surface save failures to users.

**F-027 Fix — ScenarioPlayer BT audio:**
- Full rewrite of `ScenarioPlayer.tsx` — replaced `new Audio()` for dialogue and ambience with Web Audio API
- Built-in AudioContext with silent sentinel oscillator (-80dB, keeps BT route alive)
- Dialogue: sequential `BufferSourceNode` playback with recursive auto-advance via refs (avoids stale closures)
- Ambience: looping `BufferSourceNode` through `GainNode` for volume control
- `AudioBuffer` cache avoids redundant decode operations
- Skip forward/backward controls, fixed backPath to `/practice/scenarios`
- **Zero `new Audio()` calls remain in any active activity**

**useProgress error surfacing:**
- Added `error` and `clearError` to `useProgress()` return value
- Three error states: not signed in, DB insert failure, connection error
- Console logs gated behind `import.meta.env.DEV`
- Consumers can optionally destructure `{ error }` to show save failures

**Files modified:**
- `src/pages/ScenarioPlayer.tsx` — Full rewrite: `new Audio()` → Web Audio API with sentinel
- `src/hooks/useProgress.ts` — Added `error`/`clearError` state
- `docs/TESTING_FINDINGS.md` — F-027 FIXED, summary updated (25/27 fixed, 0 open)

**Build:** ✅ PASSING (3.2s) | **Tests:** ✅ 31 PASSING

---

### 2026-02-08 (Session 22: BT Audio Fix Batch 10 — Stories Karaoke + Sentences Voice)

**Summary:** Fixed the last 2 open audio findings (F-021, F-023). Refactored `useKaraokePlayer` from `new Audio()` to Web Audio API for BT hearing aid compatibility. Fixed SentenceTraining's stale voice context that caused empty audio assets. Logged new finding F-027 for ScenarioPlayer.

**F-023 Fix — Stories audio (complete):**
- `useKaraokePlayer.ts` **full refactor** — replaced `new Audio()` + HTMLAudioElement with Web Audio API:
  - Creates own AudioContext with built-in silent sentinel oscillator (-80dB, keeps BT route alive)
  - Fetches audio via `fetch → arrayBuffer → decodeAudioData → AudioBuffer`
  - Plays through `BufferSourceNode → destination` (same BT-compatible pattern as `useSilentSentinel.playUrl()`)
  - Uses `requestAnimationFrame` loop for karaoke word-time sync (replaces `timeupdate` event)
  - Supports pause/resume via stop+offset+recreate pattern (BufferSourceNodes can't be paused natively)
  - Dual loading states: tracks alignment and audio fetch independently
  - Uses `onEndedRef` to avoid stale callback closures
  - iOS Safari AudioContext resume handled in `play()` function
- `StoryPlayer.tsx`:
  - Wrapped `story.audio_female_path` and `story.alignment_female_path` with `getStorageUrl()` (was passing raw DB paths)
  - Added `useParams` to read `:id` route param (was hardcoded to `'story_001_whispering_woods'`)
  - Fixed `backPath` from `/stories` → `/practice/stories` (matching actual route)

**F-021 Fix — Sentences audio:**
- **Root cause:** `SentenceTraining.tsx` used `useVoice()` (VoiceContext) which reads stale `localStorage.preferredVoice`. Voice ID mismatch caused `useSentenceData`'s audio_assets query (`.eq('voice_id', options.voiceId)`) to return zero results → `audio_assets[0]?.storage_path` was `undefined` → no audio URL → no playback.
- **Fix:** Changed `useVoice()` → `useUser()` (UserContext), which reads canonical `localStorage.voice`. Same fix pattern as F-025 in Player.tsx.
- Also fixed biased answer shuffle: `.sort(() => Math.random() - 0.5)` → proper Fisher-Yates.
- Updated `useSentenceData.ts` `SentenceStimulus` type: added `distractor_1/2/3` fields, made `acoustic_foil`/`semantic_foil` optional.

**F-027 (new finding):** ScenarioPlayer.tsx uses `new Audio()` for dialogue and ambience playback — same BT audio routing issue as F-018. Logged for future fix.

**Files modified:**
- `src/hooks/useKaraokePlayer.ts` — Full rewrite: `new Audio()` → Web Audio API with sentinel
- `src/pages/StoryPlayer.tsx` — `getStorageUrl()` wrapping, `useParams`, backPath fix
- `src/pages/SentenceTraining.tsx` — `useVoice()` → `useUser()`, Fisher-Yates shuffle
- `src/hooks/useSentenceData.ts` — Updated `SentenceStimulus` type for distractor fields
- `docs/TESTING_FINDINGS.md` — F-021 FIXED, F-023 FIXED, F-027 added, Batch 10 added
- `STATUS.md` — Session 22 entry

**Build:** ✅ PASSING (3.7s) | **Tests:** ✅ 31 PASSING

---

### 2026-02-08 (Session 20: Data Engine Sprint 1 — Rich Per-Trial Logging)

**Summary:** Made all 7 activities log consistent, rich per-trial data to `user_progress.content_tags` JSONB. Fixed BT audio in SessionPlayer. Fixed Player.tsx TODO bug. Extended QuizCard callback to pass actual answer text. Created voiceGender utility.

**New file:** `src/lib/voiceGender.ts` — voice-to-gender lookup (9 voices → male/female)

**Key changes:**
- `useProgress.ts` — 15 new optional metadata fields (activityType, trialNumber, replayCount, voiceGender, etc.)
- `Detection.tsx` — +replayCount, +voiceGender, +word, +hasSound, +trialNumber, +activityType
- `GrossDiscrimination.tsx` — +replayCount, +voiceGender, +distractorWord, +trialNumber, +activityType
- `RapidFire.tsx` — +replayCount, +position, +vowelContext, +noiseEnabled, +trialNumber, +voiceGender, +tier
- `SentenceTraining.tsx` — +replayCount, +sentenceText, +distractors, +trialNumber, +voiceGender
- `QuizCard.tsx` — Extended `onAnswer(isCorrect, choiceText, correctText)` callback
- `Player.tsx` — Fixed `correctResponse: 'TODO'` bug, +activityType, +storyId, +voiceGender
- `StoryPlayer.tsx` — +activityType, +voiceGender, +trialNumber
- `CategoryPlayer.tsx` — Added logging from scratch (was logging NOTHING)
- `SessionPlayer.tsx` — Replaced `new Audio()` with `useSilentSentinel` (BT fix), added per-trial logging

**New findings logged:** F-021 (Sentences no audio Safari), F-022 (Scenarios slow load), F-023 (Stories styling/audio), F-024 (Word Pairs shuffle bug), F-025 (Voice selection not applied), F-026 (Unnecessary scrolling in activities)

**Build:** ✅ PASSING (3.5s) | **Tests:** ✅ 31 PASSING

---

### 2026-02-08 (Session 19: BT Hearing Aid Audio Fix, Loading Optimization, Progress Tracking Fix)

**Summary:** Fixed audio routing for Bluetooth hearing aids (4 activities), optimized slow loading queries, and found/fixed the root cause of progress not saving for logged-in users. Premium tier granted to 3 test accounts. Deployed to production.

**Fix 1 — Bluetooth Hearing Aid Audio Routing (F-018):**

**Root cause:** Detection, GrossDiscrimination, CategoryPlayer, and SentenceTraining played audio via plain HTML `<audio>` / `new Audio()`. The Silent Sentinel (BT keepalive) uses a separate Web Audio API AudioContext. iOS Safari treats these as different audio sessions — the sentinel keeps BT alive but words route to the phone speaker instead of hearing aids. RapidFire was unaffected because it already uses `useSNRMixer` which routes everything through one Web Audio API context.

**Fix:** Added `playUrl(url)` and `stopPlayback()` methods to `useSilentSentinel` hook. These fetch, decode (`decodeAudioData`), and play audio through the sentinel's own AudioContext/destination — same pattern as `useSNRMixer.playTarget()`. All 4 affected activities converted from `new Audio()` to `playUrl()`.

Files modified:
- `src/hooks/useSilentSentinel.ts` — Added `playUrl()`, `stopPlayback()`, `sourceRef` for tracking current playback
- `src/pages/Detection.tsx` — Replaced `new Audio()` + `onended`/`onerror` with `await playUrl()`
- `src/pages/GrossDiscrimination.tsx` — Same pattern as Detection
- `src/pages/CategoryPlayer.tsx` — Replaced `new Audio()` with `playUrl()`, removed `currentAudio` state
- `src/pages/SentenceTraining.tsx` — Removed `audioRef`, `handleAudioEnded`, `<audio>` JSX element; `handlePlay` computes URL inline and uses `await playUrl()`

**Fix 2 — Slow Loading (F-019):**

**Root cause:** `useWordPairs()` fetched ALL rows from `word_pairs` with `select('*')` and no limit — pulling every row including unused legacy audio path columns. CategoryPlayer fetched ALL stimuli then filtered by category in JavaScript.

Files modified:
- `src/hooks/useActivityData.ts` — Changed to explicit column selection + `.limit(50)` (activities only need 10, 50 gives shuffle variety)
- `src/pages/CategoryPlayer.tsx` — Added `.eq('clinical_metadata->>contrast_category', decodedCategory)` server-side filter, removed client-side `.filter()`

New file:
- `sql_migrations/add_performance_indexes.sql` — 4 indexes for `stimuli_catalog`, `audio_assets`, `word_pairs` (user runs in Supabase SQL Editor)

**Fix 3 — Progress Not Saving for Logged-In Users (F-020):**

**Root cause:** The `user_progress` table had `content_id UUID NOT NULL`, but Detection passes `"detection-0"` and GrossDiscrimination passes `"gross-0"` — these are not valid UUIDs. Every insert silently failed (error logged to console but not surfaced to UI). All other activities (RapidFire, CategoryPlayer, SentenceTraining) pass actual UUIDs from the database and were unaffected.

**DB fix (run in Supabase SQL Editor):**
```sql
ALTER TABLE user_progress ALTER COLUMN content_id TYPE text;
```

**Code fix:**
- `src/hooks/useProgress.ts` — Expanded `contentType` union to include `'environmental' | 'story_question'` (Detection was already passing `'environmental'`, TypeScript just didn't know)

**Investigation finding:** All progress failure paths in `useProgress.ts` are silent — errors logged to console but never surfaced to UI. No error state returned to components. This is a design weakness but not blocking; the UUID type mismatch was the actual cause of data loss.

**Premium Tier — Test Accounts:**

Granted Premium to 3 accounts via Supabase SQL Editor:
- `wakingupdeaf@gmail.com` (existing)
- `lyle7257@gmail.com` (new)
- `mark@rdaadvantage.com` (new — requires account creation first; SQL uses `SELECT FROM auth.users` guard)

SQL pattern (safe — inserts 0 rows if email doesn't exist):
```sql
INSERT INTO profiles (id, subscription_tier)
SELECT id, 'Premium'
FROM auth.users WHERE email = '...'
ON CONFLICT (id) DO UPDATE SET subscription_tier = 'Premium';
```

**Deployment:**
- `npm run build` — ✅ clean (3.5s)
- `npm test` — ✅ 31/31 pass
- `npx vercel --prod` — ✅ deployed to https://soundsteps.app
- Testers just need a page refresh (Vite cache-busted chunk names, no localStorage schema changes)

**Build:** ✅ PASSING (3.5s) | **Tests:** ✅ 31 PASSING

---

### 2026-02-08 (Session 18: Route Restructure, Sentences Fix, UX Cleanup)

**Summary:** Made Practice Hub the default landing, modernized Sentences page, fixed React hooks bug, cleaned up stale deploy notes. Supabase security fixes, email templates, and Premium access configured by user.

**Route Restructuring:**
- `/` → Practice Hub (ActivityList) — was Dashboard
- `/dashboard` → Dashboard — opt-in stats view, no longer default
- Nav simplified from 4 tabs to 3: Practice, Progress, Settings
- Welcome/auth gate moved from Dashboard to ActivityList

**Sentences Modernization (SentenceTraining.tsx):**
- Added ActivityBriefing, progress bar ("Round X of Y"), useSilentSentinel
- Added useProgress logging with sentence metadata
- Dark theme support throughout
- Fixed voice type (was hardcoded `'sarah' | 'marcus'`, now uses VoiceContext)
- Added nextActivity → Everyday Scenarios in SessionSummary

**Other Fixes:**
- Removed Programs card from Practice Hub (still at `/programs` for dev)
- Upsell banner: changed from fixed overlay to inline with 3s auto-dismiss
- Fixed React hooks violation: useEffect was after conditional early return in ActivityList
- Updated findings tracker: F-001 FIXED, F-009 FIXED (16/17 resolved)
- Confirmed git-triggered Vercel deploys working, removed stale CLI workaround notes

**Infrastructure (user-side):**
- Email templates pasted into Supabase Dashboard
- Supabase security linter SQL fixes run (SECURITY DEFINER views, RLS policies, function search_path)
- Premium granted to test account (wakingupdeaf@gmail.com)
- Google OAuth configured and working (Google Cloud Console + Supabase)
- Apple OAuth: pending D-U-N-S number / Apple Developer enrollment as Organization (Wyoming LLC)
- DNS moved from Namecheap to Cloudflare
- Email forwarding: support@soundsteps.app → soundstepsapp@gmail.com (via Cloudflare Email Routing)

**Build:** ✅ PASSING (3.4s) | **Tests:** ✅ 31 PASSING

### 2026-02-07 (Session 17: Auth Hardening, Dark Mode, OAuth/Magic Link/Forgot Password)

**Summary:** Fixed white UI root cause, built complete auth system with 5 sign-in methods, connected custom domain, comprehensive auth documentation.

**Dark Mode Fix (root cause of white UI):**
- ThemeContext defaulted to `'light'` — overrode `class="dark"` on `<html>` — all `dark:` variants were inactive
- Changed default to `'dark'` — fixes every screen at once
- Layout: hardcoded `bg-slate-950` (removed light/dark split), hid nav/top bar for unauthenticated users
- index.html: theme-color meta `#7c3aed` (purple) → `#020617` (slate-950)

**Auth System (5 methods):**
- Google OAuth — `signInWithOAuth({ provider: 'google' })` — ✅ Working (configured in Session 18)
- Apple OAuth — `signInWithOAuth({ provider: 'apple' })` — UI ready, pending D-U-N-S / Apple Developer enrollment
- Magic Link — `signInWithOtp({ email })` — fully working, no extra config
- Forgot Password — `resetPasswordForEmail()` + `/reset-password` page — fully working
- Email + Password — improved error handling, email confirmation screen

**AuthModal Rewrite:**
- 5 views: sign-in, sign-up, magic-link, forgot-password, check-email
- Extracted shared primitives: Backdrop, Card, EmailField, SubmitButton, ErrorMessage, BackButton
- Inline Google/Apple SVG icons (no external deps)
- Always-dark styling (hardcoded, no theme dependency)

**Custom Domain:**
- Connected `soundsteps.app` to Vercel (DNS A record → 76.76.21.21)
- SSL auto-provisioned via Let's Encrypt
- Supabase redirect URLs configured for soundsteps.app
- DNS moved to Cloudflare in Session 18

**Documentation:**
- Created `docs/AUTH_SETUP.md` — complete setup guide for all 5 auth methods, Google/Apple config steps, redirect URL config, troubleshooting, production checklist

**Build:** ✅ PASSING (3.3s) | **Tests:** ✅ 31 PASSING

### 2026-02-07 (Session 16: Auth Gate, Session Lengths, Color Sweep, Chunk Fix)

**Summary:** Mandatory sign-in (no guest bypass), standardized all session lengths to 10, eliminated all purple/violet UI chrome, fixed ProgramLibrary 576KB chunk, uploaded F-009 audio to Supabase.

**Auth Gate (F-010/F-011 resolved):**
- WelcomeScreen converted from guest-permissive to auth gate (removed "Skip for now")
- Dashboard gates on `useUser()` — unauthenticated users see WelcomeScreen + AuthModal
- AuthModal gets `dismissible` prop, full teal color conversion
- No more guest mode — sign-in required to access any activity

**Session Length Standardization:**
- All activities now use 10-trial sessions for predictability
- RapidFire: 15→10, GrossDiscrimination: 15→10, SentenceTraining: 20→10
- Detection and CategoryPlayer already at 10

**Purple/Violet → Teal Sweep:**
- Batch 7: Converted all `purple-*` references across 28 files
- Batch 8: Converted all remaining `violet-*` references (SentenceTraining, SessionPlayer, ProgramDetail, WelcomeScreen)
- Only intentional exception: Sibilants category badge color in CategoryLibrary

**ProgramLibrary Chunk Fix:**
- Replaced `import * as Icons from 'lucide-react'` (all 1000+ icons) with explicit ICON_MAP (24 icons)
- Chunk size: 576KB → 8.4KB (98.5% reduction)
- Vite chunk size warning eliminated

**F-009 Audio Upload:**
- Obtained Supabase service role key (JWT format) from Dashboard
- Uploaded 350 regenerated files to Supabase Storage (daniel 198 + 8 voices × 19 new words)
- All 9 voices now at 100% coverage

**Untracked Files:**
- Added `regen_output/` to .gitignore
- Committed project docs (core_docs, design system, audio regen plan, etc.)

**Build:** ✅ PASSING (3.2s) | **Tests:** ✅ 31 PASSING | **No chunk warnings**

### 2026-02-07 (Session 15: F-009 Fix, Word Scrub, Design Sweep, Smart Coach)

**Summary:** Fixed F-009 carrier phrase contamination, scrubbed non-words from word list, updated master rules, added reduced-motion support, cleaned dead code.

**F-009 Carrier Phrase Fix:**
- Cross-voice duration audit detected daniel at 92.5% contamination (other 8 voices clean)
- Regenerated 179 daniel files using ellipsis padding (`"... word ..."`) method
- Updated `docs/rules/00_MASTER_RULES.md` with new TTS generation rules and F-009 warning
- Created `docs/F009_INCIDENT_REPORT.md` with full root cause analysis and prevention measures
- **Blocked on Supabase service role key for upload** — all files in `regen_output/daniel/`

**Word List Scrub (Non-Words Removed):**
- Audited all 200 words across 10 clinical sets
- Replaced 11 non-word/marginal pairs with real English words preserving phonological contrasts:
  - Set 2: bap→bat, sud→bud | Set 5: calk→caulk, keem→keen
  - Set 8: fas→miss, han→fun, sof→lot, sen→kin, hep→yell (all 5 truncations replaced)
  - Set 9: pappy→snappy | Set 10: ester-day→Saturday
- Generated audio for 19 new words × 9 voices = 171 files (all in `regen_output/`)
- Created `sql_migrations/cleanup_nonwords.sql` for database cleanup

**Smart Coach Engine:**
- Canonical spec: `docs/rules/10_CLINICAL_CONSTANTS.md` (80%/50%/5dB)
- Removed dead `useSmartCoach()` from `useStimuli.ts`
- 31 unit tests in `src/lib/__tests__/api.test.ts`

**Dead Code Cleanup:**
- Deleted `src/pages/ClinicalReport.tsx` (not in routes, not imported)
- Deleted `src/hooks/useAudioPlayer.ts` (never imported, Capacitor-specific)
- Removed dead `useSmartCoach()` from `useStimuli.ts`

**P1 Fixes (in progress):**
- `prefers-reduced-motion` support added to animated components
- `any` type elimination across hooks and components
- Shared `LoadingSpinner` component created

**Build:** ✅ PASSING | **Tests:** ✅ 31 PASSING

### 2026-02-07 (Session 14: Manual Testing & Triage Fixes)

**Summary:** Manual testing of live app at https://my-hearing-app.vercel.app. Documented 17 findings (3× P0, 7× P1, 4× P2) in `docs/TESTING_FINDINGS.md`. Fixed 6 findings in Batch 2.

**Pages Tested:** Dashboard, Practice Hub, Detection, Word Pairs (CategoryPlayer), Progress

**Findings documented:**
- F-001: No onboarding (P1)
- F-002→F-009: Audio carrier phrase contamination escalated to P0 (~80% of words affected)
- F-003: Theme inconsistency → **FIXED** (dark mode globally)
- F-004: Stats behind user icon → **FIXED** (margin dodge)
- F-005/F-007/F-008: Activity session framework (no progress, no end, no briefing) → **F-007 FIXED** (10 rounds + completion screen)
- F-006: Play button no feedback → **FIXED** (visual disabled state)
- F-009: Carrier phrase P0 → OPEN (needs audio audit)
- F-010: Guest progress silently lost → OPEN (product decision)
- F-011: Should require sign-in → OPEN (product decision)
- F-012: Audiologist sharing compliance → OPEN
- F-013-F-016: Word Pairs UX cluster → OPEN (F-014 partial, F-015 **FIXED**)
- F-017: No dev mode → OPEN

**Code Changes (Batch 2):**
- `index.html`: Added `class="dark"` to `<html>` — activates all Tailwind dark: variants globally
- `src/pages/PracticeHub.tsx`: Converted from light to dark theme (colors, cards, text)
- `src/components/Layout.tsx`: Fixed bottom nav active state colors for dark mode
- `src/pages/Detection.tsx`: Session reduced 50→10 rounds; completion shows SessionSummary; stats dodged with mr-14; play button visual disabled state
- `src/pages/CategoryPlayer.tsx`: Uses user's voice from context (was hardcoded 'sarah'); falls back to any available voice if preferred has no audio
- `src/components/SessionSummary.tsx`: Praise scaled to session length (< 5 items = muted feedback)

**Remaining P0s:**
1. F-009: Audio carrier phrase contamination — needs audit of audio files
2. F-010: Guest mode silently discards progress — needs product decision on sign-in requirement

**New Documentation:**
- `docs/TESTING_FINDINGS.md` — full testing tracker with fix status table and severity guide

### 2026-02-07 (Session 13: Production Readiness Review & Fixes)

**Summary:** Full 4-section code review (Architecture, Code Quality, Deployment Readiness, User-Facing Edge Cases). Triaged top 10 issues, fixed all critical and high-severity items.

**Build Fixes (was broken, now passing):**
- Created `src/lib/syncService.ts` — stub no-op implementations for cloud sync functions
- Created `src/components/ErrorBoundary.tsx` — app-wide crash boundary with retry/home UI
- Created `src/lib/api.ts` — Smart Coach SNR evaluation + Supabase babble/SNR queries
- Fixed `ClinicalReport.tsx` broken import path (`supabaseClient` → `supabase`)

**Audio Playback Hardening (`useAudio.ts`):**
- Added 10-second loading timeout (prevents infinite spinner on slow connections)
- Fixed `new URL()` crash in `togglePlay` (try-catch on malformed src)
- Differentiated error messages via `MediaError` codes (network, format, decode, etc.)
- Added `retry()` function; `AudioPlayer` error state now tappable to retry

**Data Integrity:**
- Wrapped `JSON.parse` of localStorage history in try-catch (prevents app crash on corruption)

**Accessibility (hearing rehab audience):**
- `FeedbackOverlay`: Added `role="status"`, `aria-live="polite"`, `aria-hidden` on icons
- `SNRMixer`: Added `aria-label`, `aria-valuetext` on slider; `aria-label` on play button
- `SmartCoachFeedback`: Added `role="dialog"`, `aria-modal`, `aria-labelledby`, auto-focus
- `Layout`: Added `aria-label` on nav, `aria-current="page"` on active link, `aria-label` on user button
- `RapidFire`: Added `aria-live` on result heading, `aria-pressed` on noise toggle
- Global `focus-visible` ring in `index.css` for keyboard navigation

**Code Quality:**
- Created `src/lib/audio.ts` — shared `getStorageUrl()` + `buildWordAudioUrl()` (DRY)
- Updated `useActivityData.ts`, `useSentenceData.ts`, `useScenarioData.ts` to use shared helper
- Fixed `ProgramLibrary.tsx` hardcoded `userTier = 'free'` → reads from user profile

**Also Fixed:**
- Removed broken symlink `legacy/src/public/hearing-rehab-audio` (was crashing GitHub Pages)
- Added `.nojekyll` to skip Jekyll builds

**Deferred (post-launch):**
- #8: Standardize error handling across hooks (refactor sprint)
- #9: Reusable loading/empty state components (UI polish phase)
- #10 partial: Frontend route guards (backend RLS is primary enforcement)

### 2026-02-06 (Session 12: Launch Prep & 9-Voice Fix)

**Summary:** Implemented 4-task launch plan, deployed to production, fixed critical voice audio bug.

**Task 1: Code Splitting**
- Modified `vite.config.js` with manualChunks for vendor splitting
- Rewrote `src/App.tsx` with React.lazy() for all pages except Dashboard/Layout
- Bundle reduced: 797KB → 272KB main + vendor chunks (supabase 182KB, motion 124KB, charts 342KB, router 85KB)

**Task 2: Hard Mode**
- Added `hardMode` state to UserContext with localStorage persistence
- Added toggle in Settings.tsx between Appearance and Instructor Voice
- RapidFire.tsx: Blurs answer cards until audio plays when enabled
- Player.tsx: Hides transcript until audio plays when enabled

**Task 3: Tier Locking**
- Fixed `hasAccess()` case sensitivity in UserContext
- Added `requiredTier` to ActivityList items (Programs/Stories/Sentences = Standard, Scenarios = Premium)
- Lock overlay on gated activities with upsell banner

**Task 4: Progress Reports**
- Created `src/pages/ProgressReport.tsx` with recharts visualization
- Added print CSS to index.css for PDF export
- Enabled /progress nav tab in Layout.tsx
- Premium-gated "Share with Audiologist" button

**Critical Bug Fix: 9-Voice Audio**
- **Problem:** VoiceContext listed 9 voices but database only had columns for 4 → other voices played no audio
- **Solution:** Changed from database columns to dynamic URL construction
- **Pattern:** `{SUPABASE_URL}/storage/v1/object/public/audio/words_v2/{voice}/{word}.mp3`
- Added `buildAudioUrl()` function and `AVAILABLE_VOICES` array in `useActivityData.ts`
- **No database migrations needed for new voices going forward**

**Deployment Fixes**
- Fixed Supabase env var sanitization (newlines/whitespace breaking Headers)
- Git-triggered deploys now working (were previously failing)

**Documentation Added**
- `docs/VOICE_LIBRARY.md`: Added "CRITICAL: Audio URL Architecture" section
- `.claude/rules/audio.md`: Updated with 9-voice roster and URL pattern
- `src/hooks/useActivityData.ts`: Added prominent header comment explaining architecture

**Files Modified:**
- `vite.config.js` - Vendor chunk splitting
- `src/App.tsx` - Lazy loading, PageLoader, /progress route
- `src/store/UserContext.tsx` - hardMode, hasAccess() fix
- `src/store/VoiceContext.tsx` - 9-voice roster
- `src/hooks/useActivityData.ts` - Dynamic audio URLs
- `src/pages/Settings.tsx` - Hard Mode toggle, voice list from context
- `src/pages/RapidFire.tsx` - Hard mode visibility, tier filtering
- `src/pages/Player.tsx` - Hard mode transcript
- `src/pages/ActivityList.tsx` - Tier locking
- `src/pages/ProgressReport.tsx` - NEW
- `src/pages/CategoryLibrary.tsx` - Fixed table query
- `src/components/Layout.tsx` - Enabled Progress nav
- `src/lib/supabase.ts` - Env var sanitization
- `src/index.css` - Print styles

**Commits:**
```
feat: Implement code splitting with React.lazy and vendor chunks
feat: Add Hard Mode toggle and conditional answer visibility
feat: Add tier locking to ActivityList with lock overlay
feat: Add ProgressReport page with charts and print support
fix: Sanitize Supabase env vars to remove newlines/whitespace
fix: Query word_pairs table instead of stimuli_catalog for categories
fix: Limit voice selection to 4 voices with audio data
feat: Dynamic audio URLs for all 9 voices from Supabase storage
docs: Document voice audio architecture to prevent future confusion
```

---

### 2026-01-25 (Session 11: Claude Code Rules Configuration)

**Summary:** Adopted patterns from `everything-claude-code` (Anthropic hackathon winner) to create comprehensive Claude Code configuration.

**Rules Created (`.claude/rules/`):**
- `security.md` - Supabase security, secret management, audio asset handling
- `coding-style.md` - Immutability, file organization, React patterns
- `testing.md` - Vitest/RTL setup, audio mocking, TDD workflow
- `regulatory.md` - FDA compliance, prohibited/acceptable terminology
- `audio.md` - iOS Safari compat, preloading, SNR mixing, memory management
- `git-workflow.md` - Commit format, branch strategy, pre-commit checks

**Skills Created (`.claude/skills/`):**
- `audio-workflow.md` - Audio development patterns, iOS compat, testing mocks
- `react-patterns.md` - SoundSteps-specific React patterns, hooks, contexts
- `verification-loop.md` - Pre-commit verification workflow

**Commands Created (`.claude/commands/`):**
- `verify.md` - Run comprehensive verification (build, types, tests, security)
- `audio-check.md` - Audio-specific code quality checks

**Config Files:**
- `hooks.json` - PostToolUse hooks for console.log, clinical terminology, audio cleanup
- `mcp-config.json` - Supabase, Vercel, Memory MCP server configs
- `settings.json` - Project-level preferences

**Files Modified:**
- `CLAUDE.md` - Added reference to `.claude/rules/` directory

**Source:** https://github.com/affaan-m/everything-claude-code

### 2026-01-25 (Session 10: Security Hardening & Best Practices Audit)

**Summary:** Comprehensive security audit and fixes, regulatory language cleanup, documentation restructure.

**Security Hardening:**
- ✅ Rotated all API keys (Supabase publishable + secret, ElevenLabs)
- ✅ Fixed npm vulnerabilities (tar 7.5.6 override, 0 remaining)
- ✅ Removed `VITE_DEV_MODE` bypass in UserContext (premium now properly gated)
- ✅ Updated `.env.local` with new keys
- ✅ Added React `ErrorBoundary` component for crash protection

**Regulatory Compliance (FDA/Whoop ruling):**
- ✅ Fixed user-facing "clinical training" → "structured training"
- ✅ Created schema migration `rename_clinical_to_training.sql`
- ✅ Updated STATUS.md terminology (Clinical → Professional/Training)

**Documentation:**
- ✅ Created `docs/INDEX.md` - master navigation for all docs
- ✅ Conducted architecture audit (found 47 `any` casts, 5 duplicate hooks)
- ✅ Conducted security audit (identified all risks, now resolved)
- ✅ Conducted content delivery audit (noted missing code splitting)

**Files Created/Modified:**
- `src/components/ErrorBoundary.tsx` - New crash boundary
- `src/App.tsx` - Wrapped with ErrorBoundary
- `src/store/UserContext.tsx` - Removed dev bypass
- `src/pages/ActivityList.tsx` - Fixed "clinical" text
- `docs/INDEX.md` - New documentation navigation
- `sql_migrations/rename_clinical_to_training.sql` - Pending migration
- `package.json` - Added tar override for security

**Remaining:**
- [ ] Run schema migration in Supabase SQL Editor
- [ ] Update Vercel environment variables

### 2026-01-25 (Session 9: Master Plan Phases 2-4 - Design, Platforms, Auth)

**Summary:** Completed Phases 2-4 of the SoundSteps Master Plan - design system primitives, iOS/Android platform setup, and cross-device sync.

**Phase 2: Design System Unification (Complete)**
- ✅ Enhanced `tailwind.config.js` with full token system:
  - OLED-safe color palette (background/surface/elevated)
  - Bioluminescent brand colors (teal/amber with glow effects)
  - Clinical status colors (success/error/warning)
  - Custom animations (fade-in, slide-up, pulse-glow)
  - Scale transforms (98%/102% for press/hover)
- ✅ Created `src/components/primitives/Button.tsx`:
  - 4 variants: primary, secondary, ghost, danger
  - 3 sizes: sm, md, lg
  - Loading state with spinner
  - Full width option
- ✅ Created `src/components/primitives/Card.tsx`:
  - 3 variants: surface, elevated, outline
  - CardHeader, CardTitle, CardDescription, CardContent, CardFooter
  - Interactive mode with hover/focus states
  - Configurable padding and border-radius
- ✅ Created `src/components/primitives/index.ts` for exports

**Phase 3: Platform Strategy - iOS & Android (Complete)**
- ✅ Verified both `ios/` and `android/` directories exist and are configured
- ✅ Enhanced `capacitor.config.ts` with hearing device support:
  - iOS: MFi hearing device routing, inline media playback
  - Android: ASHA compatibility, minSdkVersion 24
- ✅ Enhanced `public/sw.js` with v2.0.0 features:
  - Selective audio caching for premium users
  - 100MB cache size limit with LRU eviction
  - Cache info API for settings page
  - Clear cache API
- ✅ Created `docs/IOS_DEPLOYMENT.md`:
  - Prerequisites (Xcode, CocoaPods, Apple Developer)
  - MFi hearing device configuration
  - TestFlight and App Store submission guide
- ✅ Created `docs/ANDROID_DEPLOYMENT.md`:
  - Prerequisites (Android Studio, SDK, Play Console)
  - ASHA hearing device configuration
  - Play Store submission guide

**Phase 4: Authentication & Sync (Complete)**
- ✅ Created `src/lib/syncService.ts`:
  - `migrateGuestData(userId)` - Merge localStorage to Supabase on first login
  - `pullProgress(userId)` - Fetch cloud data for authenticated users
  - `syncOfflineData(userId)` - Push queued offline progress
  - `queueOfflineProgress()` - Store progress when offline
  - Streak calculation from session history
  - Audio caching control for premium users
- ✅ Updated `src/store/UserContext.tsx`:
  - Auto-migrate guest data on SIGNED_IN event
  - Sync offline data on TOKEN_REFRESHED
  - Pull cloud preferences after login
  - Enable audio caching for Standard/Premium users

**Documentation Created:**
- `docs/IOS_DEPLOYMENT.md` - Complete iOS build and deploy guide
- `docs/ANDROID_DEPLOYMENT.md` - Complete Android build and deploy guide

**Build Verified:**
- ✅ All 58 tests passing
- ✅ Build completes in ~3 seconds
- ✅ Capacitor sync succeeds for Android (iOS needs Xcode)

**Next:** Phase 5 (Testing Strategy) and Phase 6 (Analytics)

### 2026-01-25 (Session 8: Master Plan Phase 1 - Foundation Hardening)

**Summary:** Implemented Phase 1 of the SoundSteps Master Plan - testing infrastructure, design system, and documentation.

**Testing Infrastructure:**
- ✅ Enhanced `src/test/setup.ts` with comprehensive mocks:
  - Web Audio API (AudioContext, GainNode, AudioBufferSourceNode)
  - Capacitor (Haptics, Filesystem)
  - Supabase client with auth helpers
  - localStorage, matchMedia, IntersectionObserver
- ✅ Created `src/test/testUtils.tsx` with provider wrappers
- ✅ Created `src/hooks/useSNRMixer.test.ts` - 24 tests (dB conversion, Silent Sentinel)
- ✅ Created `src/hooks/useProgress.test.tsx` - 16 tests (streak, daily steps, metadata)
- ✅ Created `src/hooks/useProgressData.test.ts` - 16 tests (guest/auth modes, data aggregation)
- ✅ All 58 tests passing

**Design System:**
- ✅ Created `src/styles/tokens.ts` with:
  - OLED-safe color palette
  - Bioluminescent brand colors (teal/amber)
  - Neumorphic shadows
  - Spacing/typography/animation scales
  - CSS variable generator

**Platform Preparation:**
- ✅ Enhanced `capacitor.config.ts` with iOS/Android configs
- ✅ Created `src/lib/browserDetect.ts` for platform-specific handling
  - MFi/ASHA hearing device detection
  - Audio unlock strategy detection
  - PWA detection

**Documentation:**
- ✅ Created `docs/BROWSER_COMPATIBILITY.md` - Platform matrix with audio unlock strategy
- ✅ Created `docs/DESIGN_SYSTEM.md` - Visual language specification
- ✅ Created `docs/UI_REVIEW_CHECKLIST.md` - QA checklist for UI work

**Bug Fixes:**
- ✅ Created missing `src/pages/ProgramLibrary.tsx` (was breaking build)

**Next:** Phase 2 (Design System Unification) and Phase 3 (iOS/Android native builds)

### 2026-01-23/24 (Session 7: Content Expansion v2 - Massive Library Build)

**Summary:** Generated 10,618 new audio files before ElevenLabs credits exhausted. 2,862 files remaining.

- **Schema Migration:** Successfully ran `content_expansion_v2_final.sql` using PL/pgSQL exception handling
- **Database Fixes:**
  - Discovered actual schema columns: `content_text`, `content_type`, `clinical_metadata`
  - Dropped `stimuli_catalog_content_type_check` constraint to allow new content types
  - Updated all ingestion scripts to use UUID generation and correct column names
- **Content Ingested:**
  - 80 conversations (Q&A pairs) across 6 categories
  - 200 phoneme drill pairs across 10 packs
  - 50 environmental sounds across 5 categories
- **Audio Generated (✅ Complete):**
  - Conversations: 1,400 files (80 pairs × 9 voices × 2)
  - Phoneme Drills: ~3,600 files (200 pairs × 9 voices × 2)
  - Environmental Sounds: 50 files
  - Scenarios: 529 files (129 dialogue lines × 4 voice combos)
  - Rate Variants: 1,800 files (100 items × 2 rates × 9 voices)
  - Stories v3: 449 files (50 stories × 9 voices, 1 failed)
  - Sentences v2: 2,790 files (sentences 1-310 × 9 voices)
- **Audio Remaining (⚠️ Credits Exhausted):**
  - Sentences v2: 2,862 files (sentences 311-628 × 9 voices)
  - To resume: `python3 scripts/generate_sentences_v2.py`
- **New Content Created:**
  - `stories_v3.csv`: 50 NEW stories (daily_life, health, workplace, travel, creative)
  - `sentences_v2.csv`: 628 NEW sentences with acoustic/semantic foils
- **Scripts Created:**
  - `scripts/generate_stories_v3.py` - Story audio for v3 content
  - `scripts/generate_sentences_v2.py` - Sentence audio for v2 content
- **IPA Character Fix:** Replaced IPA characters in phoneme_drills_v1.csv with ASCII equivalents
- **Credits Used:** ~220,000+ (entire available balance)

### 2026-01-22 (Session 6: Content Expansion & Database Linkage)
- **Story Library Expansion**: Created 50 new stories with 200 comprehension questions
  - Categories: daily_life, health_wellness, workplace_social, travel_adventure, creative_whimsical
  - Difficulty levels 1-5 with progressive complexity
- **Story Audio Generation**: 440 files (50 stories × 9 voices) - 100% complete
- **Sentence Audio Linkage**: 5,034 new audio_assets entries linking all 9 voices
- **Word Pair Audio Linkage**: All 2,026 word pairs linked to 4 voices (sarah, marcus, emma, david)
- **Noise Generation**: 8 noise assets (Tier 1-3) for SNR training
- **Scenario Pilot**: 15 multi-speaker dialogue files generated
- **Documentation**: Created `docs/AUDIO_INVENTORY.md` as single source of truth
- **Scripts Created**:
  - `scripts/generate_stories_v2.py` - Story audio generation
  - `scripts/link_sentence_audio.py` - Sentence audio linkage
  - `scripts/link_word_audio.py` - Word pair audio linkage
  - `scripts/generate_scenario_audio.py` - Multi-speaker dialogue
  - `scripts/generate_clinical_noise.py` - Babble noise assets
  - `scripts/ingest_stories_v2.py` - Story CSV ingestion
  - `scripts/ingest_scenarios_v2.py` - Scenario CSV ingestion

### 2026-01-19 (Session 5: Content Generation COMPLETE)
- Completed comprehensive audio content audit across all voices
- Created and ran generation scripts:
  - `scripts/generate_sentences_all_voices.py` - 4,953 files generated
  - `scripts/generate_stories_all_voices.py` - 94 files generated
- Created `sql_migrations/add_story_voice_columns.sql` for schema update
- **Total: 5,047 new audio files with 99.98% success rate**
- All 9 voices now have complete sentence coverage (628 each)
- All 9 voices now have complete story coverage (12 each)
- Remaining: Run schema migration, verify in app

### 2026-01-19 (Session 4: Voice Generation Complete)
- Verified Daniel & Aravind generation is COMPLETE
  - Daniel: 1845/1847 words (99.9%) - missing only "writing" and "zoo"
  - Aravind: 1847/1847 words (100%)
- Confirmed voices are distinct (different ElevenLabs IDs, different file sizes)
- All 9 voices now have full word coverage in Supabase `audio/words_v2/`
- Updated STATUS.md with verified completion status
- **Voice Audio Gaps blocker RESOLVED**

### 2026-01-18 (Session 3: Voice Regeneration + Programs Verification)
- Completed Alice voice regeneration (763 failed words, 98.7% pass rate)
- Completed multivoice regeneration (Bill, Michael, Charlie, Matilda)
- Started Daniel & Aravind full generation
- Verified Programs architecture deployment:
  - 5 programs, 28 sessions, 224 items in database
  - UI flow confirmed: ProgramLibrary → ProgramDetail → SessionPlayer
  - Routes properly configured in App.tsx

### 2025-01-18 (Session 2: Voice Audit & Script Cleanup)
- Completed comprehensive voice audit
- Deprecated Marcus & David (poor HNR quality)
- Updated VoiceContext.tsx: removed deprecated, added 9 new voices
- Rewrote VOICE_LIBRARY.md as single source of truth
- Identified 2,452 failed words needing regeneration
- Identified 2 voices (Daniel, Aravind) with no audio
- **Script cleanup:** Updated voice lists in:
  - `scripts/validate_all_voices.py`
  - `scripts/generate_scenarios.py`
  - `scripts/generate_batch_pilot.py`
  - `scripts/backfill_word_pairs.py`
  - `scripts/backfill_word_pairs_fast.py`
  - `docs/rules/00_MASTER_RULES.md`
- Removed duplicate: `docs/30_VOICE_ROSTER.md`
- Note: Legacy scripts still have old voices (for historical data)

### 2025-01-18 (Session 1: Project Review)
- Audited documentation and project state
- Verified word pairs backfill succeeded (2,136 records)
- Confirmed constraint fix NOT needed (scripts use 'sentence' workaround)
- Created STATUS.md for session continuity

### Previous (from docs)
- Cloud migration to Supabase complete
- Smart Coach foundation implemented
- 9-voice system established (after quality audit)
- Carrier phrase audio pipeline validated

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Project instructions | `CLAUDE.md` |
| Session status | `STATUS.md` (this file) |
| **Documentation index** | `docs/INDEX.md` |
| **Audio inventory** | `docs/AUDIO_INVENTORY.md` |
| **Regulatory language** | `docs/REGULATORY_LANGUAGE_GUIDE.md` |
| Architecture rules | `docs/rules/00_MASTER_RULES.md` |
| Voice config | `docs/VOICE_LIBRARY.md` |
| SNR/audio constants | `docs/rules/10_CLINICAL_CONSTANTS.md` |
| Programs schema | `sql_migrations/create_programs_schema.sql` |

---

## Verification Queries (Supabase SQL Editor)

### Check Programs Schema
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('programs', 'program_sessions', 'session_items', 'user_program_progress');
```

### Check Content Counts
```sql
SELECT 'stimuli_catalog' as tbl, COUNT(*) FROM stimuli_catalog
UNION ALL
SELECT 'audio_assets', COUNT(*) FROM audio_assets
UNION ALL
SELECT 'word_pairs', COUNT(*) FROM word_pairs;
```

---

## Session Log Format

When ending a session, update this file with:

```markdown
### YYYY-MM-DD
- What was completed
- What blockers were encountered
- What's next
```
