# SoundSteps Documentation Index

> **Quick Start:** New to the project? Read in this order:
> 1. `README.md` (root) - Project overview
> 2. `STATUS.md` (root) - Current state & what's next
> 3. `CLAUDE.md` (root) - AI agent instructions

---

## Navigation by Role

### For New Developers
| Doc | Purpose |
|-----|---------|
| [README.md](../README.md) | Project overview, tech stack |
| [STATUS.md](../STATUS.md) | Current state, blockers, next actions |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to contribute |
| [BROWSER_COMPATIBILITY.md](./BROWSER_COMPATIBILITY.md) | Platform support matrix |

### For AI Agents (Claude, etc.)
| Doc | Purpose |
|-----|---------|
| [CLAUDE.md](../CLAUDE.md) | Primary instructions, session protocol |
| [STATUS.md](../STATUS.md) | Current context (read first!) |
| [docs/rules/00_MASTER_RULES.md](./rules/00_MASTER_RULES.md) | Architecture constraints |
| [docs/rules/10_CLINICAL_CONSTANTS.md](./rules/10_CLINICAL_CONSTANTS.md) | SNR math, audio specs |

### For Content/Audio Work
| Doc | Purpose |
|-----|---------|
| [AUDIO_MASTER_INVENTORY.md](./AUDIO_MASTER_INVENTORY.md) | Master inventory — 31,413+ files, 9 content types, all voices |
| [AUDIO_INVENTORY.md](./AUDIO_INVENTORY.md) | Audio asset reference (original) |
| [VOICE_LIBRARY.md](./VOICE_LIBRARY.md) | 9-voice roster, ElevenLabs IDs |
| [CONTENT_PIPELINE_GEN2.md](./CONTENT_PIPELINE_GEN2.md) | Audio generation process |
| [STORY_MODULE_STRATEGY.md](./STORY_MODULE_STRATEGY.md) | Story content design strategy |
| [PRODUCTION_READY_GENERATION.md](./PRODUCTION_READY_GENERATION.md) | Production audio generation specs |
| [scripts/README.md](../scripts/README.md) | Generation script documentation |

### For Regulatory/Legal
| Doc | Purpose |
|-----|---------|
| [REGULATORY_LANGUAGE_GUIDE.md](./REGULATORY_LANGUAGE_GUIDE.md) | **CRITICAL** - FDA-safe terminology |
| [LLC_FORMATION_GUIDE.md](./LLC_FORMATION_GUIDE.md) | Business setup |
| [LAUNCH_STRATEGY.md](./LAUNCH_STRATEGY.md) | Go-to-market plan |

### For Deployment/Ops
| Doc | Purpose |
|-----|---------|
| [SW_DEPLOYMENT_GUIDE.md](./SW_DEPLOYMENT_GUIDE.md) | **Service Worker cache-busting & deploy best practices** |
| [IOS_DEPLOYMENT.md](./IOS_DEPLOYMENT.md) | iOS build & TestFlight |
| [ANDROID_DEPLOYMENT.md](./ANDROID_DEPLOYMENT.md) | Android build & Play Store |
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Database configuration |
| [INFRASTRUCTURE_AUDIT.md](./INFRASTRUCTURE_AUDIT.md) | System audit results |

---

## Directory Structure

```
/
├── CLAUDE.md              # AI agent instructions
├── STATUS.md              # Session continuity (READ FIRST)
├── README.md              # Project overview
│
├── docs/
│   ├── INDEX.md           # This file
│   │
│   ├── rules/             # Constraints & constants
│   │   ├── 00_MASTER_RULES.md
│   │   ├── 10_CLINICAL_CONSTANTS.md
│   │   └── 20_DESIGN_TOKENS.md
│   │
│   ├── # Active documentation
│   ├── AUDIO_INVENTORY.md
│   ├── VOICE_LIBRARY.md
│   ├── DESIGN_SYSTEM.md
│   ├── BROWSER_COMPATIBILITY.md
│   ├── REGULATORY_LANGUAGE_GUIDE.md
│   │
│   ├── # Deployment guides
│   ├── IOS_DEPLOYMENT.md
│   ├── ANDROID_DEPLOYMENT.md
│   ├── SUPABASE_SETUP.md
│   │
│   └── # Strategy & planning
│       ├── LAUNCH_STRATEGY.md
│       └── ROADMAP.md
│
├── src/                   # Application source
│   └── test/              # Test setup (vitest, mocks)
├── scripts/               # Python generation & ingestion scripts (31 files)
├── content/source_csvs/   # Content definitions (stories, sentences, scenarios, etc.)
├── seeds/                 # Database seed data
├── sql_migrations/        # Database migrations (36 files)
├── supabase/              # Edge functions (evaluate-session)
├── .claude/               # Claude Code config (hooks, MCP, settings, rules, skills)
└── .github/workflows/     # CI/CD (build-and-deploy, deploy-schema)
```

