# SoundSteps UI Design System
> "Top Tier" Medical/Rehab Aesthetic. Clean, Tactile, Atmospheric.

## 1. Surface Architecture (The "Porcelain & Cyberpunk" System)
We do not use flat colors. We use a 3-layer depth system.

- **Layer 0 (App Background):** - Light: `bg-slate-50` (Not White)
  - Dark: `bg-slate-950` (Not Black)
  - **Atmosphere:** Must always include `Layout.tsx` gradient orbs (`bg-purple-500/20 blur-[100px]`) behind content.

- **Layer 1 (Cards & Containers):**
  - Light: `bg-white` + `border-slate-200` + `shadow-lg shadow-slate-200/50`
  - Dark: `bg-slate-900` + `border-slate-800` + `shadow-none`
  - Radius: `rounded-[2rem]` (Super rounded)

- **Layer 2 (Interactive/Glass):**
  - Bottom Nav / Headers: `bg-white/90` + `backdrop-blur-md`
  - Active States: `text-purple-600` or `bg-purple-100`

## 2. Typography (Slate, not Gray)
Never use `text-gray-xxx`. We use `text-slate-xxx` for a premium, engineered feel.

- **Headings:** `text-slate-900 dark:text-white font-black tracking-tight`
- **Body/Metadata:** `text-slate-500 dark:text-slate-400 font-medium`
- **Captions/Labels:** `text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest`

## 3. Data Visualization (The Grid)
Charts must never "float."
- **Alignment:** Use `grid grid-cols-7` for weekly data to ensure perfect vertical alignment between bars and labels.
- **Goals:** Goal lines are `border-dashed border-red-300` and span full width.

## 4. Micro-Interactions
- **Cards:** `hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer`
- **Buttons:** Circular containers for arrows (e.g., `w-10 h-10 rounded-full bg-purple-50 text-purple-600`)

## 5. Accessibility
- Never rely on color alone.
- Ensure `dark:` variants are always explicitly defined for text.
- Light Mode text is never lighter than `slate-400`.
