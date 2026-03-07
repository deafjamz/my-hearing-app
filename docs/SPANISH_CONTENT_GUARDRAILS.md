# Spanish Content Guardrails

## Why this exists
The original Spanish launch pipeline mirrored English structure and then translated it.
That was fast, but it is not clinically strong enough for a world-class aural rehab product.

The failure mode was structural:
- English drill packs were sampled by ratio and retained their English contrast logic.
- machine translation was allowed to populate clinically sensitive Spanish fields.
- row-level review caught obvious collapses, but did not stop pack-level phonology mismatches.
- ingestion still treated `machine_translated` Spanish drills as launch-safe.

Result:
- several Spanish drill packs remained English-shaped
- some Spanish sentence and conversation foil sets collapsed after translation
- audio generation and ingest could proceed without a true Spanish clinical gate

## Root Cause
1. Source design inherited English auditory logic instead of authoring for Spanish.
2. Translation status was treated as an operational label, not a launch-safety gate.
3. Review was row-oriented when the real risk lived at the pack and foil-system level.
4. Source Spanish templates and queue files were not reliably part of the repo workflow.

## Launch Rules Going Forward
1. Spanish drills must never be launch-generated or ingested from `machine_translated` rows.
2. Only `clinically_reviewed` and `approved_for_launch` drill rows are launch-safe.
3. A Spanish drill pack must be approved at the pack level before any of its rows are treated as launch content.
4. Spanish comprehension foils must remain distinct after normalization. If `correct_answer_es` collapses to any foil, the item is blocked.
5. Validation must run before audio generation and before Supabase ingest.

## Required Workflow
1. Author or revise Spanish source templates.
2. Run `python3 scripts/build_spanish_review_queues.py`.
3. Run `python3 scripts/build_spanish_rewrite_queues.py`.
4. Run `python3 scripts/validate_spanish_launch_content.py --templates-dir <dir>`.
5. Resolve all validation errors.
6. Generate audio only after validation is clean.
7. Run bilingual listening QC on generated assets.
8. Ingest only validated, reviewed content.

## Source Of Truth
The current Spanish launch source of truth lives in:
- `content/spanish_templates_1x/`

That directory should carry:
- launch templates
- execution manifests
- drill redesign queues
- sentence and conversation foil rewrite queues

Derived caches should stay out of the source-of-truth path.

## Governance Standard
For Spanish content, the unit of approval is:
- detection block
- drill pack
- foil set
- scenario/dialogue flow

Not just an individual translated row.

## Current Clinical Reading
- Spanish detection is directionally sound.
- Spanish drills need pack-level redesign wherever English phonology drove the source contrast.
- Spanish sentences and conversations need foil review where translation erased the auditory task.

Current queued rewrite scope from the versioned source set:
- `96` sentence rows in `sentences_foil_rewrite_queue.csv`
- `5` conversation rows in `conversations_foil_rewrite_queue.csv`
- `8` drill rows in `phoneme_drills_pack_redesign_queue.csv`

## Non-Negotiable Prevention
If Spanish source content is not versioned, reviewed, validated, and blocked by code when weak, this failure will recur.