---

## Document Status

### Active (Current)
| Doc | Last Updated | Status |
|-----|--------------|--------|
| STATUS.md | 2026-02-15 | ✅ Current (Session 30b — consolidation) |
| CLAUDE.md | 2026-01-25 | ✅ Current |
| AUDIO_MASTER_INVENTORY.md | 2026-02-15 | ✅ Current (31,413+ files, speed variants planned) |
| AUTH_SETUP.md | 2026-02-08 | ✅ Current |
| TESTING_FINDINGS.md | 2026-02-08 | ✅ Current |
| INFRASTRUCTURE_AUDIT.md | 2026-02-08 | ✅ Current |
| AUDIO_INVENTORY.md | 2026-01-25 | ✅ Current |
| VOICE_LIBRARY.md | 2026-01-19 | ✅ Current |
| REGULATORY_LANGUAGE_GUIDE.md | 2026-01-24 | ✅ Current |
| IOS_DEPLOYMENT.md | 2026-01-25 | ✅ Current |
| ANDROID_DEPLOYMENT.md | 2026-01-25 | ✅ Current |

### Historical Reference (Consolidated from Desktop — Session 30b)
| Doc | Purpose |
|-----|---------|
| SMART_COACH_DAY1.md | Smart Coach development log — Day 1 |
| SMART_COACH_DAY2.md | Smart Coach development log — Day 2 |
| SMART_COACH_DAY3.md | Smart Coach development log — Day 3 |
| SMART_COACH_DEPLOYMENT.md | Smart Coach deployment process |
| SMART_COACH_DEPLOYMENT_COMPLETE.md | Smart Coach deployment completion |
| SESSION_SUMMARY_SMART_COACH.md | Smart Coach session summary |
| PILOT_REPORT.md | Pilot study report |
| PILOT_VALIDATION.md | Pilot validation results |
| BABBLE_GENERATION_CORRECTED.md | Babble noise generation corrections |
| NOISE_GENERATION_ROADMAP.md | Noise asset generation plan |
| PRODUCTION_READY_GENERATION.md | Production audio generation specs |
| STORY_MODULE_STRATEGY.md | Story content module design |

### Needs Review
| Doc | Issue |
|-----|-------|
| GEMINI.md | References vanilla HTML (app is React) |
| ROADMAP.md | Multiple conflicting roadmaps exist |

---

## Quick Links

### Credentials & Secrets
- Supabase Dashboard: https://supabase.com/dashboard
- ElevenLabs: https://elevenlabs.io/app
- Vercel: https://vercel.com/dashboard

### Live App
- Production: https://soundsteps.app (also https://my-hearing-app.vercel.app)
- Supabase Project: (see .env for project ID)

---

## Terminology Quick Reference

> **IMPORTANT:** We use "training" language, NOT "clinical" language.
> See [REGULATORY_LANGUAGE_GUIDE.md](./REGULATORY_LANGUAGE_GUIDE.md)

| Avoid | Use Instead |
|-------|-------------|
| Clinical | Training, Practice |
| Assessment | Progress, Summary |
| Diagnosis | Focus area |
| Patient | User |
| Medical-grade | Professional, High-quality |

---

## Need Help?

1. **Can't find something?** Check STATUS.md first
2. **Audio questions?** See AUDIO_INVENTORY.md
3. **Voice questions?** See VOICE_LIBRARY.md
4. **Regulatory concerns?** See REGULATORY_LANGUAGE_GUIDE.md
5. **Architecture questions?** See rules/00_MASTER_RULES.md
