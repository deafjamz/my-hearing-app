# Engineering Protocol: The "Safe Build" Standard
> **Core Principle:** "Never break the build. Never guess. Always verify."

## 1. The "Nuclear" Overwrite Rule
When modifying files (especially Contexts/Components), DELETE the file content and Rewrite it completely. Do not append.

## 2. Defensive Coding
- Always provide default values for props (e.g., `data = []`).
- Never assume data exists. Check for `undefined` before `.map()`.
- Handle `NaN` in math operations (e.g., `(goal || 0) - (current || 0)`).

## 3. Style System
- **Light:** `bg-slate-50` background, `bg-white` cards.
- **Dark:** `bg-slate-950` background, `bg-slate-900` cards.
- **Text:** `text-slate-900` (Headings), `text-slate-500` (Body).
