# CLAUDE.md - Hearing Rehabilitation App

## CRITICAL: Working Directory (READ FIRST)

**ALWAYS work from:** `~/Projects/my-hearing-app`

**NEVER work from:** `~/Desktop/my-hearing-app` or any iCloud-synced folder

### Why This Matters
- iCloud syncs `~/Desktop` by default on macOS
- node_modules (125MB+, thousands of files) causes iCloud sync to deadlock
- ALL terminal commands will hang forever: `npm install`, `npm run build`, `git status`, even `mv`
- This is NOT a network issue - it's a local I/O deadlock

### Quick Directory Check
```bash
# Verify you're in the right place
pwd  # Must show /Users/clyle/Projects/my-hearing-app

# If commands hang, you're probably in wrong directory
cd ~/Projects/my-hearing-app
```

**Full setup guide:** See `DEVELOPMENT_SETUP.md`

---

## CRITICAL: Single Source of Truth

**`~/Projects/my-hearing-app` is the ONLY canonical location for everything — code AND documentation.**

A legacy copy exists at `~/Desktop/my-hearing-app/` but it is **read-only reference only**. All docs from that copy were ported to the active project in Feb 2026. Specifically:

- `core docs/` (with space) on Desktop → `core_docs/` (with underscore) in Projects
- Desktop `docs/rules/` → Projects `docs/rules/`
- Desktop `.claude/rules|commands|skills/` → Projects `.claude/rules|commands|skills/`
- Desktop `src/styles/tokens.ts` → Projects `src/styles/tokens.ts`

**If you create or update any documentation, it goes in `~/Projects/my-hearing-app/` — never Desktop.**

---

## Session Continuity

**Starting a new session?**
1. `cd ~/Projects/my-hearing-app` (CRITICAL!)
2. Read `STATUS.md` - current state, blockers, next actions
3. `git pull` to get latest changes

**Working on UI?** Read `docs/STYLE_GUIDE.md` first — "Aura" design system, teal primary CTA, no cyberpunk

**Working with audio?** Read `docs/AUDIO_INVENTORY.md` - single source of truth for audio assets

**Writing user-facing copy?** Read `docs/REGULATORY_LANGUAGE_GUIDE.md` - stay in "training app" territory

**Ending a session?** Update `STATUS.md` with:
- What was completed
- Any blockers encountered
- What's next

```bash
# Quick status check (from ~/Projects/my-hearing-app)
cat STATUS.md | head -60
```

---

## Project Overview
This is a web-based hearing rehabilitation application designed specifically for cochlear implant users and people with hearing loss. The app provides auditory training exercises using AI-generated speech from ElevenLabs, with features for progress tracking, audio preloading, and personalized voice training.

**Target Users:** Cochlear implant recipients, audiologists, family members helping with hearing rehabilitation

**Core Purpose:** Improve speech recognition and auditory processing through systematic exercises

## Project Structure

### Directory Layout
```
~/Projects/my-hearing-app/          <- CANONICAL LOCATION (code + docs)
├── src/
│   ├── components/                 <- React components
│   ├── hooks/                      <- Custom React hooks
│   ├── lib/                        <- Utilities and helpers
│   ├── pages/                      <- Page components
│   ├── store/                      <- State management
│   ├── styles/                     <- Design tokens (tokens.ts)
│   └── types/                      <- TypeScript types
├── core_docs/                      <- Brand strategy, design system, master plan
├── docs/                           <- Technical documentation
│   └── rules/                      <- Architecture & clinical rules
├── public/                         <- Static assets
├── scripts/                        <- Audio generation scripts
├── sql_migrations/                 <- Database migrations
├── .claude/
│   ├── rules/                      <- Agent rules (6 files)
│   ├── commands/                   <- Agent commands
│   └── skills/                     <- Agent skills
├── CLAUDE.md                       <- This file
├── STATUS.md                       <- Session status
├── DEVELOPMENT_SETUP.md            <- Critical setup guide
└── vercel.json                     <- Deployment config
```

### External Dependencies
- **Supabase:** Database and storage backend
- **ElevenLabs API:** Voice generation for custom voices
- **Vercel:** Deployment platform
- **Tailwind CSS:** Styling framework

## Technical Architecture

### Frontend Stack
- React 19.2.0 with TypeScript
- Vite 7.2.4 for build
- Tailwind CSS for styling
- Capacitor for native mobile features

### Key Systems
- **Web Audio API:** SNR mixing, "Silent Sentinel" pattern for Bluetooth
- **Service Worker:** PWA offline support
- **Supabase Auth:** User authentication
- **LocalStorage:** Guest mode progress persistence

