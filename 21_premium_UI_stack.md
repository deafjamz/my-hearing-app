# 21_PREMIUM_UI_STACK: The "Native Feel" Architecture
**Role:** Lead Product Designer & Frontend Architect
**Objective:** Transcend the "Web App" feel. Build a "Hand-Crafted" interface that feels physical, fluid, and native.

## 1. The "Headless + Hand-Crafted" Philosophy
We do not use pre-styled component libraries (MUI, Bootstrap). We use **Headless Logic** + **Custom Tailwind Styles**.
* **Why:** "Accessible Premium" requires full control over contrast, glow effects, and hit testing that generic libraries break.
* **The Standard:** If it doesn't animate smoothly (60fps) and vibrate haptically, it isn't finished.

## 2. The Premium Stack (Mandatory Libraries)
These are the designated tools for specific UI patterns. Do not hallucinate others.

| Category | Library | Use Case |
| :--- | :--- | :--- |
| **Gestures/Drawers** | **Vaul** | All "Modals" must be Bottom Sheets on mobile. Must support "Drag to Dismiss" physics. |
| **Animation** | **Framer Motion** | All state changes (Layout transitions, shared element expansions). |
| **Accessibility** | **React Aria** | For complex interactive primitives (Sliders, Toggles, Dropdowns) to ensure screen reader support. |
| **Feedback** | **Sonner** | Stackable, swipeable Toast notifications. Position: Top-Center (Mobile), Bottom-Right (Desktop). |
| **Data Viz** | **Recharts** | Clinical graphs. Axis must be inverted for SNR (Lower is Better). |
| **Typography** | **Number Flow** | Animating statistical changes (e.g. "Daily Ascent" numbers scrolling). |
| **Performance** | **Virtuoso** | Virtualized scrolling for the Word List (1000+ items). |

## 3. Interaction Patterns ("The Juice")

### 3.1 The "Fluid" Card
* **Concept:** Context Persistence.
* **Behavior:** When clicking a Word Pair card in a list, it should not "route" to a new page instantly. It should **expand** (`layoutId`) to fill the screen.
* **Implementation:** Framer Motion Shared Layout Animation.

### 3.2 Optimistic Toggles
* **Concept:** Instant Obedience.
* **Behavior:** UI updates *immediately* on tap. The network request happens in the background.
* **Fail State:** If the request fails, the UI reverts with a "Sonner" Toast error.

### 3.3 The "Glow" Focus
* **Concept:** Bioluminescence.
* **Behavior:** Active elements (Play Button, Selected Answer) do not just change background color. They emit a `box-shadow` "Glow" in `brand-teal`.
* **CSS:** `shadow-[0_0_20px_rgba(0,167,157,0.5)]`

## 4. Mobile-First Constraints (Capacitor Specifics)

### 4.1 The "Safe Area" Mandate
* **Rule:** All top-level containers must respect the iPhone Notch and Android Home Bar.
* **Code:**
    ```css
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    ```

### 4.2 "Physical" Touch Targets
* **Rule:** Interactive elements must handle `onTouchStart` for haptics, not just `onClick`.
* **Rule:** Minimum tap area is **48x48px**, even if the icon is smaller.

---

## 5. Brainstorming Log (In Progress)
*Ideas to be refined and implemented during the "Juice" Sprint.*

## 6. The "Propulsive Calm" Directive (Hims/Hinge Inspiration)

### 6.1 The "Focus Mode" (Hims Influence)
* **Rule:** During active listening (RapidFire), the UI must eliminate all peripheral choice.
* **Implementation:**
    * Hide the Bottom Nav.
    * Hide the Header (except the Exit 'X').
    * Center the content vertically.
    * **Typography:** Use massive, high-contrast text for the Target Word (32px+).

