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

## Session Continuity

**Starting a new session?**
1. `cd ~/Projects/my-hearing-app` (CRITICAL!)
2. Read `STATUS.md` - current state, blockers, next actions
3. `git pull` to get latest changes

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
~/Projects/my-hearing-app/          <- CANONICAL DEVELOPMENT LOCATION
├── src/
│   ├── components/                 <- React components
│   ├── hooks/                      <- Custom React hooks
│   ├── lib/                        <- Utilities and helpers
│   ├── pages/                      <- Page components
│   ├── store/                      <- State management
│   └── types/                      <- TypeScript types
├── public/                         <- Static assets
├── scripts/                        <- Audio generation scripts
├── sql_migrations/                 <- Database migrations
├── docs/                           <- Documentation
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

### CSS Guidelines
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
| Session status | `STATUS.md` |
| Audio inventory | `docs/AUDIO_INVENTORY.md` |
| Vercel config | `vercel.json` |
| Architecture rules | `docs/rules/00_MASTER_RULES.md` |
| Voice config | `docs/VOICE_LIBRARY.md` |

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
