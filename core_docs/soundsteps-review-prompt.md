# Claude Code Review Prompt — SoundSteps

Review this plan thoroughly before making any code changes. For every issue or recommendation, explain the concrete tradeoffs, give me an opinionated recommendation, and ask for my input before assuming a direction.

## My engineering preferences (use these to guide your recommendations):

- DRY is important—flag repetition aggressively.
- Well-tested code is non-negotiable; I'd rather have too many tests than too few.
- I want code that's "engineered enough" — not under-engineered (fragile, hacky) and not over-engineered (premature abstraction, unnecessary complexity).
- I err on the side of handling more edge cases, not fewer; thoughtfulness > speed.
- Bias toward explicit over clever.
- This is a solo dev project targeting launch — pragmatism over perfection, but don't let me ship something embarrassing.

## 1. Architecture review

Evaluate:

- Overall system design and component boundaries.
- Supabase integration patterns (auth, storage, database) — are they clean and consistent?
- Data flow between frontend, Supabase, and any audio file handling.
- Coupling concerns — can I change one part without breaking others?
- Security architecture (auth flows, row-level security, API boundaries, storage access rules).

## 2. Code quality review

Evaluate:

- Code organization and module structure.
- DRY violations—be aggressive here.
- Error handling patterns and missing edge cases (call these out explicitly).
- Technical debt hotspots — anything that will bite me in the first month post-launch.
- Areas that are over-engineered or under-engineered relative to my preferences.

## 3. Deployment readiness review

Evaluate:

- Environment configuration — are env vars, secrets, and config cleanly separated?
- Build and deploy pipeline — any fragile steps or manual processes that could break a release?
- Error states real users will hit — what happens on bad network, expired auth, missing data?
- Auth edge cases — token refresh, session expiry, account states (new user, returning user, password reset).
- Database migrations and schema state — anything that could go wrong on first deploy or future updates?
- Supabase storage configuration — bucket policies, file access patterns, signed URLs vs public.

## 4. User-facing edge cases review

Evaluate:

- Audio playback reliability — what happens on slow connections, interrupted downloads, unsupported formats?
- Offline or degraded network behavior — does the app fail gracefully or just break?
- Loading states and error feedback — does the user always know what's happening?
- Data integrity — can a user get into a broken state (half-saved progress, orphaned records, stale cache)?
- Accessibility — are there any obvious issues given this is a hearing rehabilitation app (this is especially important for this audience)?

## For each issue you find

For every specific issue (bug, smell, design concern, or risk):

- Describe the problem concretely, with file and line references.
- Present 2–3 options, including "do nothing" where that's reasonable.
- For each option, specify: implementation effort, risk, impact on other code, and maintenance burden.
- Give me your recommended option and why, mapped to my preferences above.
- Then explicitly ask whether I agree or want to choose a different direction before proceeding.

## Workflow and interaction

- Do not assume my priorities on timeline or scale.
- After each section, pause and ask for my feedback before moving on.
- Be direct — don't hedge with "you might consider" when you mean "this is a problem." I want honest assessments, not diplomacy.

---

## BEFORE YOU START

Ask if I want one of three options:

**1/ BIG REVIEW:** Work through this interactively, one section at a time (Architecture → Code Quality → Deployment Readiness → User-Facing Edge Cases) with at most 4 top issues in each section.

**2/ SMALL REVIEW:** Work through interactively ONE question per review section.

**3/ TRIAGE:** Scan everything, rank the top 10 issues by severity across all sections, then I pick which ones to dive into.

## FOR EACH STAGE OF REVIEW

Output the explanation and pros and cons of each stage's questions AND your opinionated recommendation and why, and then use AskUserQuestion. Also NUMBER issues and then give LETTERS for options and when using AskUserQuestion make sure each option clearly labels the issue NUMBER and option LETTER so the user doesn't get confused. Make the recommended option always the 1st option.
