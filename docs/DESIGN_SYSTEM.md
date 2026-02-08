# SoundSteps Design System

> Last Updated: 2026-01-25
>
> This document defines the visual language for SoundSteps. All UI work should reference this guide.

## Design Philosophy

**OLED-Safe Dark Mode + Bioluminescent Accents**

SoundSteps targets users with hearing loss who may also have age-related vision changes. Our design prioritizes:

1. **High Contrast:** Text is always highly legible against backgrounds
2. **OLED Optimization:** Deep blacks preserve battery and reduce eye strain
3. **Warm Accents:** Teal and amber provide energy without harshness
4. **Super-Rounded Corners:** Friendly, approachable feel
5. **Tactile Feedback:** Micro-interactions confirm user actions

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Teal** | `#00A79D` | Primary CTAs, success states, brand highlight |
| **Amber** | `#FFB300` | Secondary CTAs, rewards, streak flames |

### Background Colors (OLED-Safe)

| Name | Hex | Usage |
|------|-----|-------|
| **Default** | `#0A0A0A` | App background |
| **Surface** | `#1C1C1E` | Cards, elevated surfaces |
| **Elevated** | `#2C2C2E` | Modals, popovers |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Primary** | `#F2F2F7` | Main text, headings |
| **Secondary** | `#AEAEB2` | Labels, descriptions |
| **Muted** | `#8E8E93` | Placeholders, disabled |

### Status Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#4CAF50` | Correct answers, achievements |
| **Error** | `#FF453A` | Incorrect answers, errors |

## Typography

### Font Stack

```css
font-family: 'Inter Variable', system-ui, -apple-system, sans-serif;
```

### Type Scale

| Name | Size | Weight | Usage |
|------|------|--------|-------|
| **Display** | 36px | 900 (Black) | Hero headlines |
| **Heading 1** | 30px | 700 (Bold) | Page titles |
| **Heading 2** | 24px | 600 (Semibold) | Section headers |
| **Heading 3** | 20px | 600 (Semibold) | Card titles |
| **Body** | 16px | 400 (Regular) | Default text |
| **Body Small** | 14px | 400 (Regular) | Secondary text |
| **Caption** | 12px | 500 (Medium) | Labels, badges |

## Spacing

Based on a 4px grid (`0.25rem`).

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Icon padding, tight gaps |
| `sm` | 8px | Button padding, small gaps |
| `md` | 16px | Card padding, default gaps |
| `lg` | 24px | Section spacing |
| `xl` | 32px | Page margins |
| `2xl` | 48px | Hero spacing |

## Border Radius

Super-rounded corners are a key visual element.

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 8px | Small buttons, inputs |
| `md` | 16px | Default cards |
| `lg` | 24px | Large cards |
| `xl` | 32px | Hero cards, modals |
| `full` | 9999px | Pills, avatars |

## Shadows

### Dark Mode (Primary)

Subtle glow effects that don't overpower the dark background.

```css
/* Teal glow for CTAs */
box-shadow: 0 0 20px rgba(0, 167, 157, 0.3);

/* Amber glow for rewards */
box-shadow: 0 0 20px rgba(255, 179, 0, 0.3);

/* Subtle elevation */
box-shadow: 0 4px 16px rgba(0, 167, 157, 0.15);
```

## Animation

### Micro-Interactions

All interactive elements should have subtle scale feedback:

```css
/* Hover state */
transform: scale(1.02);
transition: transform 0.15s ease-out;

/* Active/pressed state */
transform: scale(0.98);
transition: transform 0.1s ease-in;
```

### Duration Scale

| Name | Value | Usage |
|------|-------|-------|
| **Instant** | 0ms | Immediate feedback |
| **Fast** | 150ms | Hover, focus states |
| **Normal** | 300ms | Page transitions |
| **Slow** | 500ms | Complex animations |

### Easing

| Name | Value | Usage |
|------|-------|-------|
| **Default** | `ease-out` | Most transitions |
| **Bounce** | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Celebration animations |
| **Smooth** | `cubic-bezier(0.4, 0, 0.2, 1)` | Page transitions |

