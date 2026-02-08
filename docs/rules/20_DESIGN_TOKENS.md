# 20_DESIGN_TOKENS: "Aura" System

## 1. Color Palette (Dark Mode First)
* **Background Deep:** `#0A0A0A` (OLED Black)
* **Background Surface:** `#1C1C1E` (Space Grey)
* **Signal (Success/Teal):** `#00A79D` (Bioluminescent)
* **Noise (Attention/Amber):** `#FFB300` (Focus)
* **Text Primary:** `#F2F2F7` (Off-White)

## 2. Accessibility (A11y) Rules
* **Touch Targets:** Minimum **54px** height (Arthritis optimization).
* **Contrast:** WCAG AAA (7:1) for all text.
* **Haptics:**
    * Success: Crisp, short (Transient).
    * Failure: Heavy, dull (Continuous/Buzz).

## 3. UI Components
* **The Aura:** Radial gradient behind active words.
    * State: Idle (Invisible).
    * State: Active (Pulsing Teal).
* **Smart Coach Modal:**
    * "Level Up" -> Teal Glow.
    * "Adjusting" -> Amber Glow.
