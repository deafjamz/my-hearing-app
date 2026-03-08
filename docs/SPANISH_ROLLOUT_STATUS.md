# Spanish Rollout Status

## Purpose
This document records what is currently true across the repo, live Supabase, and deployed app state after the Spanish launch-content work.

Verified and updated on March 8, 2026 after Spanish drill remediation, audio refresh, live Supabase apply, rollout re-verification, and launch-surface gating on `main`.

## Step Status
1. Drill remediation: complete for the current launch corpus.
   - `500` Spanish drill rows now exist in the canonical template and are marked `approved_for_launch`.
   - pack-level redesign and review backlogs are now empty.
   - the drill layer is no longer blocked by machine-translated or English-shaped launch rows.

2. Detection block: content complete and production-wired in repo plus live Supabase.
   - `18` rows exist in `content/spanish_templates_1x/detection_es_launch_template.csv`.
   - `18` live `stimuli_catalog` rows now exist with `erber_level='detection'`.
   - `36` live `audio_assets` rows now exist for `spanish/detection/%`.
   - the repo now contains a dedicated Spanish detection path instead of reusing English `word_pairs`.

3. QC workflow: automated generation and storage validation complete, human review packet ready.
   - Spanish drill audio was fully regenerated after remediation
   - automated drill storage and duration audit passed at `2000 / 2000` files with `0` sampled duration flags
   - deterministic human bilingual listening packet generated at `reports/spanish_listening_qc_packet.csv`
   - current launch-readiness status is recorded in `reports/spanish_launch_readiness.json`
   - human bilingual listening review is still the final gate before broad external exposure

4. Runtime, instrumentation, and launch-surface gating: deployed and production-wired.
   - language-aware sentence, conversation, and drill fetching is implemented in repo.
   - English fallback was preserved for legacy rows with null `content_language`.
   - sentence fetching now normalizes both `clinical_metadata` and legacy `training_metadata`.
   - progress metadata now carries `contentLanguage` for sentence, conversation, drill, detection, and scenario sessions.
   - Spanish scenarios are routable through the deployed legacy `scenarios/scenario_items` path.
   - first-visit onboarding can now select Spanish before the first session.
   - Spanish users no longer see English-only launch blockers in the shared activity hub.
   - dashboard recommendations and today-plan generation now use the selected language instead of mixed-language history.

5. Credit allocation guidance: updated.
   - drill remediation and launch-safe drill audio are complete for the current corpus
   - next credit spend should go to Spanish scenario/runtime alignment, additional clinically authored Spanish content, and human listening QC sampling rather than more salvage work on this launch drill set

## Live Supabase State
Verified on March 7, 2026.

Spanish stimuli now present in `stimuli_catalog`:
- `sentence`: `1000`
- `conversation`: `160`
- `phoneme_drill`: `500`
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
- `spanish/drills/sergio`: `1000`
- `spanish/drills/roma`: `1000`
- `spanish/scenarios/sergio_roma`: `640`

## Live Backend Gaps
`profiles.preferred_language` is now live in the production database.

Implication:
- Spanish language preference can now persist for authenticated users
- local browser persistence remains as a fallback for signed-out use
- rollout verification is now fully green for the current launch scope

## Production App Status
`soundsteps.app` is aligned with the merged release branch for the current rollout slice.

Implication:
- the repo contains the runtime changes needed for Spanish-aware sentences, conversations, drills, detection, and scenarios
- live Supabase contains Spanish sentence/conversation/drill/detection content
- live legacy scenario tables contain Spanish scenarios and dialogue items
- deployed production code matches that runtime state

This means:
- Supabase is now ready for the current Spanish launch shape
- storage and database are aligned for the current runtime strategy
- the deployed app is operationally aligned with the repo
- the main remaining risk is Spanish content validity, especially drills and translated foil logic

## Git Status
`main` now contains the merged Spanish rollout runtime via PR `#1`.

Important constraint:
- the primary local checkout may still contain unrelated dirty changes
- use a clean worktree for follow-on rollout and content-hardening work

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
- human bilingual listening QC signoff
- Spanish scenario migration to the modern `stimuli_catalog` path, or an explicit decision to keep them on `scenarios/scenario_items`
- future Spanish expansion beyond the current launch corpus

Verification artifact:
- `reports/spanish_rollout_verification.json`
- `scripts/verify_spanish_rollout.py`
- `docs/SPANISH_LAUNCH_PRODUCT_AUDIT.md`

## Next Actions
1. Run targeted human bilingual listening QC using `reports/spanish_listening_qc_packet.csv`, `reports/spanish_listening_qc_packet.html`, and `docs/SPANISH_LISTENING_QC_PROTOCOL.md`.
2. Decide whether to ship Spanish launch with the current scoped activity set or expand into Spanish placement / stories / word-pair tracks before wider promotion.
3. Keep repo-level validation blocking any future Spanish audio generation or ingest.
4. Decide whether Spanish scenarios should move to the modern `stimuli_catalog` path or stay on `scenarios/scenario_items` with explicit language columns.
5. Add post-launch Spanish analytics slices that isolate completion, repeat rate, and error clusters from English.
