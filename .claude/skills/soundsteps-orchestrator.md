# SoundSteps Marketing Orchestrator Skill

Help decide what marketing task to work on next. Analyzes what exists, identifies gaps, and routes to the right skill.

## When to Activate

- "What should I work on next for marketing?"
- "I don't know where to start"
- "What's missing from our marketing funnel?"
- Starting a new marketing work session
- After completing a marketing task and wondering what's next

## How This Skill Works

1. **Assess current state** — check what files/assets exist
2. **Identify gaps** — compare against the full funnel checklist
3. **Recommend next action** — with specific skill to use
4. **Provide context** — why this task matters now

## Marketing Funnel Checklist

Check these files and assets to determine current state:

### Foundation (Phase 1)

- [ ] `docs/MARKETING_PLAN.md` — strategy document exists?
- [ ] `src/pages/PlacementAssessment.tsx` — lead magnet built?
- [ ] `.claude/skills/hearing-health-copy.md` — copywriting skill exists?
- [ ] `.claude/skills/soundsteps-positioning.md` — positioning skill exists?
- [ ] `.claude/skills/audiologist-outreach.md` — B2B skill exists?
- [ ] `.claude/skills/ci-community-voice.md` — community voice skill exists?
- [ ] `docs/MCP_SETUP.md` — MCP configuration documented?

### Research (Phase 2 Prerequisite)

- [ ] Competitive research completed? (check for research output files)
- [ ] Keyword research completed? (check for keyword data)
- [ ] Competitor screenshots captured? (check `/tmp/` or project assets)

### Landing Pages (Phase 2)

- [ ] CI Users landing page built?
- [ ] Audiologists landing page built?
- [ ] Family Members landing page built?
- [ ] Open Graph / Twitter Card meta tags added?
- [ ] Google Search Console configured?

### Email (Phase 2)

- [ ] Welcome email sequence written? (5 emails)
- [ ] Resend API configured?
- [ ] Email capture mechanism on landing pages?

### Content (Phase 3)

- [ ] Blog posts written? (target: 5)
- [ ] Remotion installed and configured?
- [ ] Video ads created? (3 format sizes)
- [ ] Static ad variants created?
- [ ] Programmatic SEO pages created? (target: 10-20)

### Distribution (Phase 4)

- [ ] Audiologist outreach started?
- [ ] CI manufacturer partnerships explored?
- [ ] Community engagement plan?

## Decision Logic

When asked "what's next?", follow this priority order:

### Priority 1: Foundation Gaps

If any Foundation items are missing → fix those first.
- Missing copy skill? → "Create `hearing-health-copy.md` — you need this before writing any marketing copy."
- Missing positioning? → "Create `soundsteps-positioning.md` — this drives all landing page and ad work."

### Priority 2: Research Before Building

If Foundation is complete but Research is not → do research.
- "Before building landing pages, run competitive research with Perplexity MCP. Use: `soundsteps-positioning.md` skill to synthesize findings."
- "Use Playwright MCP to screenshot competitor sites (LACE, Angel Sound, AB Clix). Analyze with front-end design skill."

### Priority 3: Landing Pages

If Research is done but Landing Pages are not → build pages.
- "Start with the CI Users landing page — it targets our primary ICP and highest-volume keywords."
- "Use `soundsteps-positioning.md` for angles, `hearing-health-copy.md` for copy, Anthropic's front-end design skill for layout."

### Priority 4: Email Sequence

If Landing Pages exist but Email is not → set up email.
- "Write the 5-email welcome sequence. Use `hearing-health-copy.md` skill for copy."
- "Set up Resend integration for email delivery."

### Priority 5: Content + Traffic

If Email is set up but Content is lacking → create content.
- "Write the first blog post: 'What is the Erber Model?' Use `hearing-health-copy.md` for regulatory-safe copy."
- "Set up Remotion and create a 15-second app demo video in 3 formats."

### Priority 6: Distribution

If Content exists → focus on distribution.
- "Draft audiologist outreach email using `audiologist-outreach.md` skill."
- "Write 3 social media posts for CI communities using `ci-community-voice.md` skill."

## Skill Routing Table

| Task | Primary Skill | Supporting Skill | MCP |
|------|--------------|-----------------|-----|
| Landing page copy | `hearing-health-copy.md` | `soundsteps-positioning.md` | — |
| Landing page design | Anthropic front-end design | `soundsteps-positioning.md` | Playwright |
| Competitive research | — | `soundsteps-positioning.md` | Perplexity |
| Competitor analysis | — | — | Playwright, Firecrawl |
| Ad headlines | `hearing-health-copy.md` | `soundsteps-positioning.md` | — |
| Video ads | — | `hearing-health-copy.md` | Remotion |
| Image ads | — | `hearing-health-copy.md` | Glyph |
| Blog posts | `hearing-health-copy.md` | `ci-community-voice.md` | — |
| Audiologist emails | `audiologist-outreach.md` | `hearing-health-copy.md` | — |
| Community posts | `ci-community-voice.md` | `hearing-health-copy.md` | — |
| Email sequence | `hearing-health-copy.md` | — | — |
| SEO pages | `hearing-health-copy.md` | `soundsteps-positioning.md` | Perplexity |
| Keyword research | — | `soundsteps-positioning.md` | Perplexity |

## Output Format

When recommending next steps, always provide:

```
## What's Next

**Current state:** [What exists]
**Gap identified:** [What's missing]
**Recommended task:** [Specific action]
**Skill to use:** [Which skill file]
**MCP needed:** [If any]
**Estimated effort:** [Time ballpark]
**Why now:** [Why this is the highest priority]
```

## Reference Documents

- `docs/MARKETING_PLAN.md` — full strategy and implementation phases
- `docs/REGULATORY_LANGUAGE_GUIDE.md` — prohibited/allowed terms
- `docs/MCP_SETUP.md` — MCP configuration
- `core_docs/3_BRAND_STRATEGY.md` — brand identity and growth loops
- `core_docs/4_DESIGN_SYSTEM.md` — Aura design tokens
- `docs/STYLE_GUIDE.md` — UI design guidelines
