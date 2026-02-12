# MCP Setup Guide for SoundSteps Marketing

> **Purpose:** Configure the 3 core MCPs used in the SoundSteps marketing workflow
> **Source:** Greg Isenberg + James Dickerson "AI Marketing Masterclass" tool stack
> **Last updated:** 2026-02-11

---

## Overview

The SoundSteps marketing workflow uses 3 MCPs (Model Context Protocol servers) for research, competitive analysis, and website scraping. These feed data into the marketing skills (`.claude/skills/`) for content generation.

```
Perplexity MCP  →  Market research, keyword data, competitive landscape
Playwright MCP  →  Screenshot competitors, analyze design, browse web
Firecrawl MCP   →  Scrape competitor copy, extract website structure
        ↓
  Marketing Skills  →  Generate positioning, copy, landing pages, ads
        ↓
     Deploy         →  Ship to Vercel
```

---

## 1. Perplexity MCP

### What It Does

Deep web research from within Claude Code. Finds competitive landscape, market gaps, keyword opportunities, and positioning angles. Use before creating any marketing content.

### Setup

1. Get a Perplexity API key from [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)

2. Add to Claude Code MCP config (`~/.claude/settings.local.json` or project `.claude/settings.local.json`):

```json
{
  "mcpServers": {
    "perplexity": {
      "command": "npx",
      "args": ["-y", "@anthropic/perplexity-mcp"],
      "env": {
        "PERPLEXITY_API_KEY": "pplx-xxxxxxxxxxxx"
      }
    }
  }
}
```

### Usage Examples

```
# Competitive research
"Use the Perplexity MCP to research who the main hearing training apps are,
what keywords they rank for, and where the gaps are in the market."

# Keyword research
"Use Perplexity to find long-tail keywords for cochlear implant training
with estimated monthly search volume."

# Market sizing
"Use Perplexity to research how many cochlear implant activations happen
per year in the US and what the home training market looks like."
```

### Tips

- Spend 30-60 minutes on research BEFORE creating any copy or landing pages
- Save research output to a file for context: "Save this research to `/tmp/competitive_research.md`"
- Run in a split terminal — research in one window, building in another
- Research fills context quickly; keeping it separate preserves your working context

---

## 2. Playwright MCP

### What It Does

Browser automation from Claude Code. Opens websites, takes screenshots, clicks through pages, extracts visible content. Free and open source.

### Setup

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic/playwright-mcp"]
    }
  }
}
```

No API key needed. Playwright runs locally.

### Usage Examples

```
# Competitor screenshots
"Use the Playwright MCP to open lfrp.com (LACE) and take screenshots of
their homepage, pricing page, and signup flow."

# Design inspiration
"Use Playwright to screenshot 3 hearing health app websites.
Analyze their design patterns, copy structure, and CTAs."

# Landing page review
"Use Playwright to open our deployed landing page at soundsteps.app
and take a screenshot. Compare it to the Aura design system spec."

# Self-review
"Use Playwright to open localhost:5173/placement and verify the
Listening Check page renders correctly."
```

### Tips

- Screenshots go to Claude Code's working directory by default
- Combine with the Anthropic front-end design skill for design analysis
- Use for self-review: screenshot your own pages to catch visual issues
- Great for competitive analysis: "Analyze this competitor's messaging hierarchy"

---

## 3. Firecrawl MCP

### What It Does

Web scraping and data extraction. Extracts copy, structure, and data from competitor websites. Can crawl multiple pages and compile findings.

### Setup

1. Get a Firecrawl API key from [firecrawl.dev](https://www.firecrawl.dev/)

2. Add to MCP config:

```json
{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "@anthropic/firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "fc-xxxxxxxxxxxx"
      }
    }
  }
}
```

### Usage Examples

```
# Extract competitor copy
"Use Firecrawl to scrape the copy from angelsound.com. Extract their
headline, value propositions, pricing, and CTAs."

# Bulk research
"Use Firecrawl Agent to find all Facebook pages for cochlear implant
support groups and compile them into a document."

