# SoundSteps Identity Direction — "The Clearing"

> **Status:** DECIDED — Feb 2026
> **Interactive reference:** `docs/soundsteps-identity.jsx`
> **Logomark concept:** S-with-sound-waves (see below)
> **Supersedes:** "Porcelain & Cyberpunk" (Nov 2025), early "Aura" draft

---

## The Decision

**Identity direction:** "The Clearing" — sound moving from obscured to clear. Fog lifting. Clarity earned through practice.

**Teal:** Deeper Teal `#008F86` — more saturated, more premium, reads as medical-grade without being clinical.

**Logomark:** Stylized "S" with horizontal sound-wave lines radiating from it. Encodes motion, sound, and forward momentum. Clean at app-icon scale, distinctive, not literal (no ear, no cochlea).

**Illustration style:** Not a mascot. A minimal, almost stick-figure human climbing simple steps — emerging from fog/clouds at milestone moments. Abstract, not cute. Represents the user's own journey, not a character.

**Universal audience:** Must feel right for a 32-year-old with sudden hearing loss AND a 67-year-old with new CIs. No age-targeted aesthetics in either direction.

---

## The Identity Tension (Resolved)

The brand had two competing impulses:

| Impulse | Source | Points Toward |
|---------|--------|---------------|
| **"Apple of Hearing"** | `3_BRAND_STRATEGY.md` | Restraint, whitespace, authority, clinical precision |
| **"Accessible Premium"** | Same doc + `4_DESIGN_SYSTEM.md` Aura concept | Emotion, organic movement, human warmth |

**Resolution:** "The Clearing" bridges both. The Swiss precision lives in typography, spacing, and restraint. The warmth lives in the Aura visualizer, the atmospheric backgrounds, and the way content emerges from blur into clarity. Neither impulse wins alone — they're two aspects of the same experience: precise technology enabling human warmth.

---

## The First 3 Seconds

When a user opens SoundSteps, they should feel like stepping into a quiet room after being in a loud restaurant. Not silent — *resolved*. They can breathe. They know what they're about to do matters, and the app respects their time.

Not clinical. Not gamified. Not passive wellness. **Active clarity.**

---

## Color System

### Primary Palette

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| **Primary (Deeper Teal)** | `#008F86` | Custom | CTA, success, speech signal, the Aura |
| **Amber** | `#FFB300` | `amber-500` | Noise indicator, streaks, warnings, warmth accent |
| **Violet** | keep existing | `violet-500` | Secondary accent only (never primary) |

### Background Layers (Deep Blue-Black + Grain)

| Layer | Hex | Usage |
|-------|-----|-------|
| **Base** | `#0A0E14` | App background (deep blue-black, NOT pure OLED black) |
| **Surface** | `#141A23` | Cards, containers |
| **Elevated** | `#1E2530` | Modals, popovers |

**Grain texture:** Subtle SVG noise at 2-3% opacity over all backgrounds. Breaks the "flat digital void" feel. Directly ties to brand metaphor — noise is literally part of the visual language.

