# SoundSteps — New Session Handoff Prompt

Copy and paste the block below into a fresh Claude Code terminal to get up to speed instantly.

---

## Prompt

```
You are resuming work on SoundSteps, a React 19 + Vite 7 + Supabase + Tailwind hearing rehabilitation web app. This is a PWA deployed on Vercel at soundsteps.app.

CRITICAL RULES:
- ALWAYS work from ~/Projects/my-hearing-app (NEVER ~/Desktop — iCloud sync deadlocks)
- NEVER add Co-Authored-By to commits
- NEVER use `new Audio()` — ALL audio must play through Web Audio API (useSilentSentinel's playUrl). See MEMORY.md → Audio Routing.
- NEVER use "clinical" in user-facing text (FDA regulatory). See docs/REGULATORY_LANGUAGE_GUIDE.md
- NEVER use gradients, purple, or `font-black`. Design system is "Aura" — teal primary, solid fills, font-bold max.
- console.log must be gated behind import.meta.env.DEV

DESIGN SYSTEM (Aura — "The Apple of Hearing"):
- Primary CTA: teal-500, hover teal-400
- Background: slate-950 (#0A0E14)
- Font: Satoshi (configured in tailwind + index.html)
- Dark mode: ALWAYS ON — `class="dark"` on <html>, no light mode
- Primitives: `src/components/primitives/` — Button (primary/secondary/ghost × sm/md/lg) and Card (default/highlighted/subtle). Import from `@/components/primitives`. Uses cn() from @/lib/utils (clsx + tailwind-merge).
- Button auto-fires hapticSelection() on click, supports forwardRef
- Card has configurable `padding` prop (default p-6), `variant` prop
- 14 files already adopted — DO NOT replace motion.div/motion.button (Framer Motion), <Link> elements, play circles, answer grids, toggles, or analytics cards (print styles)
- tokens.ts has brand: { teal, amber } — this is CURRENT Aura palette, NOT legacy

KEY ARCHITECTURE:
- Audio URLs: src/lib/audio.ts — getStorageUrl(path) and buildWordAudioUrl(voice, word)
- 9 voices: sarah, emma, bill, michael, alice, daniel, matilda, charlie, aravind
- Auth: Supabase Auth, mandatory sign-in
- Tiers: UserContext uses Free/Standard/Premium
- Smart Coach: src/lib/api.ts — 2-down/1-up staircase, only in RapidFire
- Progress: useProgress.ts → user_progress table, content_id is TEXT type
- Analytics: 6 hooks (useProgressData, useProgressByActivity, useAnalytics, usePhonemeAnalytics, useLongitudinalAnalytics, useRecommendations) + 14 cards in src/components/analytics/

RECENT COMPLETED WORK (Session 28):
- Button/Card primitives created and adopted across 14 files (18 Buttons + 14 Cards)
- QuizCard.tsx dark-mode fixed (9 class replacements — all light patterns → dark)
- ALL brand-* tokens purged from .tsx files, legacy palette removed from tailwind.config.js
- SNRMixer.tsx realigned to dark mode
- Build: clean (5.16s, CSS 56.28KB)
- All 27 test findings resolved (25 fixed, 1 deferred F-012, 1 superseded F-002)

WHAT TO READ FIRST:
1. STATUS.md — current state, what's done, what's next
2. docs/STYLE_GUIDE.md — before ANY UI work
3. docs/REGULATORY_LANGUAGE_GUIDE.md — before any user-facing text
4. CLAUDE.md — full project rules

PENDING TODO (priority order):
1. Continue logo iteration (branding/logo-gen/ pipeline ready)
2. Live test Placement Assessment + Today's Practice + BT audio routing
3. Marketing Phase 2 — competitive research + landing pages
4. Sprint 3 Phase D — weekly email digest (Supabase Edge Function + Resend)
5. Apple OAuth (pending D-U-N-S number)
6. Supabase Custom Domain ($25/mo Pro plan)
7. F-012 product decision (Share with Audiologist)

Start by reading STATUS.md, then ask what to work on.
```
