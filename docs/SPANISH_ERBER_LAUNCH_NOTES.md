# Spanish Launch Notes (Erber-First)

## Status
- Decision executed: Spanish launch corpus generated at **1:1 ratio** with **2 voices**.
- Generation mode executed in **strict clinical mode** and then refined after drill remediation:
  - included: sentences, conversations, scenarios, launch-safe drills
  - excluded from launch audio: drill rows marked `needs_pack_redesign`
- Live Supabase accounting now exists for Spanish:
  - `stimuli_catalog`: sentences, conversations, drills, detection
  - `audio_assets`: sentence and detection audio
  - conversations and drills remain storage-derived in runtime, not `audio_assets`-indexed
- live legacy `scenarios/scenario_items` tables now carry Spanish scenarios for the existing runtime path
- production deployment is now live on `soundsteps.app`
- `profiles.preferred_language` is now live in the production database
- Completion report: `docs/SPANISH_STRICT_GENERATION_REPORT.md`
- Rollout verifier: `scripts/verify_spanish_rollout.py`

## Decision
- Execute Spanish at **1:1 corpus ratio** with **2 voices** (1 male, 1 female).
- Keep clinical rigor as primary constraint; engagement choices are secondary.
- Do not ship questionable drill contrasts just to increase corpus size.

## Selected Voices (Quality-Gated)
- Male: `Sergio` (`SHkfxEDcLXK31yPii5xM`, es-CO)
- Female: `Roma` (`6Mo5ciGH5nWiQacn5FYk`, es-AR)

Both pass current launch quality gates:
- HNR >= 10.0
- Jitter <= 0.02
- Shimmer <= 0.11
- Voiced fraction >= 0.55
- F0 in CI-target ranges

Selection intent:
- high intelligibility before personality
- broad Spanish usability over heavy regional stylization
- consistent quality across short drills and longer comprehension material

## Erber Mapping (Launch)
- **Detection (L1):** Content block designed, generated, ingested, and wired in repo.
- **Discrimination (L2):** Phoneme drills and minimal-pair contrasts remain core, with off-brand English carryovers held back for pack redesign.
- **Identification (L3):** Word-level forced-choice logic and sentence-level prompts carry over from English structure.
- **Comprehension (L4):** Sentences, conversations, and scenarios keep the largest share of launch audio.

Launch implication:
- Spanish now covers strong L2-L4 launch content in generated assets.
- repo coverage now spans L1-L4 with the current launch corpus.
- the missing production piece is frontend deployment, not corpus generation.
- Spanish still is not fully complete as a clinical program because held drill packs need redesign and bilingual listening QC is still pending.

## Cultural Adaptation Rules (Clinical-Safe)
- Prefer high-frequency, pan-regional vocabulary; avoid slang-heavy regionalisms at launch.
- Keep scenario familiarity high:
  - farmacia
  - mercado or supermercado
  - clinica
  - transporte publico
  - llamadas and mensajes de voz
  - reuniones familiares
- Include realistic listening contexts for transfer:
  - multi-speaker family table talk
  - pharmacy counter with queue noise
  - bus or metro announcements
  - restaurant ordering in moderate babble
- Maintain foil quality in Spanish:
  - acoustic foils must remain phonetically confusable in Spanish
  - semantic foils must remain plausible in local context
  - direct English foil translation is not acceptable if it weakens contrast integrity

## Translation Quality Bar
- No direct literal translation when it weakens phoneme contrast.
- Preserve target contrast intent first, then naturalness.
- Require bilingual clinical review on:
  - phoneme target integrity
  - foil validity
  - difficulty progression consistency
- Treat `needs_pack_redesign` as a hold state, not as launch-ready content.

## Spend Envelope (Current Month)
- 1:1 two-voice projection with 15% retry headroom: **189,278 credits**
- Monthly remaining after this plan (475,000 total): **285,722 credits**

Actual execution note:
- strict Spanish production completed without spending credits on pack-redesign rows
- remaining monthly credits should be prioritized for clinically stronger additions, not filler content

## Source Artifacts
- `content/spanish_templates_1x/spanish_launch_manifest.json`
- `content/spanish_templates_1x/spanish_execution_manifest.json`
- `content/spanish_templates_1x/translation_summary.json`
- `content/spanish_templates_1x/translation_cache_es.json`
- `content/spanish_templates_1x/phoneme_drills_pack_redesign_queue.csv`
- `reports/spanish_voice_benchmark_deep.md`
- `reports/spanish_generation_results.json`
- `reports/spanish_ingest_plan.json`
- `docs/SPANISH_STRICT_GENERATION_REPORT.md`
- `docs/SPANISH_ROLLOUT_STATUS.md`
