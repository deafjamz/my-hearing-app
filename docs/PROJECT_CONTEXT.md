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