# Content extraction
"Use Firecrawl to extract the text content from the top 5 Google results
for 'cochlear implant training exercises' — I want to see what's ranking."
```

### Tips

- Firecrawl has a free tier — sufficient for initial research
- Firecrawl Agent (newer) can do multi-step research tasks autonomously
- Use for extracting competitor copy BEFORE writing your own — ensures differentiation
- Respect robots.txt and rate limits

---

## Combined MCP Config

Here's a complete `settings.local.json` with all 3 MCPs:

```json
{
  "mcpServers": {
    "perplexity": {
      "command": "npx",
      "args": ["-y", "@anthropic/perplexity-mcp"],
      "env": {
        "PERPLEXITY_API_KEY": "pplx-xxxxxxxxxxxx"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic/playwright-mcp"]
    },
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "@anthropic/firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "fc-xxxxxxxxxxxx"
      }
    }
  }
}
```

**Note:** Replace `pplx-xxxxxxxxxxxx` and `fc-xxxxxxxxxxxx` with your actual API keys. Never commit API keys to git.

---

## Additional MCPs (Phase 3)

These MCPs are mentioned in the Isenberg video for ad creation. Set up when ready for Phase 3:

### Glyph MCP (Image Generation)

For creating static ad images via Nano Banana Pro.

```json
{
  "glyph": {
    "command": "npx",
    "args": ["-y", "@glyph/mcp"],
    "env": {
      "GLYPH_API_KEY": "glyph-xxxxxxxxxxxx"
    }
  }
}
```

### Remotion (Video Ads)

Remotion is NOT an MCP — it's a React-based video framework installed as a project dependency.

```bash
# Install Remotion (from the SoundSteps project root or a separate marketing project)
npx create-video@latest soundsteps-ads

# Or clone the Remotion team's GitHub template for Claude Code:
# (Check Remotion's X/Twitter for the latest template link)
```

Remotion creates videos programmatically using React components. Render from the terminal:
```bash
npx remotion render src/ads/ListeningCheck.tsx out/listening-check-story.mp4 --width=1080 --height=1920
npx remotion render src/ads/ListeningCheck.tsx out/listening-check-square.mp4 --width=1080 --height=1080
npx remotion render src/ads/ListeningCheck.tsx out/listening-check-landscape.mp4 --width=1920 --height=1080
```

---

## Workflow: Research → Skills → Build

The standard marketing session follows this sequence:

```
1. Open split terminal (research | build)

2. Research window:
   "Use Perplexity MCP to research [topic]"
   "Use Playwright MCP to screenshot [competitor]"
   "Use Firecrawl to extract copy from [site]"
   → Save research to /tmp/research_[topic].md

3. Build window:
   "Read /tmp/research_[topic].md for context"
   "Use the soundsteps-positioning skill to generate 3 headline variants"
   "Use the hearing-health-copy skill to write landing page copy"
   "Use the Anthropic front-end design skill to build the page"

4. Review:
   "Use Playwright to screenshot the result"
   "Compare against Aura design tokens"
   "Check copy against hearing-health-copy regulatory rules"

5. Deploy:
   "npm run build && npx vercel --prod"
```

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| MCP not found | Run `npx -y @anthropic/[mcp-name]` manually first to install |
| Perplexity rate limit | Free tier has limits; upgrade or space out requests |
| Playwright fails to launch | May need `npx playwright install` to install browser binaries |
| Firecrawl blocked by site | Some sites block scrapers; use Playwright screenshot instead |
| Context window fills up | Run research in a separate Claude Code terminal |

---

## References

- [Claude Code MCP documentation](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Perplexity API docs](https://docs.perplexity.ai/)
- [Playwright MCP GitHub](https://github.com/anthropics/playwright-mcp)
- [Firecrawl docs](https://docs.firecrawl.dev/)
- [Remotion docs](https://www.remotion.dev/docs)
- Marketing skills: `.claude/skills/hearing-health-copy.md`, `soundsteps-positioning.md`, etc.
