# Insights: Greg Isenberg & Sariah — "Stop Shipping AI Slop"

> **Source:** [YouTube — Greg Isenberg](https://www.youtube.com/watch?v=9OnN4O4uapI)
> **Duration:** 54 minutes
> **Guest:** Sariah (designer, sold last company to Snap)
> **Compiled:** 2026-02-06

---

## What This Video Is

A live tutorial where Greg and Sariah build a voice journaling app ("Cassette") from AI-generated prototype to polished, branded design. The core argument: **anyone can vibe-code an app now, so the only differentiator is design and branding.** They demo a complete workflow: Google AI Studio -> Claude -> Cosmos -> Weavy AI -> Figma -> back to Google AI Studio.

---

## The Core Problem

> "If the app store was just invented, [the AI-generated default] wouldn't be that bad. But now that we're so used to software, if we were to see this on Instagram or TikTok, we would not download it."

- AI tools (Google AI Studio, Claude Code, Lovable) can one-shot a functional app in minutes
- But the results all look the same — generic, flat, interchangeable
- If your app looks like every other AI-generated app, nobody downloads it
- **The functional layer is a solved problem. The emotional/brand layer is the competitive advantage.**

---

## The Design Process (Step by Step)

### Step 1: One-Shot the Functional Prototype

**Tool:** Google AI Studio (for prototypes) or Claude Code (for existing codebases)

- Use a basic prompt to get the functional skeleton built
- Don't worry about design at this stage
- Just capture what the app needs to *do*: record audio, show history, timer, etc.
- Google AI Studio is best for one-shot prototypes from scratch
- Claude Code is best for working within an existing codebase
- Gemini model in Cursor is good for UI, shaders, and complex animations

### Step 2: Define How It Should Feel (Not What It Does)

> "Most people stop here. Vibe coding focuses on what does the thing do. But that's not what a product is. You don't think of your favorite products and think 'oh, it does this.' You think 'it makes my life easier and I feel so good using it.'"

**Tool:** Claude (as brainstorming partner)

- Write out WHO the user is and WHY they'd use it
- Define the emotional target: calm? energized? professional? playful?
- Equally important: define what it is NOT (not a productivity tool, not social, not needy)
- Use Claude to brainstorm and refine — paste your feelings/intuitions and have Claude expand on them
- **Use movies and TV shows as reference** — think beginning/middle/end of the user journey

**Key prompt pattern:** "I'm designing [X]. Here's who it's for and how they feel. Help me define the emotional brand."

**How to develop this instinct:**
- Build for yourself — you naturally know how you feel and want to feel
- If building for others, imagine that specific person: "I want this girl to feel calm. Therefore it can't have 75 timers."
- Work backwards from the feeling to the design constraints

### Step 3: Create Brand Guidelines via Claude

> "Brand guidelines are really just a prompt in and of itself — and it's a prompt we're going to bring into Weavy."

**Tool:** Claude

- Ask Claude to write brand guidelines based on the emotional definition
- Don't overthink it — pull out the lines you like, discard the rest
- Keep iterating until something resonates
- Extract highly visual keywords (e.g., "analog warmth", "satisfying click of a record button")

**Key insight:** Brand guidelines aren't corporate jargon. If branding is successful, you won't notice it in the final app — it'll just feel good.

### Step 4: Build a Mood Board

**Tool:** Cosmos (Pinterest alternative, preferred for visual discovery)

- Search for visual references that match your emotional keywords
- Save everything that resonates to a mood board
- Keep going until you stop — immerse yourself in the visual world
- The mood board bridges the gap between words (Claude output) and visuals (Weavy input)

**Critical tip:** Sometimes you find ONE image you love, and the entire product comes from that single image. Sariah's last startup was built from one image. Johnny Ive did this with Dieter Rams for Apple.

### Step 5: Generate Visual Assets in Weavy AI

**Tool:** Weavy AI ($0-15/month), using Flux 2 Pro and Ideogram V3

**Process:**
1. Import mood board images into Weavy as input references
2. Use Claude to write prompts, then paste prompts into Weavy
3. Generate multiple variations — run the same prompt with different inputs
4. Build up assets layer by layer: colors -> backgrounds -> buttons -> images -> logo

**Color palette:**
- Feed a mood board image into Flux 2 Pro
- Prompt: "Extract colors from this reference image" or "Give me a color palette based on this image, but make it textured and vintage"
- Run multiple variations — developing taste IS the process

**Buttons and UI elements:**
- Use mood board images + color palettes as combined inputs
- Prompt: "Generate a record button inspired by this cassette recorder. Analog button from the 80s. Use this color palette."
- Product design is easier than character consistency — you just need colors, shadows, and lighting to match (not faces)

**Logos:**
- Switch to Ideogram V3 (best for typography)
- Have Claude write multiple logo prompt variations (wordmark, handwritten, tape label, minimal)
- Use NEGATIVE prompts: "not 3D render, not glossy, not gradient, not corporate, not minimal"
- AI is ruining gradients — explicitly exclude them

**Background removal:**
- Weavy has built-in background removal — just type "background remove" on any result
- Use this constantly to extract assets for compositing

**Key workflow pattern:** Constantly switch between Claude (for prompts) and Weavy (for generation). If Weavy output isn't right, ask Claude for a better prompt. If Claude's prompts aren't visual enough, feed Weavy output back to Claude.

### Step 6: Compose in Figma

**Tool:** Figma

- Create iPhone frames, paste in generated assets
- Use Figma community for iOS components (status bars, etc.)
- Compositing tip: use Appearance -> Blend Mode -> "Overlay" or "Hard Light" on text to auto-match colors to background
- Keep typography simple and consistent for mobile
- This step is about assembling your generated pieces into a coherent screen layout
- The Figma comp becomes your "north star" for the final build

### Step 7: Feed Back to AI Studio for Implementation

**Tool:** Google AI Studio (or Claude Code)

- Paste Figma screenshots + individual assets + logo into the AI coding tool
- Prompt it to build the interface based on your composed design
- Result is dramatically better than the generic one-shot from Step 1
- Can still iterate from here — "our prompt was so short, if you spent one more minute it would be even better"

---

## Key Principles

### 1. Separate "What" from "How"
- What it does = outsource to AI (it's a solved problem)
- How it feels = keep in your own brain (this is what makes it distinct)
- "If you're outsourcing all the thinking, it makes sense everything looks the same"

### 2. Start with Emotion, Work Backwards to Design
- Define the feeling first
- Every design decision gets checked against: "does this match how we want the user to feel?"
- Colors, shapes, metaphors, interactions all flow from the emotional target

### 3. Find Your Visual Anchor
- One image, one metaphor, one concept that becomes the foundation
- For Cassette: the analog cassette tape metaphor drove everything — colors, textures, history UI, aging concept
- "Sometimes I find one image I like and make a whole company based off that image"

### 4. Brand Elements Need Purpose
- Don't use analog/vintage/retro just to be pretty
- Their concept: the app interface "ages" with use (like a real cassette tape) — new users get a pristine interface, heavy users get a worn, loved one
- "If you overuse analog things digitally with no purpose, it feels gimmicky"

### 5. Messiness Is the Process
- Weavy boards are meant to be messy — lots of experiments everywhere
- Run multiple models, multiple prompts, multiple color palettes
- Developing taste = seeing lots of options and reacting to them
- "Part of this is developing your own taste in general and in the product you're making"

### 6. The Figma Step Is Optional
- You could skip Figma and paste everything directly into Google AI Studio
- Figma gives you a north star and more control
- Trade-off: less back-and-forth with AI vs. more manual composition
- "Pick your poison based on your level of comfort"

---

## Tool Stack Summary

| Tool | Use Case | When |
|------|----------|------|
| **Google AI Studio** | One-shot prototypes, shaders, animations | Start (prototype) and end (implementation) |
| **Claude / Claude Code** | Brainstorming, brand guidelines, prompt writing, existing codebases | Throughout — the thinking partner |
| **Cosmos** | Mood boards, visual discovery | Early — gathering inspiration |
| **Weavy AI** | Image generation, asset creation, background removal | Middle — generating all visual assets |
| **Flux 2 Pro** (in Weavy) | General image generation, color palettes, UI elements | Most visual generation tasks |
| **Ideogram V3** (in Weavy) | Logos, typography | Logo creation specifically |
| **Figma** | Screen composition, asset assembly | Near end — compositing the final screens |
| **Cursor + Gemini** | UI work, shaders, iOS code in existing codebases | Day-to-day development |

---

## Sariah's Tool Preferences

- **#1:** Claude Code ("love of my life")
- **#2:** Cursor with Gemini model + plan mode
- **One-off prototypes:** Google AI Studio
- **Observations on models:** Claude has gotten much better at Swift/iOS in the past 6 months; used to be web-only strength

---

## Cost

- Weavy AI: ~200 free credits/month, $10-15/month for 1,500 credits
- The entire demo used roughly 30-40 credits
- The whole branded design process is essentially free or near-free

---

## Applicability to SoundSteps

### What we can adopt immediately:
1. **Define how SoundSteps should make users feel** — calm? empowered? supported? Not clinical, not overwhelming, not gamified-to-the-point-of-patronizing
2. **Find our visual anchor** — one image or metaphor that drives the entire Aura design system
3. **Use Cosmos for mood boarding** — gather hearing/accessibility/medical-but-warm inspiration
4. **Use Weavy for asset generation** — app store screenshots, marketing visuals, icon variations
5. **Negative prompts for our brand** — not clinical, not gradient, not corporate healthcare blue, not cartoon, not gamified

### The "aging with use" concept is interesting for SoundSteps:
- As users progress through Erber levels, the interface could subtly evolve
- Visual metaphor for hearing improvement — the "world" gets richer as skills develop
- Connects to the existing Erber Journey card concept

### The separation of "what" vs "how":
- SoundSteps already has solid "what" (6 training modules, Smart Coach, analytics)
- The "how" (emotional design, brand personality, visual distinctiveness) is the growth area
- Current Aura design system is a good start, but could benefit from this mood board -> visual anchor -> asset generation pipeline
