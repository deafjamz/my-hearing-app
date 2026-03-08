# Spanish Drill Audit Next Steps

## Current state
- comprehension rewrite queue is now `0`
- conversation rewrite queue is now `0`
- validator now passes cleanly for the Spanish drill layer
- blocked drill rows: `0`
- `pack_th_voiced_unvoiced` has now been replaced in-source by `pack_es_t_vs_d`
- `pack_s_vs_z` has now been replaced in-source by `pack_es_s_vs_f`
- `pack_p_vs_b` has now been rewritten as a Spanish-native reviewed pack
- `pack_k_vs_g` has now been rewritten as a Spanish-native reviewed pack
- `pack_f_vs_v` has now been replaced in-source by `pack_es_f_vs_b`
- `drill_pack_17` has now been replaced in-source by `pack_es_b_vs_m_initial`
- `pack_e_vs_ae` has now been replaced in-source by `pack_es_e_vs_a`
- `pack_i_vs_I` has now been replaced in-source by `pack_es_i_vs_e`
- `drill_pack_16` has now been replaced in-source by `pack_es_m_vs_n_medial`
- `drill_pack_18` has now been replaced in-source by `pack_es_i_vs_e_medial`
- `drill_pack_15` has now been rewritten as a Spanish-native reviewed /m/ vs /n/ pack
- `drill_pack_13` has now been rewritten as a Spanish-native reviewed /l/ vs /r/ initial pack
- `pack_t_vs_d` has now been rewritten as a Spanish-native reviewed companion /t/ vs /d/ pack
- the remaining English-shaped `/ʃ/`, palatal, coda, diphthong, and mixed-review families have now been retired into `pack_es_generalization_a` through `pack_es_generalization_l`
- redesign backlog is now `0` packs
- clinical-review backlog is now `0` packs

## Reading
The drill layer is no longer blocked.

The launch-safe remediation ended up using two paths:
1. Direct Spanish-native rewrites where the auditory goal survived Spanish phonology.
2. Retirement of English-shaped families into validated Spanish generalization packs when a direct Spanish analogue would have been forced, sparse, or dialect-fragile.

That was the correct decision for launch quality.

Reason:
- English phonology was baked into several original pack families, not just the row wording.
- For the former `/θ/` vs `/ð/` pack, the Spanish replacement uses word-initial and medial `/t/` vs `/d/` items because word-final `/d/` is too weak and variable to anchor launch-quality discrimination work.
- For the former `/s/` vs `/z/` pack, the Spanish replacement uses initial `/s/` vs `/f/` because `/z/` is not a pan-regional launch contrast in Spanish.
- For the former `/f/` vs `/v/` pack, the Spanish replacement uses initial `/f/` vs `/b/` because English /v/-voicing logic does not survive as a pan-regional Spanish phonemic contrast.
- For the remaining `/ʃ/`, palatal, coda, diphthong, and mixed-review families, forcing one-to-one Spanish analogues would have produced lower-quality launch content than a validated generalization strategy.
- The final generalization packs use only previously clinically reviewed Spanish rows, so the remediation preserved launch safety instead of inventing brittle late-stage content.

## Generalization decision
The following English-shaped families were retired rather than forced:
- `pack_s_vs_sh`
- `pack_ch_vs_j`
- `drill_pack_11`
- `drill_pack_12`
- `drill_pack_14`
- `drill_pack_19`
- `drill_pack_20`
- `drill_pack_21`
- `drill_pack_22`
- `drill_pack_23`
- `drill_pack_24`
- `drill_pack_25`

These are now represented by `pack_es_generalization_a` through `pack_es_generalization_l`.
Those packs are built from already approved Spanish contrasts and function as higher-tier discrimination/generalization work instead of false English-to-Spanish mirror packs.

## Immediate order
1. Use `content/spanish_templates_1x/phoneme_drill_pack_audit.csv` as the pack backlog.
2. Use `content/spanish_templates_1x/phoneme_drill_redesign_backlog.csv` and `content/spanish_templates_1x/drill_redesign_workspaces/` as the active redesign workspace.
3. Keep the redesign and review backlogs at `0` as a release invariant.
4. Run bilingual listening QC on generated audio before treating these packs as public-launch ready.
5. Only promote from `clinically_reviewed` to `approved_for_launch` after audio QC, not just text QC.

## Why this prevents recurrence
The drill audit forces planning at the pack level.
That is the correct unit for Erber-aligned discrimination work and prevents another English-to-Spanish row-translation failure.
The redesign and review workspace generators now also support a true zero-backlog state instead of crashing when remediation is complete.
