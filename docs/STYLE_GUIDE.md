# SoundSteps Design System — "Aura"

> **"The Apple of Hearing"** — Clean, Swiss, Medical-Grade.
> This is NOT cyberpunk. No neon. No gaming aesthetics. No gratuitous glow.

## Brand Direction (Canonical Source)

The authoritative design docs live in `~/Desktop/my-hearing-app/core docs/`:
- `3_BRAND_STRATEGY.md` — Brand positioning, tone, "The Apple of Hearing"
- `4_DESIGN_SYSTEM.md` — Full "Aura" token spec, component library

**If anything in this file contradicts those core docs, the core docs win.**

## Design Principles

1. **OLED-Safe** — Deep blacks preserve battery, reduce eye strain for aging users
2. **High Contrast** — Users may have vision changes alongside hearing loss
3. **Warm & Approachable** — Non-clinical tone, friendly rounded surfaces
4. **Minimal Decoration** — Every visual element must earn its place
5. **Tactile Feedback** — Micro-interactions confirm actions, not decorate them

## Color Palette

### Backgrounds (OLED-Safe)
| Token | Value | Usage |
|-------|-------|-------|
| Background | `bg-slate-950` / `#0A0A0A` | App background |
| Surface | `bg-slate-900` / `#1C1C1E` | Cards, containers |
| Elevated | `bg-slate-800` / `#2C2C2E` | Modals, popovers |

### Brand Colors
| Token | Value | Usage |
|-------|-------|-------|
| **Primary (Teal)** | `bg-teal-500` / `#00A79D` | **Primary CTA, success, speech signal** |
| Amber | `bg-amber-500` / `#FFB300` | Noise indicator, warnings, attention |
| Violet | `bg-violet-500` | Secondary accent only (never primary CTA) |

### Text
| Token | Class | Usage |
|-------|-------|-------|
| Primary | `text-white` / `text-slate-900` | Headings, key data |
| Secondary | `text-slate-400` / `text-slate-500` | Body, descriptions |
| Muted | `text-slate-500` / `text-slate-600` | Captions, labels |

### Status
| State | Color |
|-------|-------|
| Success | `text-teal-400` / `bg-teal-500` |
| Error | `text-red-400` / `bg-red-500` |
| Warning | `text-amber-400` / `bg-amber-500` |

## Typography

- **Headings:** `font-bold` (700 max — never `font-black`)
- **Body:** `font-medium` (500)
- **Labels:** `text-xs font-bold uppercase tracking-wide text-slate-500`
- **Font family:** System default (Inter where loaded)
- **Slate, not Gray:** Always `text-slate-xxx`, never `text-gray-xxx`

## Surface Architecture (3 Layers)

### Layer 0 — App Background
- Dark: `bg-slate-950`
- Light: `bg-slate-50`
- **No gradient orbs.** Background should be clean and flat.
  - Exception: A single, very subtle atmospheric wash (< 5% opacity, > 150px blur) is acceptable on hero/welcome screens only.

### Layer 1 — Cards & Containers
- Dark: `bg-slate-900 border border-slate-800`
- Light: `bg-white border border-slate-200`
- Radius: `rounded-3xl` (32px) for main cards, `rounded-2xl` (24px) for nested elements
- **No gradient backgrounds on cards.** Solid colors only.
- **No colored borders** (e.g., `border-teal-700/50`). Use `border-slate-800` consistently.

### Layer 2 — Interactive Elements
- Bottom nav / headers: `bg-white/90 backdrop-blur-md` (light) or `bg-slate-900/90 backdrop-blur-md` (dark)
- Active states: Teal accent, not purple

## Buttons

### Primary CTA
```
bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-full py-4 px-8
```
- **Solid teal. No gradients.**
- Subtle glow is acceptable: `shadow-[0_0_20px_rgba(0,167,157,0.3)]`
- Min touch target: 48px height

### Secondary
```
bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800
```

### Ghost / Link
```
text-slate-400 hover:text-slate-300 text-sm font-medium
```

### Play / Action Buttons
```
bg-teal-500 hover:bg-teal-400 text-white rounded-full w-16 h-16
```
- **No gradient fills** (not `from-purple-500 to-purple-600`)
- **No colored shadows** (not `shadow-purple-500/30`)

## Micro-Interactions

- Cards: `hover:scale-[1.02] active:scale-[0.98] transition-all`
- Buttons: `whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}`
- Duration: 150–300ms
- Easing: `ease-out` or framer-motion spring
- **No animated glow pulses or neon effects.**

## Accessibility

- Min touch target: 48px (54px preferred for primary actions)
- Never rely on color alone — pair with icons or text
- Always define explicit `dark:` variants
- Light mode text never lighter than `slate-400`
- WCAG AA contrast minimum (AAA preferred for body text)

## What We Do NOT Do

These patterns are explicitly rejected:

| Pattern | Why |
|---------|-----|
| Gradient orbs as standard backgrounds | Gaming aesthetic, not medical |
| `from-purple-500 to-purple-600` button fills | Gradient buttons feel like a game app |
| `shadow-purple-500/30` colored shadows | Neon glow, cyberpunk territory |
| `font-black` (weight 900) | Too heavy; medical UX should feel calm |
| Purple as primary CTA color | Teal is primary; violet is secondary accent only |
| Animated pulsing glows on UI elements | Distracting, not purposeful |
| "Cyberpunk," "Porcelain & Cyberpunk" naming | Outdated (Nov 2025). Current system is "Aura" |

---

## Revision History

- **Feb 2026:** Complete rewrite. Replaced "Porcelain & Cyberpunk" with "Aura" system aligned to brand strategy. Removed gradient orbs, purple CTAs, and gaming aesthetics.
- **Nov 2025:** Original version ("Porcelain & Cyberpunk"). Now superseded.
