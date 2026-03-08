# Spanish Drill Audit Next Steps

## Current state
- comprehension rewrite queue is now `0`
- conversation rewrite queue is now `0`
- validator now fails only on Spanish drills
- blocked drill rows: `490`

## Reading
This is not a row-cleanup problem anymore.

The drill layer now needs to be handled in two lanes:
1. `redesign_required`
2. `clinical_review_required`

## Redesign-required packs
These pack families should not be salvaged by line editing:
- `pack_s_vs_z`
- `pack_th_voiced_unvoiced`
- `pack_ch_vs_j`
- `drill_pack_19`
- `drill_pack_20`
- `drill_pack_21`

Reason:
- English phonology is baked into the contrast itself, not just the word choice.

## Clinical-review-required packs
The remaining packs may be salvageable, but they are still blocked because:
- drill words remain machine translated
- Spanish phoneme metadata has not been clinically reviewed at pack level

The active review workspace for these packs is:
- `content/spanish_templates_1x/phoneme_drill_review_backlog.csv`
- `content/spanish_templates_1x/drill_review_workspaces/`

## Immediate order
1. Use `content/spanish_templates_1x/phoneme_drill_pack_audit.csv` as the pack backlog.
2. Use `content/spanish_templates_1x/phoneme_drill_redesign_backlog.csv` and `content/spanish_templates_1x/drill_redesign_workspaces/` as the active redesign workspace.
3. Rewrite the `redesign_required` packs first.
4. Only after pack redesign, review the salvageable packs for Spanish-native lexical replacements.
5. Promote rows to `clinically_reviewed` only after pack-level approval.

## Why this prevents recurrence
The drill audit forces planning at the pack level.
That is the correct unit for Erber-aligned discrimination work and prevents another English-to-Spanish row-translation failure.
