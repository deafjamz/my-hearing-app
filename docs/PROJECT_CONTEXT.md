# Project Context & Asset Inventory

## 1. Audio Assets (The "Gold Mine")
- **Status:** We have approximately **3,500 pre-generated audio files**.
- **Location:** Local storage (Need to verify exact path in `public/`).
- **Strategy:** PRIMARY method is playing local files. 
- **Goal:** Build a "Dynamic Router" that constructs paths based on User Settings (Voice) + Content ID.

## 2. ElevenLabs Integration
- **Resources:** **300,000 Credits** available.
- **Usage Strategy:** - Use for *dynamic* content (e.g., User types a sentence to hear it).
    - Use for "Gap Filling" (Generating missing words that aren't in the 3,500 local files).
    - **Constraint:** Do NOT burn credits on static words we already own.

## 3. Tech Stack Constraints
- **Frontend:** React + Vite + TypeScript.
- **Styling:** Tailwind CSS ("Slate/Cyberpunk" Theme).
- **State:** `UserContext` (Local Storage persistence).
- **Deployment:** Client-side only (Currently). 
    - *Security Warning:* We cannot store ElevenLabs API Keys in the frontend code. We will need a proxy or serverless function later.

## 4. Core Architecture Decisions
- **Audio Architecture:** The primary audio source is a static data file (`src/data/wordPairs.ts`) which maps content IDs to metadata. The application constructs audio paths dynamically based on user settings, following the pattern: `/hearing-rehab-audio/{voice}_audio/{word}.mp3`.
- **UI Architecture:** All activity/game pages must use the "Layout Sandwich" pattern. This consists of a `sticky` header and a central action area, with the content being the only scrollable region. This prevents layout shifts and ensures critical controls are always accessible. See `RapidFire.tsx` for the reference implementation.
- **State Management:** All persistent user data is managed by `UserContext`. This includes the daily practice goal, selected voice, and accuracy streak. The context handles serialization to and from LocalStorage, providing a single source of truth for the application.
