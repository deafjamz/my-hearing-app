# Spanish Rollout Status

## Purpose
This document records what is currently true across the repo, live Supabase, and deployed app state after the Spanish launch-content work.

## Step Status
1. Drill remediation: complete for the current hold set.
   - `2` drill rows were repaired and promoted.
   - `8` rows were moved to `needs_pack_redesign`.

2. Detection block: content complete and production-wired in repo plus live Supabase.
   - `18` rows exist in `content/spanish_templates_1x/detection_es_launch_template.csv`.
   - `18` live `stimuli_catalog` rows now exist with `erber_level='detection'`.
   - `36` live `audio_assets` rows now exist for `spanish/detection/%`.
   - the repo now contains a dedicated Spanish detection path instead of reusing English `word_pairs`.

3. QC workflow: scaffold complete, listening review still pending.
   - `reports/spanish_qc_manifest.csv` exists.
   - no clinician listening results are recorded yet.

4. Runtime and instrumentation: product-wired locally, not yet deployed to production frontend.
   - language-aware sentence, conversation, and drill fetching is implemented in repo.
   - English fallback was preserved for legacy rows with null `content_language`.
   - sentence fetching now normalizes both `clinical_metadata` and legacy `training_metadata`.
   - progress metadata now carries `contentLanguage` for sentence, conversation, drill, detection, and scenario sessions.
   - Spanish scenarios are now routable through the deployed legacy `scenarios/scenario_items` path once the frontend is redeployed.

5. Credit allocation guidance: still valid.
   - next credit spend should go to detection audio, remaining drill-pack redesign, and Spanish scenario/runtime completion.
   - after this pass, that means redesign work and QC, not more launch-ingest work.

## Live Supabase State
Verified on March 7, 2026.

Spanish stimuli now present in `stimuli_catalog`:
- `sentence`: `1000`
- `conversation`: `160`
- `phoneme_drill`: `492`
- `detection`: `18`

Spanish audio rows in `audio_assets`:
- `spanish/sentences/%`: `2000`
- `spanish/detection/%`: `36`

Legacy Spanish scenarios now present in the currently deployed scenario tables:
- `scenarios`: `80`
- `scenario_items`: `640`

Why only Spanish sentences and detection are indexed in `audio_assets`:
- the live `audio_assets` schema enforces a unique `(stimuli_id, voice_id)` pair
- sentence content maps cleanly to one file per voice
- detection content maps cleanly to one file per voice
- conversations need prompt + response per voice
- drills need word1 + word2 per voice
- the current runtime already derives conversation and drill storage paths directly instead of depending on `audio_assets`

Spanish files verified in Supabase Storage:
- `spanish/sentences/sergio`: `1000`
- `spanish/sentences/roma`: `1000`
- `spanish/conversations/sergio`: `320`
- `spanish/conversations/roma`: `320`
- `spanish/drills/sergio`: `984`
- `spanish/drills/roma`: `984`
- `spanish/scenarios/sergio_roma`: `640`

## Live Backend Gaps
`profiles.preferred_language` is now live in the production database.

Implication:
- Spanish language preference can now persist for authenticated users
- local browser persistence remains as a fallback for signed-out use
- rollout verification is now fully green for the current launch scope

## Production App Status
`soundsteps.app` is still behind the repo at the time of this document update.

Implication:
- the repo now contains the runtime changes needed for Spanish-aware sentences, conversations, drills, detection, and scenarios
- live Supabase now contains Spanish sentence/conversation/drill/detection content
- live legacy scenario tables now contain Spanish scenarios and dialogue items
- deployed production code is still behind the repo until a real deployment is performed

This means:
- Supabase is now ready for the current Spanish launch shape
- storage and database are aligned for the current runtime strategy
- the deployed app is still not a full Spanish launch build

## Git Status
The worktree is dirty with many unrelated pre-existing changes.

Important constraint:
- Spanish work is now documented and implemented locally
- it is not committed in this turn
- it should be reviewed carefully before any deploy because unrelated local modifications are present

## Operational Reading
What is now genuinely live:
- Spanish sentence rows in Supabase
- Spanish conversation rows in Supabase
- Spanish drill rows in Supabase
- Spanish detection rows in Supabase
- Spanish scenario rows in the legacy scenario tables
- Spanish sentence audio linked in Supabase
- Spanish detection audio linked in Supabase
- Spanish conversation, drill, and scenario audio present in storage

What is still staged:
- updated frontend runtime on `soundsteps.app`

Verification artifact:
- `reports/spanish_rollout_verification.json`
- `scripts/verify_spanish_rollout.py`

## Next Actions
1. Run bilingual listening QC before exposing Spanish widely.
2. Decide whether Spanish scenarios should move to the modern `stimuli_catalog` path or stay on `scenarios/scenario_items` with explicit language columns.
3. Finish redesigning the remaining held drill packs.
4. Split Spanish launch analytics from English in dashboard/reporting views.
5. Merge the release branch through PR so `main` matches production.