**Why not pure OLED black (#0A0A0A):** Pure black is emotionally dead. Deep blue-black (`#0A0E14`) gives the color palette a tonal foundation. The difference is barely perceptible but prevents the "void" feeling that kills warmth.

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#F0F2F5` | Headings, key data |
| Secondary | `#9BA3AF` | Body, descriptions |
| Muted | `#6B7380` | Captions, labels |

---

## Typography

**Primary:** Satoshi (from fontshare.com, free)
- Geometric clarity — maps to "signal resolving from noise"
- Warm without being playful — doesn't skew young or old
- Excellent legibility at all sizes
- Distinctive enough to avoid "AI-coded app" pattern matching

**Fallback chain:** `'Satoshi', 'General Sans', system-ui, sans-serif`

**Weight rules (unchanged):** `font-bold` (700) max — never `font-black` (900)

---

## Logomark

**Concept:** Stylized "S" with horizontal speed/sound lines radiating from the curves. The lines suggest:
- Sound waves emanating
- Forward motion / momentum
- Signal resolving from noise (lines are the "clearing")

**Properties:**
- Works at app icon, favicon, and nav sizes
- Teal on deep blue-black background
- No ear, no cochlea, no literal hearing imagery — abstract and modern
- Pairs with "SoundSteps" wordmark in Satoshi Bold

**File:** Logo image reference exists; needs vectorization for production use (SVG + multiple sizes).

---

## The Aura Visualizer (Visual Anchor)

The Aura is the signature element — the equivalent of the cassette tape in the Sariah/Isenberg video. Everything radiates from it.

- Teal radial gradient pulsing with audio amplitude
- Teal = speech signal, Amber = noise
- States: Idle (invisible) → Active (pulsing teal) → Noise (amber ring)
- Should feel like the visual heartbeat of the app
- Not decoration — it IS the training feedback mechanism

---

## Illustration Approach: The Step Climber

**NOT a mascot.** An abstract representation of the user's journey.

**Concept:** A minimal line-art human figure climbing simple ascending steps. At milestones, the figure emerges from clouds/fog into clearer air above.

**Why this works within the brand:**
- "SoundSteps" — the name IS the metaphor brought to life
- Stick figure / minimal line art matches "Swiss, medical-grade, minimal decoration"
- Fog = unclear hearing → clearing = progress (deeply personal for CI users)
- Triggered by milestones only — "every visual element must earn its place"
- Abstract form, not a personality — represents the user, not a character

**Visual style:**
- Thin line weight, architectural / blueprint feel
- Teal accent on the figure or the steps
- Fog rendered as subtle gradient wash (< 5% opacity, > 150px blur — within existing rules)
- No face, no expression — abstract human form
- Steps subtly reference Erber levels (Detection at bottom, Comprehension at top)

**Where it appears:**
- **Streak milestones** (7, 30, 100 days) — figure climbs higher, fog clears more
- **Erber level advancement** — figure reaches a new plateau
- **Session completion** — quick 1-2s animation of one more step up
- **Dashboard Erber Journey card** — static version showing current position
- **Onboarding** — the full staircase, user's journey ahead

**Where it does NOT appear:**
- Empty states (use text + icon, not illustration)
- Loading screens
- Splash screen (logo only)

**How to create:**
- Commission illustrator for base frame set ($200-300), or generate via Weavy AI + Flux with mood board of Swiss design posters, architectural line drawings
- Negative prompts: not cartoon, not childish, not clinical, not corporate
- Animate with Lottie (After Effects → JSON) or Framer Motion SVG path animation
- Keep to 1-2 seconds max, subtle, earned

---

## Animation & Interaction Principles

### What Chris Ro's video teaches us (adapted to our brand):

**DO — purposeful micro-interactions:**
- Page transitions: slide + spring between main routes via `AnimatePresence`
- Audio loading state: Aura pulse/build during Supabase fetch (not a generic spinner)
- Correct/incorrect feedback: bounce (correct) or gentle shake (incorrect), not just color change
- Exercise completion: teal rings expanding or Aura burst
- Streak increment: flame grows, number bounces

**DO — haptics (already in design system, underdeployed):**
- Success: crisp "bip-bip" (Transient) — wire to correct answers, completions, streak milestones
- Error: heavy "thud" (Continuous) — wire to incorrect answers
- Currently only in 8 files; should be on all interactive elements

**DON'T — decorative animation:**
- No animated glow pulses or neon effects (explicitly rejected in style guide)
- No bounce/wiggle on idle elements
- No parallax or scroll-driven animation for its own sake
- Animation must confirm an action or convey state, not decorate

### The "6-hour difference" principle:
Chris Ro's identical app tweet got 7 likes without animation polish, went viral WITH it. Same concept, 6 hours of work. The lesson: SoundSteps' functional layer is complete. The next competitive edge is making every interaction feel crafted.

---

## Widget Strategy (Native Builds)

From Chris Ro: retention more than doubled from widgets alone.

**Priority widgets for SoundSteps (Capacitor phase):**

| Widget | Type | Content |
|--------|------|---------|
| **Daily Practice** | Home screen | Streak count + "Start Practice" deep link |
| **Streak Flame** | Lock screen | Tiny flame icon + day count |
| **Listening Level** | Home screen (optional) | Current Erber level + SNR |

**Why this matters for hearing rehab specifically:** Daily practice habit is clinically important. A lock screen widget showing streak count creates 150+ daily impressions — it's the best possible reminder without a notification that users would mute.

---

## App Store Strategy

Screenshots and preview video are the "title/thumbnail" of the App Store. Plan these BEFORE submission:

- Show the Aura visualizer in action (video preview)
- Dark background screenshots with teal accents will stand out against the sea of white/light health apps
- Use the logomark prominently
- Show real exercise screens, not marketing mockups
- The step-climber illustration in one screenshot showing progression

---

## What We Explicitly Reject

| Pattern | Why | Source |
|---------|-----|-------|
| Full character mascot | Too immature for adult CI users; undermines medical-grade trust | Brand decision |
| Holographic stickers / collectible badges | Gaming aesthetic | Style guide |
| Cartoon illustrations | Skews young, patronizing for 50+ users | Brand direction |
| Gradient button fills | "AI slop" aesthetic per Isenberg/Sariah | Style guide |
| Purple as primary CTA | Teal is primary; violet is secondary only | Brand strategy |
| Pure OLED black backgrounds | Emotionally dead; "The Clearing" needs atmospheric depth | Identity decision |
| Age-targeted design in either direction | Must feel universal — not geriatric care, not Gen Z wellness | Brand decision |
| Duolingo-style gamification | Patronizing; SoundSteps users are adults training a serious skill | Brand positioning |

---

## What Aligns Across All Sources

| Principle | Isenberg/Sariah Video | Chris Ro Video | SoundSteps Core Docs |
|-----------|----------------------|----------------|---------------------|
| Separate "what" from "how" | Core thesis | Implied (features are solved, polish differentiates) | "The functional layer is solved; emotional layer is the edge" |
| Find your visual anchor | "One image can drive a whole company" | N/A (focuses on polish, not brand) | The Aura visualizer IS the anchor |
| Animations are the #1 differentiator | Mentioned but not focus | Core thesis — 7 likes vs viral | Micro-interactions defined but underdeployed |
| Haptics matter | Not covered | Emphasized heavily | In design system, only in 8 files |
| Icon consistency | Not covered | Major call-out | Already solid (Lucide throughout) |
| Widgets for retention | Not covered | "Retention more than doubled" | Not in docs yet — add to Capacitor phase |
| Don't be precious — ship | "Pick your poison based on comfort level" | "The difference was 6 hours of polish" | Web is deployed; polish is the next phase |

---

## Implementation Priority

### Phase 1 — Web polish (now):
1. Swap font to Satoshi (tailwind.config + font loading)
2. Update teal token to `#008F86`
3. Update background to `#0A0E14` + grain texture CSS
4. Add page transitions via `AnimatePresence`
5. Wire haptics to all interactive elements
6. Polish Aura visualizer as hero element
7. Add completion animations (teal ring burst)

### Phase 2 — Brand assets (parallel):
8. Vectorize logomark as SVG (from the concept image)
9. Generate step-climber illustration frames
10. Create App Store screenshot templates
11. Update PWA manifest with new logo + colors

### Phase 3 — Native (Capacitor):
12. Initialize Capacitor (iOS + Android)
13. Build home screen + lock screen widgets
14. Implement step-climber Lottie animations
15. App Store / Play Store submission with polished screenshots + preview video

---

## Files to Update

| File | Change |
|------|--------|
| `tailwind.config.js` | New teal hex, new background colors, Satoshi font family |
| `src/styles/tokens.ts` | Update all color tokens |
| `docs/rules/20_DESIGN_TOKENS.md` | Reflect new values |
| `docs/STYLE_GUIDE.md` | Update color palette, background section, add animation/transition guidance |
| `public/manifest.json` | Update `theme_color` and `background_color` |
| `index.html` | Add Satoshi font loading, update meta theme-color |

---

## Reference Files

| File | Purpose |
|------|---------|
| `docs/soundsteps-identity.jsx` | Interactive identity exploration (teal comparison, logomark concepts, typography, components) |
| `docs/GREG_ISENBERG_AI_DESIGN_INSIGHTS.md` | Sariah's design workflow: Cosmos → Weavy → Figma pipeline |
| `docs/CHRIS_RO_APP_DESIGN_STANDOUT.md` | Animation, mascot, widget, iconography, App Store strategies |
| `core_docs/3_BRAND_STRATEGY.md` | "The Apple of Hearing" positioning (still canonical for brand tone) |
| `core_docs/4_DESIGN_SYSTEM.md` | Original Aura spec (components section still valid) |
