# UI Review Checklist

> Use this checklist when reviewing UI changes or building new components.

## Design Tokens

- [ ] Uses colors from `tokens.colors` (no hardcoded hex values)
- [ ] Uses spacing from `tokens.spacing` (no arbitrary px values)
- [ ] Uses border radius from `tokens.borderRadius`
- [ ] Uses shadows from `tokens.shadows`
- [ ] Uses typography from `tokens.typography`

## Visual Consistency

- [ ] Follows 3-layer surface architecture (background → surface → elevated)
- [ ] Super-rounded corners on cards (min `rounded-xl` / 24px)
- [ ] High contrast text (primary text vs background ratio ≥ 7:1)
- [ ] Brand colors used appropriately (teal for primary CTAs, amber for rewards)
- [ ] Icons from Lucide (consistent icon family)

## Micro-Interactions

- [ ] Hover state: `scale(1.02)` on interactive elements
- [ ] Active state: `scale(0.98)` on buttons
- [ ] Transitions use `ease-out` easing
- [ ] Animation duration 150-300ms for most interactions
- [ ] Focus states visible (`outline: 2px solid #00A79D`)

## Accessibility

- [ ] All interactive elements have `aria-label` or visible text
- [ ] Form inputs have associated `<label>` elements
- [ ] Error states announced to screen readers (`aria-live="polite"`)
- [ ] Color is not the only indicator (use icons + text)
- [ ] Touch targets minimum 48x48px
- [ ] Focus order is logical (follows visual layout)
- [ ] `prefers-reduced-motion` respected

## Responsive Design

- [ ] Mobile-first approach (base styles for mobile)
- [ ] Works at 375px minimum width (iPhone SE)
- [ ] Works at 1440px for desktop
- [ ] No horizontal scrolling at any breakpoint
- [ ] Text doesn't overflow containers
- [ ] Images have appropriate `max-width`

## Dark Mode (Default)

- [ ] Background uses `#0A0A0A` (not `#000000`)
- [ ] Surface elements use `#1C1C1E`
- [ ] Elevated elements use `#2C2C2E`
- [ ] Text has sufficient contrast
- [ ] Borders/dividers subtle (not harsh white)

## Light Mode (If Applicable)

- [ ] Background uses `#F2F2F7`
- [ ] Surface elements use `#FFFFFF`
- [ ] Text contrast maintained
- [ ] Shadows adjusted for light background

## Loading States

- [ ] Skeleton loaders for content areas
- [ ] Spinner for actions (uses `<Loader2 className="animate-spin" />`)
- [ ] Disabled state for buttons during loading
- [ ] Progress indicators for long operations

## Error States

- [ ] Error messages visible and descriptive
- [ ] Error styling uses `status.error` color
- [ ] Recovery actions provided ("Try again", "Go back")
- [ ] Doesn't crash on error (graceful degradation)

## Empty States

- [ ] Helpful message when no data
- [ ] Action to populate data ("Start your first session")
- [ ] Illustration or icon to fill space appropriately

## Audio-Specific (Hearing Rehabilitation)

- [ ] Play button is prominent and easy to tap
- [ ] Audio state clearly indicated (playing/paused/loading)
- [ ] Volume not controlled by app (respects system/hearing aid volume)
- [ ] No autoplay on page load (requires user gesture)
- [ ] Replay button available

## Quiz/Exercise UI

- [ ] Answer options are large tap targets
- [ ] Correct/incorrect feedback is immediate and clear
- [ ] Correct: Green highlight + checkmark + positive animation
- [ ] Incorrect: Red highlight + X + shows correct answer
- [ ] Progress indicator visible (e.g., "5 of 10")
- [ ] Skip/Next button available

## Navigation

- [ ] Back button in top-left (if not at root)
- [ ] Current location clear (breadcrumbs or title)
- [ ] Bottom navigation stays visible on main screens
- [ ] Modal/sheet has clear close mechanism

## Performance

- [ ] Images optimized (WebP, appropriate sizes)
- [ ] No layout shift during load
- [ ] Animations use `transform` and `opacity` (GPU-accelerated)
- [ ] No unnecessary re-renders

## Code Quality

- [ ] Component uses TypeScript (no `any` types)
- [ ] Props are documented with JSDoc or comments
- [ ] Follows existing component patterns
- [ ] No inline styles for design tokens (use Tailwind classes)
- [ ] No `!important` overrides

---

## Quick Pass/Fail

A component is ready for merge if:

1. ✅ Uses design tokens consistently
2. ✅ All accessibility checks pass
3. ✅ Works on mobile (375px) and desktop (1440px)
4. ✅ Loading, error, and empty states handled
5. ✅ Micro-interactions feel responsive

If any of these fail, request changes before approving.
