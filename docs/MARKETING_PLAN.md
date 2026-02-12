# SoundSteps Marketing Plan

> **Status:** Phase 1 (Placement Assessment) — built, pending deploy
> **Last updated:** 2026-02-11
> **Source:** Greg Isenberg + James Dickerson "AI Marketing Masterclass" video analysis + SoundSteps brand strategy

---

## 0. Video Analysis: Key Takeaways

Source: [AI Marketing Masterclass: From beginner to expert in 60 minutes](https://www.youtube.com/watch?v=fVUlrpaWNxg) — Greg Isenberg + James Dickerson (The Boring Marketer)

### Core Thesis

Use Claude Code + MCPs + Skills to build a complete marketing funnel in one sitting — research, positioning, landing pages, lead magnets, ad creative, SEO content, email sequences. The "vibe marketing" approach mirrors vibe coding: iterate fast, use AI agents, ship same day.

### The Framework (3 Layers)

1. **Research** — Perplexity MCP, Firecrawl MCP, Playwright MCP (understand market, competitors, gaps)
2. **Skills** — Codified expertise as markdown instruction files (positioning, copy, lead magnets, ads, SEO)
3. **Build** — Execute in Claude Code, deploy same day

### Tools & Methods from the Video

| Strategy | Tool/Method | What It Does | SoundSteps Applicability |
|----------|-------------|-------------|--------------------------|
| Deep research before creating | **Perplexity MCP** | Competitive landscape, gaps, positioning angles | High — research hearing training competitors |
| Competitive analysis | **Playwright MCP** | Open competitor sites, take screenshots, analyze design | High — analyze LACE, Angel Sound, AB Clix |
| Website scraping | **Firecrawl MCP** | Extract copy, data, structure from competitor sites | Medium — understand competitor messaging |
| Positioning frameworks | Custom "Skills" (markdown) | Generate unique angles based on market research | High — 3 audience segments |
| Direct response copy | Copywriting skill | Landing page copy trained on classic DR principles | High — landing page generation |
| Anti-AI design | Anthropic's front-end design skill | Prevents purple gradients, emoji, "vibe coded" look | High — matches Aura design system |
| Lead magnets | Lead magnet skill | Interactive tools (audits, calculators) > static PDFs | **DONE** — Placement Assessment IS the lead magnet |
| Video ads | **Remotion** (free, open source) | Create branded video ads from the terminal | High — app demo videos |
| Image ads | Glyph MCP + Nano Banana Pro | AI-generated statics for ad campaigns | Medium — social media assets |
| SEO at scale | Keyword research + content skill | Programmatic pages targeting specific search terms | High — long-tail hearing keywords |
| Decision-making | Orchestrator skill | Guides you through "what to do next" | High — built as `soundsteps-orchestrator.md` |
| Multiple landing pages | One positioning framework, many variants | Different pages for different audience segments | High — CI users, audiologists, families |

### Key Insights Applied to SoundSteps

1. **Interactive > Static:** The video's strongest insight. We replaced a static onboarding with 10 real exercises as the lead magnet (Placement Assessment).
2. **Research first, create second:** Always run Perplexity/Firecrawl research BEFORE writing copy or building pages.
3. **One positioning framework → many pages:** Create audience-specific landing pages from a single positioning skill.
4. **Skills are underrated:** Codify expert knowledge (regulatory language, clinical framing, founder story) into reusable skills.
5. **Anti-AI design skill:** Critical for SoundSteps — must look medical-grade, not vibe-coded.

---

## 1. Funnel Architecture

```
Landing Pages (SSR, future)     SEO magnets + social proof — NOT barriers
        ↓
   App Sign-Up                  Email + password via Supabase Auth
        ↓
  Placement Assessment          10-trial "Listening Check" — the lead magnet
        ↓
    Daily Practice              Personalized Erber-level plan (useTodaysPractice)
        ↓
      Upgrade                   Standard $9.99/mo → Premium $19.99/mo
```

### Key Principle: Landing Pages Are Top-of-Funnel, Not Barriers

Landing pages are **separate SSR pages** (Astro recommended) that rank in search, explain SoundSteps, and funnel visitors to the app. They are NOT gating mechanisms within the app. The app's entry point is WelcomeScreen → Placement Assessment.

Current SPA cannot do SSR — landing pages require a separate deployment. This is Phase 2.

---

## 2. The Placement Assessment IS the Lead Magnet

Following the video's principle that **interactive tools convert better than PDFs/static content:**

1. **Interactive, not passive** — 10 real listening exercises across all 4 Erber levels
2. **Instant personalized results** — score breakdown by level + recommended starting point
3. **Teaches the Erber model** — interstitial cards explain Detection → Discrimination → Identification → Comprehension
4. **Logs real progress data** — placement trials feed into analytics from day one
5. **~3 minutes** — fast enough to complete in one sitting, substantial enough to feel valuable

### Why This Works

- **Low friction:** No paywall, no credit card — just sign up and listen
- **Immediate value:** Users learn their current listening level in 3 minutes
- **Creates investment:** Having personalized data makes the app feel "theirs"
- **Natural upgrade path:** Users see all 4 levels, but Free only unlocks the first two

### Implementation Status

- [x] Built `/placement` route with 10-trial Listening Check
- [x] Wired into WelcomeScreen → Placement → Daily Practice flow
- [x] Logs to `user_progress` with `activityType: 'placement'`
- [x] `useTodaysPractice` reads placement level for cold-start personalization
- [ ] Deploy to production

---

## 3. Audience-Specific Landing Pages (Phase 2)

Three distinct audiences, each getting a dedicated landing page built from the `soundsteps-positioning.md` skill:

### Page 1: CI Users

- **URL:** `soundsteps.app/cochlear-implant-training`
- **Headline concept:** "Your cochlear implant gave you sound. SoundSteps helps you understand it."
- **Focus:** Daily practice, structured Erber progression, 9-voice roster, progress tracking
- **CTA:** "Take the free Listening Check" → app sign-up → `/placement`
- **Keywords:** cochlear implant training app, CI listening exercises, auditory training cochlear implant

### Page 2: Audiologists

- **URL:** `soundsteps.app/for-audiologists`
- **Headline concept:** "The at-home training tool your patients will actually use."
- **Focus:** Evidence-informed Erber model, progress reports, CSV export, structured pathways
- **CTA:** "Try it yourself" → demo account → see patient-facing features
- **Keywords:** auditory training tool for audiologists, hearing rehabilitation app, patient engagement

### Page 3: Family Members

- **URL:** `soundsteps.app/help-them-hear`
- **Headline concept:** "Help them hear your voice again."
- **Focus:** Emotional hook, how family can support training, daily practice habit
- **CTA:** "Set them up in 2 minutes" → gift subscription concept (future)
- **Keywords:** cochlear implant exercises at home, hearing aid training for seniors, help with hearing loss

### Technical Approach

- **Framework:** Astro (static SSR, cheap hosting, great SEO)
- **Design:** Use Anthropic's front-end design skill + Aura tokens (teal, dark slate, Inter font)
- **Deployment:** Separate Vercel project or subdomain
- **Analytics:** Plausible or PostHog (privacy-first, no cookie banner needed)

---

## 4. SEO Strategy

### Primary Keywords (Condition-Specific)

| Keyword Cluster | Monthly Volume (est.) | Competition | Target Page |
|---|---|---|---|
| cochlear implant training app | 500-1K | Low | CI Users page |
| cochlear implant listening exercises | 200-500 | Low | CI Users page |
| hearing aid training exercises | 1K-2K | Low-Med | CI Users page |
| auditory training app | 1K-2K | Medium | CI Users page |
| hearing rehabilitation exercises | 500-1K | Low | Blog |
| auditory training for audiologists | 200-500 | Low | Audiologists page |

### Secondary Keywords (Intent-Based)

- "how to improve hearing with cochlear implant"
- "hearing aid adjustment exercises"
- "listening practice for hearing loss"
- "auditory processing exercises adults"
- "cochlear implant rehabilitation at home"

### Programmatic SEO Opportunity

Following the video's pattern of creating many targeted pages:
- Per-keyword landing pages (10-20 long-tail pages)
- Each uses `soundsteps-positioning.md` skill + `hearing-health-copy.md` skill
- Schema.org markup for health/wellness
- Internal links to related pages

### Technical SEO Notes

- Current SPA has no SSR — landing pages MUST be SSR
- App routes stay as SPA — no SEO needed for `/practice/*`, `/placement`
- Canonical URL strategy: `soundsteps.app/cochlear-implant-training` → landing, `app.soundsteps.app/` → SPA

---

## 5. Content Marketing

### Blog Posts (Phase 2-3)

1. **"What is the Erber Model? A Guide to Hearing Training Levels"** — educational, links to placement
2. **"5 Daily Listening Exercises for Cochlear Implant Users"** — practical, links to app
3. **"How Speech-in-Noise Training Works"** — explains SNR mixing, links to Word Pairs
4. **"Choosing the Right Voice for Hearing Practice"** — highlights 9-voice roster
5. **"Understanding Your Hearing Training Progress"** — explains analytics dashboard

### Short-Form Video via Remotion (Phase 3)

Following the video's Remotion workflow:
- **Tool:** Remotion (free, open source, React-based video generation from terminal)
- **Setup:** GitHub repo with prompts, installed via Claude Code
- **Formats:** 15-30 second app demos in story (9:16), square (1:1), landscape (16:9)
- **Content ideas:**
  - "Watch me take the SoundSteps Listening Check" — screen recording style
  - "3 minutes to find your hearing training level" — results-focused
  - "What your audiologist wishes you'd do at home" — educational hook
- **Brand style:** Dark bg (slate-950), teal accents, Inter font — matches Aura
- **Channels:** YouTube Shorts, TikTok, Instagram Reels
- **Cost:** $0 (Remotion is free for self-hosted)

### Image Ads (Phase 3)

- **Tool:** Glyph MCP + Nano Banana Pro (AI-generated statics)
- **Workflow:** Create image prompts in Claude Code → Glyph MCP → variations
- **DTC ad framework** adapted for wellness (not ecom): focus on transformation, not before/after
- **Regulatory guard:** All ad copy must pass `hearing-health-copy.md` skill review

---

## 6. Pricing Strategy

### Free Tier

- **Activities:** Sound Detection, Word Basics (Gross Discrimination)
- **Erber Levels:** Detection + Discrimination
- **Analytics:** Basic progress (accuracy, streak)
- **Voices:** All 9 voices
- **Placement Assessment:** Full access (this IS the lead magnet)

### Standard — $9.99/month

- Everything in Free, plus:
- **Activities:** Word Pairs (RapidFire), Word Categories, Sentences, Stories
- **Erber Levels:** All 4 (Detection through Comprehension)
- **Analytics:** Full Insights dashboard, phoneme mastery grid, training journey
- **Export:** CSV data export

### Premium — $19.99/month

- Everything in Standard, plus:
- **Activities:** Everyday Scenarios (multi-speaker dialogue with background noise)
- **Analytics:** Print-to-PDF reports, weekly email digest (Phase D)
- **Priority:** Early access to new features

### Pricing Rationale

- Free tier generous enough to be useful — keeps users engaged while evaluating
- Standard unlocks the core training loop — Identification + Comprehension drive real progress
- Premium for power users and audiologist-recommended patients
- Price points align with wellness apps (Headspace $12.99, Calm $14.99)

---

## 7. Regulatory Guardrails

### Language Rules (CRITICAL)

| Context | DO NOT USE | USE INSTEAD |
|---|---|---|
| Placement | "Hearing Test" | "Listening Check" |
| Results | "Diagnosis" | "Starting Level" |
| Recommendation | "Prescription" | "Recommendation" |
| Progress | "Clinical Report" | "Progress Report" |
| Marketing | "Therapy" | "Training" |
| Marketing | "Treatment" | "Practice" |
| Marketing | "Rehabilitate" | "Improve" |

### Disclaimers

> SoundSteps is designed for listening training and practice. It is not intended to diagnose, treat, cure, or prevent any medical condition. Consult a healthcare professional for hearing health advice.

See: `docs/REGULATORY_LANGUAGE_GUIDE.md` for comprehensive reference.

---

## 8. Claude Code Marketing Skills

Five skills built for SoundSteps marketing workflows. Located in `.claude/skills/`.

| Skill | File | Purpose |
|-------|------|---------|
| Hearing Health Copy | `hearing-health-copy.md` | Regulatory-safe copywriting with prohibited/allowed terms baked in |
| Audiologist Outreach | `audiologist-outreach.md` | B2B messaging for audiologists — evidence-informed framing |
| CI Community Voice | `ci-community-voice.md` | Authentic first-person CI user perspective (Bruce's story) |
| SoundSteps Positioning | `soundsteps-positioning.md` | Core positioning, ICP definitions, competitive landscape, angles |
| SoundSteps Orchestrator | `soundsteps-orchestrator.md` | "What should I work on next?" — routes to other skills |

### How to Use Skills

```bash
# In Claude Code, invoke a skill directly:
/hearing-health-copy "Write a landing page headline for cochlear implant users"

# Or reference in a prompt:
"Use the soundsteps-positioning skill to generate 3 headline variants for the CI Users landing page"

# Orchestrator helps when you're stuck:
/soundsteps-orchestrator "I have a landing page but no traffic strategy. What's next?"
```

### MCP Setup

See: `docs/MCP_SETUP.md` for Perplexity, Playwright, and Firecrawl configuration.

---

## 9. Competitive Landscape

### Known Competitors (Research with Perplexity MCP before Phase 2)

| Competitor | Type | Strengths | Gaps |
|---|---|---|---|
| LACE (Neurotone) | Desktop app | Established, audiologist-recommended | Dated UI, no mobile, expensive |
| Angel Sound | Free web app | Free, research-backed | Minimal UX, no progress tracking |
| AB Clix | Mobile app | Cochlear-specific | Limited to AB users |
| HearBuilder | Web app | School-focused | Not CI/adult focused |
| SoundSteps | Web + PWA | Modern UI, 9 voices, Erber model, BT hearing aid support, analytics | New, no brand awareness yet |

### Competitive Research Tasks (Phase 2)

1. Use Perplexity MCP: "Who are the current hearing training apps? What keywords do they rank for?"
2. Use Playwright MCP: Screenshot competitor sites, analyze design and messaging
3. Use Firecrawl MCP: Extract copy and structure from competitor landing pages
4. Synthesize gaps → feed into `soundsteps-positioning.md` skill

---

## 10. Email Strategy

### Welcome Sequence (Phase 2 — ties into Sprint 3 Phase D)

5 emails over 2 weeks after sign-up:

1. **Day 0:** "Welcome to SoundSteps" — what to expect, link back to Placement results
2. **Day 1:** "Your first week plan" — explain Daily Practice feature, set expectations
3. **Day 3:** "How to read your progress" — introduce Progress Report, encourage daily habit
4. **Day 7:** "Your first week in review" — celebrate streak, show improvement
5. **Day 14:** "Ready for the next level?" — soft upgrade prompt for Standard tier

### Weekly Digest (Sprint 3 Phase D — planned)

- Supabase Edge Function + Resend + pg_cron (Monday 8am UTC)
- Educational + motivational framing: "Practice Summary" not "Progress Report"
- Rotating "Listening Tips"
- Needs: Resend API key, Edge Function deploy, `email_weekly_digest` column on profiles

---

## 11. Implementation Phases

### Phase 1: Foundation (NOW — DONE)

- [x] Placement Assessment (`/placement`) — 10-trial Listening Check
- [x] WelcomeScreen → Placement → Daily Practice flow
- [x] Progress logging with `activityType: 'placement'`
- [x] `useTodaysPractice` reads placement level
- [x] Marketing skills built (5 skills in `.claude/skills/`)
- [x] MCP setup documented (`docs/MCP_SETUP.md`)
- [ ] Deploy to production

### Phase 2: Landing Pages + Email (NEXT)

- [ ] Install Perplexity, Playwright, Firecrawl MCPs
- [ ] Run competitive research (Perplexity + Playwright)
- [ ] Feed research into `soundsteps-positioning.md` skill
- [ ] Build 3 audience-specific landing pages (Astro + Vercel)
- [ ] Set up email capture → Resend
- [ ] Build 5-email welcome sequence
- [ ] Google Search Console + sitemaps
- [ ] Open Graph / Twitter Card meta tags

### Phase 3: Content + Video + Ads

- [ ] Write 5 blog posts (SEO content skill)
- [ ] Set up Remotion for video ad generation
- [ ] Create "Take the Listening Check" video (3 format sizes)
- [ ] Create static ad variants (Glyph MCP + Nano Banana Pro)
- [ ] 10-20 programmatic SEO pages targeting long-tail keywords
- [ ] Launch test campaign on Meta (small budget)

### Phase 4: Partnerships + Distribution

- [ ] Audiologist outreach (use `audiologist-outreach.md` skill)
- [ ] CI manufacturer partnerships (Cochlear, MED-EL, AB)
- [ ] Hearing aid dispenser education
- [ ] Insurance/HSA eligibility research

---

## 12. Growth Loops (DEFERRED)

> **These ideas surfaced from the marketing strategy review but have NOT been validated against privacy, regulatory, and product scope decisions from earlier sessions. Do NOT build until explicitly revisited.**

### Spouse Loop (Voice Recording)

- **Concept:** Users record a familiar voice (spouse, child) for personalized training
- **Concerns:** Audio storage privacy, consent, recording quality, storage costs
- **Status:** Needs product + legal review

### Prescription Pad (Audiologist Referral)

- **Concept:** Audiologists "prescribe" SoundSteps with a unique link/code
- **Concerns:** Medical device implications, affiliate compliance, HIPAA adjacency
- **Status:** Needs regulatory review

### Social Proof Loop (Share Results)

- **Concept:** Users share placement results or progress milestones on social media
- **Concerns:** Health data sharing norms, screenshot design, privacy defaults
- **Status:** Needs UX research

---

## 13. Metrics to Track

### Acquisition

- Landing page → sign-up conversion rate
- Placement assessment completion rate (target: >80%)
- Time to complete placement (~3 minutes target)

### Activation

- Placement → first daily practice session (target: >60% same day)
- Day 1 → Day 7 retention (target: >40%)

### Revenue

- Free → Standard conversion rate (target: >5% at 30 days)
- Standard → Premium upgrade rate
- Monthly churn rate (target: <8%)

### Engagement

- DAU/MAU ratio
- Average sessions per week
- Streak distribution (1-day, 7-day, 30-day)

---

## 14. What's NOT Applicable from the Video

- **DTC ecom ad frameworks** — SoundSteps isn't selling physical products; DTC hooks ("before/after") risk regulatory issues
- **Agency positioning** — Not relevant to SoundSteps' B2C/B2B2C model
- **Firecrawl for lead scraping** — Not appropriate for health/medical audience
- **UGC AI video ads** — Not mature enough; also regulatory risk with health claims

---

*This document is the single source of truth for SoundSteps marketing strategy. Update it as decisions are made and phases are completed.*
