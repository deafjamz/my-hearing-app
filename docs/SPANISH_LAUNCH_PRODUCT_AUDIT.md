# Spanish Launch Product Audit

## Purpose
This document answers the practical launch question after the Spanish content remediation:

- does Spanish need additional infrastructure to launch?
- do menus and onboarding need changes?
- does the data engine or question logic need language-specific work?
- does scoring need to change?

Short answer:
- **yes** for launch-surface gating and onboarding
- **yes** for language-aware recommendation/planning logic
- **no** for a brand-new scoring formula right now
- **not yet** for major backend re-architecture beyond the known scenario-table debt

## Current Position
Spanish content is now strong enough to justify product-level support:
- detection: live
- sentences: live
- conversations: live
- drills: live and remediated
- scenarios: live through the current legacy runtime path

The main risk moved from content generation to product coherence:
- a Spanish user should not be routed into English-only activities
- a Spanish user should not inherit English placement logic by accident
- recommendations and daily plans should be based on Spanish trials when the user is in Spanish mode

## What Was Missing
Before the latest product audit pass, Spanish had four real launch-surface problems:

1. English-only onboarding
- first-time users were routed into the English placement check regardless of Spanish intent

2. English-only activities still visible in the shared practice hub
- word pairs
- gross discrimination
- category practice
- stories

3. Mixed-language recommendation and planning logic
- dashboard recommendations
- today’s practice plan
- placement fallback

4. Ambiguous Spanish positioning in settings
- Spanish was presented as still “in progress” even though the core corpus is now launch-safe

## What Is Now Fixed
The repo now has launch-safe Spanish gating in the product shell:

1. Welcome and first-session path
- first-visit welcome screen now lets the user choose English or Spanish before starting
- Spanish first sessions now route to core listening practice instead of the English placement flow

2. Practice hub menus
- Spanish users no longer see English-only launch blockers:
  - word pairs
  - gross discrimination
  - category practice
  - stories

3. Daily plan and dashboard logic
- dashboard analytics and recommendations now use the selected language
- today’s practice plan now uses language-filtered analytics
- Spanish plans no longer consume the English placement result as a baseline

4. Settings copy
- Spanish is now described as a launch-ready core corpus, not a vague work in progress

## Remaining Launch Gaps
These are the real remaining product gaps, in severity order.

### 1. Human bilingual listening QC is still pending
This is still the final launch gate.

Operationally:
- automated checks are green
- readiness is `ready_pending_human_qc`

Artifacts:
- `reports/spanish_listening_qc_packet.csv`
- `reports/spanish_listening_qc_packet.html`
- `reports/spanish_launch_readiness.json`

### 2. Spanish does not yet have a true placement assessment
Current state:
- English has a placement check
- Spanish now bypasses it and starts with detection/core practice

Launch implication:
- acceptable for initial launch if framed as a guided start
- not ideal for long-term clinical personalization

Recommendation:
- build a dedicated Spanish placement flow after launch
- do not reuse the English word-pair-heavy placement logic

### 3. App chrome is still mostly English
The core routing now respects Spanish, but general UI copy is still largely English:
- hub headings
- dashboard labels
- legal/settings shells
- some list headers and empty states

Launch implication:
- this is a polish and trust issue, not a hard technical blocker
- it matters if Spanish is marketed as a first-class language at launch

Recommendation:
- translate the activity-shell copy for Spanish-facing routes before broader promotion

### 4. Some localized labels still come from raw metadata
Examples:
- conversation categories may still surface internal or English-shaped category labels
- drill pack names may still reflect source metadata style rather than polished Spanish-facing naming

Launch implication:
- content may be clinically valid while still looking unfinished in list views

Recommendation:
- add display-label localization for pack/category names instead of exposing raw metadata directly

### 5. Scenarios still run on legacy tables
This is known debt, not a new Spanish-specific failure.

Current state:
- works in production
- relies on `scenarios/scenario_items` plus the Spanish scenario catalog

Launch implication:
- acceptable for launch
- not the right long-term architecture

Recommendation:
- keep as-is for launch
- migrate to the modern stimuli path later, deliberately

## Data Engine Assessment
### What does not need a redesign right now
- sentence scoring
- conversation scoring
- drill scoring
- progress logging structure

Reason:
- all of these already operate on generic correct/incorrect response logic
- `contentLanguage` is now logged and usable for segmentation
- the analytics layer already supports English/Spanish filtering

### What did need correction
- recommendation generation
- daily-plan generation
- placement fallback behavior

Those have now been corrected to be language-aware.

## Question Logic Assessment
### Good enough for launch
- sentence question/foil logic
- conversation keyword/foil logic
- drill pair logic after pack redesign

### Still intentionally out of scope
- Spanish word-pair category practice
- Spanish gross discrimination
- Spanish stories
- Spanish placement testing

This is not a bug if the product surface makes the scope clear.

## Scoring Assessment
No new Spanish-specific scoring engine is required for launch.

Why:
- correctness is language-agnostic at the interaction layer
- the clinical burden was in content validity, not formula math
- language-aware analytics are already present

What to watch after launch:
- whether Spanish drills are materially easier or harder than English at the same nominal difficulty
- whether Spanish sentence/comprehension accuracy bands require different mastery thresholds after real-user data appears

That is a calibration question for post-launch analytics, not a pre-launch blocker.

## Launch Positioning Options
Detailed scope-positioning options, tradeoffs, and ElevenLabs credit recommendations are documented in `docs/SPANISH_LAUNCH_DECISION_OPTIONS.md`.

## Launch Recommendation
Spanish is launchable when:
1. human bilingual listening QC is complete and clean
2. the launch surface continues hiding English-only Spanish blockers
3. Spanish is marketed as a **core launch track**, not as total feature parity with English

Recommended positioning:
- Spanish launch includes detection, sentences, conversations, drills, and scenarios
- some English-only experiences remain intentionally out of scope for the first Spanish release

That is an acceptable launch shape for a clinical-first product if you are explicit and disciplined about scope.
