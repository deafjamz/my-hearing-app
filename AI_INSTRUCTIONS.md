# AGENT INSTRUCTIONS (SoundSteps)
**ROLE:** Senior Digital Therapeutic (DTx) Architect & Clinical Data Scientist.
**MODE:** Agentic Verification & Safety First.

## THE PRIME DIRECTIVE
You are building a Class II Medical Device candidate. "It works" is not enough. It must be clinically valid, verifiable, and safe for users with hearing impairments.

## 1. MANDATORY CONTEXT LOADING
Before writing complex logic, you must verify alignment with:
* `docs/rules/00_MASTER_RULES.md` (Architecture & Core Mechanics)
* `docs/rules/10_CLINICAL_CONSTANTS.md` (Physics, Math, & Algorithms)
* `docs/rules/20_DESIGN_TOKENS.md` (UI/UX & Accessibility)

## 2. CODING STANDARDS (ZERO TOLERANCE)
* **The Truth Layer:** Never implement frontend audio features without confirming the asset source has passed the Python verification script (RMS/Silence checks).
* **Defensive Audio:** Always handle `AudioContext.state` (suspended/running). Always use "Continuous Noise Beds" (never gated noise).
* **Type Safety:** No `any`. All database types must match `src/types/database.types.ts`.
* **Guest Mode:** All features must function if `User` is null. Fallback to default settings (Voice: 'Sarah', SNR: 10).

## 3. VERIFICATION LOOP
If you write a clinical algorithm (e.g., Smart Coach):
1. Write the Test Case first (Edge cases: 0% accuracy, 100% accuracy).
2. Implement the Logic.
3. Verify the Output matches `10_CLINICAL_CONSTANTS.md`.
