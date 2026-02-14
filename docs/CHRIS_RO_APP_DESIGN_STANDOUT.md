# Insights: Chris Ro — "How I Design Apps 10x Better"

> **Source:** [YouTube — Greg Isenberg](https://www.youtube.com/watch?v=jSWuepkuFrU)
> **Duration:** 47 minutes
> **Guest:** Chris Ro (solo developer, portfolio of cash-flowing mobile apps: Ellie, Luna, Amy)
> **Compiled:** 2026-02-06

---

## What This Video Is

Chris Ro is a single developer running multiple profitable mobile apps (daily planner, budgeting, calorie tracking). He breaks down the specific techniques that make his solo-built apps look like they were made by a full team. Everything he shows was done with AI (Claude Code primarily) and zero hand-written code for the interactions.

**Core thesis:** Anyone can build an app now. The flood of vibe-coded apps all look the same. The apps making 10K-100K/month stand out because of **animations, illustrations, iconography, widgets, and polish** — not features.

---

## 1. Animations & Interactions (The #1 Differentiator)

> "The difference between a tweet that went viral and one that got 7 likes was the same app, same concept — just 6 hours of extra animation polish."

### What makes vibe-coded apps obvious:
- They're static — no motion, no life
- Users can now spot AI-generated apps the same way they spot AI images
- Default transitions, no custom interactions, everything feels the same

### What to do instead:

**Page transitions with motion:**
- Instead of instant page swaps, add subtle slide + bounce when switching tabs
- Chris found this in another app by screen-recording and slowing it down
- Users won't consciously notice, but the app "just feels different"
- Prompt: "Can you make it so when we transition between pages, have it slide over" + tweak speed/bounciness

**Micro-animations on state changes:**
- Searching state: gradient animation + "Searching..." text with shimmer
- Recording state: background expands from mic icon, send button rotates to checkmark
- Loading states: don't just show a spinner — make the transition feel intentional

**Haptics:**
- Subtle phone vibrations on button taps, swipes, completions
- Can't be conveyed in video but users feel the difference
- "There's a lot of haptics going on — when the phone subtly vibrates when you're clicking things"

**Holographic/interactive elements:**
- Chris built a holographic sticker effect (drag finger across badge to see shimmer) using Swift Metal
- Done in 2 prompts to Claude Code
- "Claude is very well trained on Apple's technology — it can make really cool interactions"

### How he builds these:
- Dictates to Claude Code in plain English
- "Can you make a black background come from the microphone icon and rotate the send button into the check mark?" — done in one prompt
- Key insight: **Claude Code is very good at animations because Apple's animation library is well-documented**
- Also works in create anything.com, Lovable, v0 — not Claude-exclusive
- The skill is knowing how to describe what you want in plain English

### SoundSteps applications:
- **RapidFire:** When user taps correct answer, satisfying bounce + haptic. Wrong answer gets a gentle shake, not just a color change
- **Word audio playback:** Subtle waveform animation or pulsing glow while audio plays (the AuraVisualizer already exists — make sure it's polished)
- **Tab/page transitions:** Slide + bounce between Practice, Dashboard, Progress — not instant swaps
- **Streak counter:** Animate the flame growing, not just a number incrementing
- **Smart Coach difficulty changes:** Subtle visual shift when SNR changes (e.g., background tint gets slightly warmer/cooler)
- **Completion states:** When finishing an exercise block, celebratory micro-animation (confetti? expanding rings? the Aura pulsing?)
- **Loading states for audio:** Instead of a generic spinner while fetching from Supabase, show a waveform building up

---

## 2. Illustrations & Mascots

> "People hate onboarding. But people after onboarding 500 testers — this is the most praised part of the app. One person signed up TWICE to see it again."

### Why mascots work:
- Give the app personality and memorability
- Empty states become delightful instead of dead
- Onboarding becomes something users praise instead of skip
- Creates emotional connection — people talk about the character, not the feature

### How to create them:

**Best approach: Human art + AI iteration**
1. Commission an artist for the first version ($200-300)
2. Feed that original art into ChatGPT 5 as a reference
3. Say "Can you riff off of this style?" to generate infinite variations
4. The original human art ensures uniqueness — pure AI mascots are starting to all look the same

**AI-only approach:**
- ChatGPT is currently best for initial mascot creation (better than Gemini)
- Nano Banana (Google) is better for iterations once you have the base
- Pro tip: ask for ONE thing at a time — the more you ask, the worse it gets
- Mash multiple references together for unique results (e.g., Snapchat ghost + hand-drawn dog = unique 3D character)

**Animating static mascots:**
- MidJourney can animate static illustrations — feed image as starting frame
- One-shot generates a looping animation
- Use on splash screens, login screens, loading states
- "Imagine if this is just looping on the login screen — that just does not feel like a vibe-coded app"

### Where mascots go in the app:
- **Onboarding screens** — animated character for each step
- **Empty states** — character with magnifying glass for "no results", character sleeping for "no activity today"
- **Widgets** — character on the home screen widget
- **Loading screens** — character doing something related to the wait
- **Achievement/badge unlocks** — character celebrating

### SoundSteps applications:
- **Create a SoundSteps mascot** — something related to hearing/sound/listening. Ideas:
  - A friendly ear character? An owl (known for excellent hearing)? A music note with personality?
  - Should feel warm, encouraging, not clinical
  - Matches the "empowered, not patronized" emotional target
- **Onboarding:** Animated mascot walking user through Erber levels, voice selection, first exercise
- **Empty states:** "No practice today yet" with mascot holding headphones; "No results found" with mascot listening carefully
- **Streak celebrations:** Mascot gets progressively happier/more energetic with longer streaks
- **Erber level transitions:** When user advances from Detection to Discrimination, mascot celebrates
- **Exercise completion:** Animated mascot reaction instead of just "Well done!" text

---

## 3. Iconography

> "Iconography is a huge tell for vibe-coded apps. When you mix lined and filled icons, it decreases quality immediately."

### The rules:
- **Pick one style and stick with it** — lined (outline) OR filled, not both mixed randomly
- Active/selected tab can switch from lined to filled — that's the one acceptable mix
- Icons from different sets clash — use one consistent set throughout
- This is a "quick fix" that has outsized impact

### Recommended icon sets:
1. **Hero Icons** — Chris's primary choice, free
2. **Font Awesome** — high quality, free tier
3. **Nucleo** — premium quality

### SoundSteps applications:
- Audit current icon usage — are we mixing styles?
- Pick one set (Hero Icons is already common in React/Tailwind projects via Lucide)
- Ensure bottom nav, activity cards, settings, and all UI icons are from the same family
- Selected tab = filled icon, unselected = outlined (standard pattern)

---

## 4. Widgets (The Retention Cheat Code)

> "When I implemented widgets, retention more than doubled. It's a signal that this is a high-quality app."

### Why widgets matter:
- **Home screen:** Takes up real estate on the user's phone — your app is seen every time they unlock
- **Lock screen:** Only 4 apps can be there — if you get a slot, user sees your app 150+ times/day
- **Apple Watch:** Signal of premium quality; users get excited when apps have Watch support
- **Deep linking:** Tap widget -> opens directly to relevant screen

### The retention math:
- User has 1000 apps competing for attention
- Widget means your app is visible WITHOUT the user opening it
- Dramatically increases daily opens -> habit formation -> retention -> revenue

### How to build them:
- Used to take 1-2 weeks to build a widget
- With Claude Code: 4-5 hours
- AI is well-trained on Apple's widget documentation
- "There is no reason not to do it"

### SoundSteps widget ideas:
- **Daily streak widget:** Show current streak + mascot, tap to start today's practice
- **"Today's Listening" widget:** "3 exercises left today" or "Practice complete!" with progress ring
- **Lock screen widget:** Tiny streak flame icon + day count — tap opens directly to next exercise
- **SNR progress widget:** Current listening level displayed simply
- **Apple Watch complication:** Streak count or "time to practice" reminder

### Priority for SoundSteps:
This is a Capacitor/native feature — requires the iOS/Android builds. Plan this into the Capacitor phase. Widgets are one of the strongest retention tools available and directly address the "daily practice habit" that hearing rehab requires.

---

## 5. App Store Screenshots

> "There's no point in increasing retention if they're not going to download it. App store screenshots are the title/thumbnail of YouTube."

### The problem:
- Developers spend months building, then throw together screenshots as an afterthought
- This is the FIRST impression — if screenshots are bad, no one downloads
- Equivalent to YouTube title/thumbnail — no matter how good the video, bad thumbnail = no views

### Resources for inspiration:
- **Screenshot First Company** (Twitter/X account) — curates great app store screenshot examples, before/after comparisons
- Study what top apps in your category do

### SoundSteps applications:
- When we submit to App Store/Google Play, invest real time in screenshots
- Show the most visually striking screens (RapidFire with animations, Erber Journey, streak celebrations)
- Use the mascot in screenshots for personality
- Show real audio waveforms/visualizations — make it feel alive, not static
- Consider short App Store preview video showing the animations in action

---

## 6. Design Inspiration Resources

| Resource | What It Is | Use Case |
|----------|-----------|----------|
| **Mobbin** | Massive screenshot library of real apps | Browse to level up design sense, see icon/layout patterns |
| **60fps** | Curated interaction/animation examples | Find specific animation ideas to replicate |
| **Spotted and Prod** | Animation showcases from top apps | Inspiration for micro-interactions |
| **Screenshot First Company** (X) | App store screenshot curation | Learn what makes downloads happen |

Chris: "These three websites are the only thing you need. If you're constantly exposed to good apps, it's inevitable you'll level up your design sense."

---

## Summary: The SoundSteps Standout Playbook

### Quick wins (can do now, web + existing codebase):
1. **Audit icon consistency** — ensure one icon set throughout (Lucide/Hero Icons)
2. **Add page transition animations** — slide + bounce between main sections using Framer Motion (already a dependency)
3. **Polish loading states** — waveform/pulse animations while audio loads from Supabase
4. **Add haptic feedback** — the `src/lib/haptics.ts` bridge already exists, wire it up to more interactions
5. **Animate the streak counter** — flame grows, number bounces on increment
6. **Exercise completion animations** — expanding rings, confetti, or Aura pulse on finish

### Medium effort (design work + some code):
7. **Create a SoundSteps mascot** — commission artist ($200-300) + iterate with ChatGPT
8. **Mascot in empty states** — "No practice today", "No results", onboarding screens
9. **Animate the mascot** — MidJourney for looping animations on splash/login
10. **Custom onboarding flow** — animated mascot per step, make users want to see the next screen

### Capacitor/native phase:
11. **Home screen widget** — daily streak + "Start Practice" deep link
12. **Lock screen widget** — streak flame, tap to open
13. **Apple Watch complication** — streak count or practice reminder
14. **App Store screenshots** — invest real time, show animations, use mascot, make it alive

### The meta-lesson:
> "The difference between 7 likes and viral was 6 hours of polish on the same concept."

SoundSteps has the functional foundation built. The next competitive edge isn't more features — it's making every interaction feel crafted, alive, and distinctly SoundSteps.
