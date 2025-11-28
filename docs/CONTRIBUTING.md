# Engineering Standards

## 1. The "Nuclear" Rule
When modifying Contexts or Providers, DELETE the file content before writing. Do not append.

## 2. Integration Checks
- New Pages must be added to `App.tsx` inside `<Layout>`.
- New Providers must be added to `main.tsx`.

## 3. Style System
- Light Mode: `bg-slate-50` background, `bg-white` cards.
- Dark Mode: `bg-slate-950` background, `bg-slate-900` cards.
- Text: Use `text-slate-900` (headings) and `text-slate-500` (body).