### 6.2 The "Spatial Stack" (Hinge Influence)
* **Rule:** Navigation is movement, not replacement.
* **Implementation:**
    * **Forward:** Content slides in from Right -> Left (push).
    * **Back:** Content slides from Left -> Right (pop).
    * **Context:** The background layer scales down slightly (0.95) and dims, creating a 3D "Stack" effect.
    * **Tool:** `Framer Motion` <AnimatePresence> with `custom` direction prop.

### 6.3 The "Smart Menu" (Hinge Influence)
* **Rule:** Settings/Preferences should not be a new page. They should be a "Sheet" that slides up over the context.
* **Interaction:** Toggling "Noise" shouldn't require leaving the game.
    * Tap Toggle -> Sheet rises (Vaul).
    * Adjust Slider.
    * Drag down to dismiss.
    * **Physics:** Must support rubber-banding (pulling past the limit).
**Status:** Design Pivot. We are rejecting "Elevate/High-Performance" vibes.
**Objective:** Adopt "Compassionate Design" (Effort > Accuracy).

**Task:** Overwrite the "Design Benchmarks" section in `docs/rules/21_PREMIUM_UI_STACK.md` with this new direction:

## 7. Design Benchmarks (The "Compassionate" North Star)

### 7.1 The Core Philosophy: "Effort is Victory"
* **Principle:** We reward the *habit* of listening, not just the *acuity* of hearing.
* **Rule:** Never punish a low score. A "Bad Hearing Day" is still a "Good Training Day" if the user showed up.
* **Reference:** Apple Fitness Rings (Closing the loop) vs. Strava (Beating the time).

### 7.2 Metrics & Data (Ref: Oura, Apple Health)
* **Directive:** Hero metrics are **Cumulative** (Steps Taken, Words Heard, Minutes Focused).
* **Directive:** **Accuracy** is a secondary diagnostic metric, not a primary reward.
* **Visual:** Graphs should emphasize *consistency* (streaks/volume) over *performance* (peaks/valleys).

### 7.3 Feedback Loop (Ref: Headspace)
* **Tone:** Warm, validating, patient.
* **Mechanism:** "Resonance" (Haptics/Visuals) triggers on **Completion**, not just Perfection.
* **Smart Coach:** When reducing difficulty, frame it as "Finding your Flow," not "You failed, making it easier."

### 7.4 Visual Warmth (Ref: Calm)
* **Palette:** Keep the Bioluminescent Teal, but ensure gradients are soft (Gaussian blurs), not sharp lasers.
* **Motion:** Slow, breathing animations (2s+ duration) to regulate anxiety**Status:** Design Refinement.
**Context:** We are removing "Friction" (No manual check-ins) and adding "Intelligence" (Auto-adjusting goals).

**Task:** Update the "Compassionate North Star" section in `docs/rules/21_PREMIUM_UI_STACK.md`.

## 7. Design Benchmarks (The "Compassionate" North Star)

### 7.1 The Core Philosophy: "Consistency over Intensity"
* **Rule:** Reduce friction. No mandatory "Check-in" modals on launch. Get the user to audio within 1 tap.
* **Reference:** Apple Fitness "Close the Rings."

### 7.2 The "Welcome Back" Protocol (Dynamic Goals)
* **Logic:** If `last_session > 48 hours`:
    * Automatically reduce the "Daily Goal" by 50-70% (e.g., 5 mins instead of 15).
    * **Visual:** The "Ascent" bar shows a lower target line.
    * **Message:** "Welcome back. We've set a lighter goal for today to help you warm up."

### 7.3 The Notification Engine (Capacitor Local)
* **Strategy:** "Inviting, never Nagging."
* **Campaign 1:** "The Rhythm." Notification at the same time they usually play.
* **Campaign 2:** "The Handshake." After 48h inactivity, notify them that the goal has been lowered to make it easy to return.

### 7.4 Visual Warmth
* **Palette:** Bioluminescent Teal (`#00A79D`).
* **Feedback:** Haptics and "Resonance" animations trigger on **Completion** of the goal, regardless of accuracy..