## Code Conventions

### TypeScript Patterns
- **ES6+ features:** const/let, arrow functions, async/await
- **Type safety:** Proper interfaces for all data structures
- **Error handling:** Always wrap async operations in try/catch

### React Patterns
- Functional components with hooks
- Custom hooks for data fetching (useStimuli, useAudioPlayer, etc.)
- Context for global state (UserContext, VoiceContext)

### CSS & Design Guidelines
- **Read `docs/STYLE_GUIDE.md` before any UI work** — "Aura" design system
- **"The Apple of Hearing"** — Clean, Swiss, Medical-Grade. NOT cyberpunk.
- Primary CTA color: **Teal** (`bg-teal-500`), not purple/violet
- Solid button fills only — no gradients, no colored shadows
- `font-bold` max — never `font-black`
- Tailwind utility classes primarily
- Custom CSS only for complex animations
- Mobile-first responsive design

## How Claude Should Help

### Before Making Changes
1. Verify you're reading from `~/Projects/my-hearing-app`
2. Read and understand the current code structure
3. Consider impact on audio caching, progress tracking, and UX
4. Check for mobile responsiveness implications

### Implementation Guidelines
- Preserve audio caching system - don't break preloading
- Keep progress persistence - maintain localStorage compatibility
- Test on mobile - ensure responsive design stays intact
- Maintain accessibility - preserve screen reader compatibility

### Testing
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Building & Deploying
```bash
# From ~/Projects/my-hearing-app ONLY
npm run build         # Production build (~3 seconds)
npm run dev           # Development server

# Deploy to Vercel
npx vercel --prod
```

## Git Commit Guidelines

- **UNIVERSAL LAW: NEVER include "Co-Authored-By: Claude" or any Claude attribution**
- Create clear, descriptive commit messages
- All commits attributed to human developer only

## Key Files Reference

| Purpose | File |
|---------|------|
| **CRITICAL SETUP** | `DEVELOPMENT_SETUP.md` |
| **Design system** | `docs/STYLE_GUIDE.md` — "Aura" system (read before any UI work) |
| **Brand strategy** | `core_docs/3_BRAND_STRATEGY.md` — "The Apple of Hearing" |
| **Design tokens** | `core_docs/4_DESIGN_SYSTEM.md` — Full Aura token spec |
| **Master plan** | `core_docs/5_MASTER_PLAN.md` — Phased roadmap |
| Architecture rules | `docs/rules/00_MASTER_RULES.md` |
| Clinical constants | `docs/rules/10_CLINICAL_CONSTANTS.md` — SNR math, Smart Coach |
| UI review checklist | `docs/UI_REVIEW_CHECKLIST.md` — Quality gates |
| Session status | `STATUS.md` |
| Audio inventory | `docs/AUDIO_INVENTORY.md` |
| Audio master inventory | `docs/AUDIO_MASTER_INVENTORY.md` — 31K+ files |
| Voice config | `docs/VOICE_LIBRARY.md` |
| Regulatory language | `docs/REGULATORY_LANGUAGE_GUIDE.md` — FDA-safe copy |
| Browser compat | `docs/BROWSER_COMPATIBILITY.md` — iOS Safari, MFi/ASHA |
| Vercel config | `vercel.json` |

## Notion Project Log Integration

**Log significant sessions to maintain project documentation and IP tracking.**

```python
#!/usr/bin/env python3
import sys
sys.path.append('/Users/clyle/Desktop/Desktop:Hearing Rehab')
from dotenv import load_dotenv
from notion_logger import quick_log_session

load_dotenv('/Users/clyle/Desktop/Desktop:Hearing Rehab/.env')

result = quick_log_session(
    title="Session Title Here",
    duration_minutes=180,
    session_type="Development|Bug Fix|Planning|Research",
    topics=["Topic 1", "Topic 2"],
    decisions="Key decisions made",
    action_items="1. Next step\n2. Another step",
    conversation_url="https://claude.ai/chat/current-session",
    costs=0.0,
    notes="Additional context"
)
```

## Contact & Context
- **Developer:** deafjamz (Bruce)
- **Email:** blueairstreet@proton.me
- **Personal Context:** Developer has cochlear implants and understands user needs firsthand
- **Business Context:** Potential SaaS product for hearing rehabilitation market

---

**Remember:** This app serves people working to regain or improve their hearing. Every change should make their rehabilitation journey easier and more effective.
