# Spanish Drill Audit Next Steps

## Current state
- comprehension rewrite queue is now `0`
- conversation rewrite queue is now `0`
- validator now fails only on Spanish drills
- blocked drill rows: `395`
- `pack_th_voiced_unvoiced` has now been replaced in-source by `pack_es_t_vs_d`
- `pack_s_vs_z` has now been replaced in-source by `pack_es_s_vs_f`
- `pack_p_vs_b` has now been rewritten as a Spanish-native reviewed pack
- `pack_k_vs_g` has now been rewritten as a Spanish-native reviewed pack
- `pack_f_vs_v` has now been replaced in-source by `pack_es_f_vs_b`
- redesign backlog is now `10` packs after correcting under-called English-only contrasts and clearing the /f/ vs /b/ replacement

## Reading
This is not a row-cleanup problem anymore.

The drill layer now needs to be handled in two lanes:
1. `redesign_required`
2. `clinical_review_required`

## Redesign-required packs
These pack families should not be salvaged by line editing:
- `pack_ch_vs_j`
- `pack_f_vs_v`
- `drill_pack_17`
- `drill_pack_18`
- `drill_pack_19`
- `drill_pack_20`
- `drill_pack_21`
- `drill_pack_22`
- `drill_pack_24`
- `pack_i_vs_I`
- `pack_e_vs_ae`

Reason:
- English phonology is baked into the contrast itself, not just the word choice.
- For the former `/θ/` vs `/ð/` pack, the Spanish replacement uses word-initial and medial `/t/` vs `/d/` items because word-final `/d/` is too weak and variable to anchor launch-quality discrimination work.
- For the former `/s/` vs `/z/` pack, the Spanish replacement uses initial `/s/` vs `/f/` because `/z/` is not a pan-regional launch contrast in Spanish.
- For the former `/f/` vs `/v/` pack, the Spanish replacement uses initial `/f/` vs `/b/` because English /v/-voicing logic does not survive as a pan-regional Spanish phonemic contrast.
- The audit now also treats English tense/lax vowels, orthographic `b/v`, and English-only final-consonant awareness packs as redesign work rather than line-by-line review.

## Clinical-review-required packs
The remaining packs may be salvageable, but they are still blocked because:
- drill words remain machine translated
- Spanish phoneme metadata has not been clinically reviewed at pack level
- Where English pack logic itself does not survive Spanish phonology, the audit must be corrected and the pack moved back to redesign.

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