## Components

### Button Variants

#### Primary Button (Teal)
- Background: `#00A79D`
- Text: `#FFFFFF`
- Border Radius: `full` (pill shape)
- Shadow: Teal glow on hover
- Usage: Main CTAs ("Start Session", "Play Audio")

#### Secondary Button (Outline)
- Background: Transparent
- Border: `1px solid #00A79D`
- Text: `#00A79D`
- Usage: Secondary actions

#### Ghost Button
- Background: Transparent
- Text: `#AEAEB2`
- Usage: Tertiary actions, navigation

### Cards

- Background: `#1C1C1E` (surface)
- Border Radius: `xl` (32px)
- Padding: `md` (16px) to `lg` (24px)
- Shadow: Optional subtle glow on interactive cards

### Quiz Card (Special)

The quiz card is a key UI element for exercises:

```
┌────────────────────────────────────┐
│                                    │
│    🔊  [Play Audio Button]         │
│                                    │
│    Which word did you hear?        │
│                                    │
│    ┌──────────┐  ┌──────────┐     │
│    │   bat    │  │   pat    │     │
│    └──────────┘  └──────────┘     │
│                                    │
└────────────────────────────────────┘
```

- Answer buttons: Large tap targets (min 48px height)
- Correct answer: Green highlight + ✓ icon
- Incorrect answer: Red highlight + shake animation

### Feedback Overlay

Shows after each answer:

- **Correct:** Green background, "✓ Correct!" text, confetti optional
- **Incorrect:** Red background, "✗ Try again" text, shows correct answer

## Icons

Use [Lucide Icons](https://lucide.dev/) for consistency.

Key icons:
- `Volume2` - Play audio
- `Check` - Correct
- `X` - Incorrect
- `Flame` - Streak
- `Trophy` - Achievement
- `Settings` - Settings
- `User` - Profile
- `ChevronLeft` - Back navigation

## Accessibility

### Color Contrast

All text meets WCAG AA standards:
- Primary text on dark: 14.5:1 ratio
- Secondary text on dark: 7.2:1 ratio

### Focus States

All interactive elements must have visible focus indicators:

```css
:focus-visible {
  outline: 2px solid #00A79D;
  outline-offset: 2px;
}
```

### Touch Targets

Minimum touch target size: **48x48px**

This is especially important for users with motor difficulties.

### Motion Sensitivity

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Dark Mode (Default)

SoundSteps defaults to dark mode. Light mode is available but secondary.

### Dark Mode Values (Default)

- Background: `#0A0A0A`
- Surface: `#1C1C1E`
- Text: `#F2F2F7`

### Light Mode Values (Optional)

- Background: `#F2F2F7`
- Surface: `#FFFFFF`
- Text: `#1C1C1E`

## Design Tokens File

Reference `src/styles/tokens.ts` for programmatic access to all design tokens.

```typescript
import { tokens } from '@/styles/tokens';

// Use in styled-components or inline styles
const buttonStyle = {
  backgroundColor: tokens.colors.brand.teal,
  borderRadius: tokens.borderRadius.full,
};
```

## Tailwind Integration

Design tokens are mapped to `tailwind.config.js`:

```javascript
// Example usage
<button className="bg-brand-teal text-white rounded-full px-6 py-3
                   hover:scale-102 active:scale-98 transition-transform">
  Start Session
</button>
```

## Component Library Structure

```
src/components/
├── primitives/     # Button, Card, Input, Modal (no business logic)
├── ui/             # ActivityHeader, AudioPlayer, QuizCard, etc.
├── auth/           # AuthModal
├── feedback/       # SessionSummary, SmartCoachFeedback
└── visualizers/    # Aura, AudioVisualizer
```

## Resources

- [Tokens File](/src/styles/tokens.ts)
- [UI Review Checklist](/docs/UI_REVIEW_CHECKLIST.md)
- [Tailwind Config](/tailwind.config.js)
