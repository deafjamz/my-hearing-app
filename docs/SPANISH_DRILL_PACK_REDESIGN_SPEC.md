# Spanish Drill Pack Redesign Spec

## Why this exists
The original Spanish hold queue understated the real problem.

The issue is not only `8` bad rows.
Several whole Spanish drill packs are still shaped around English phonology and machine-translated lexical items, which is not clinically strong enough for a pan-regional Spanish rehab product.

## What I verified
The following pack families still contain English-shaped contrast logic in the local Spanish template set:

| Current Pack ID | Current Label | Why it fails in Spanish | Recommended Spanish-native replacement |
| --- | --- | --- | --- |
| `pack_s_vs_z` | `Voicing: /s/ vs /z/` | `/z/` is not a stable phonemic target pan-regionally in Spanish | replace with `/s/ vs /f/` or `/s/ vs /x/` after clinical choice |
| `pack_th_voiced_unvoiced` | `Voicing: /θ/ vs /ð/` | English dental-fricative voicing contrast does not transfer pan-regionally | replace with `/t/ vs /d/` or `/l/ vs /r/` depending intended difficulty band |
| `pack_ch_vs_j` | `Voicing: /tʃ/ vs /dʒ/` | `/dʒ/` is not the right Spanish counterpart | replace with `/tʃ/ vs /ʝ/` |
| `drill_pack_19` | `Vowel Height Back: /ʊ/ vs /uː/ Medial` | English tense/lax back-vowel logic does not map to Spanish vowel system | replace with `/o/ vs /u/` |
| `drill_pack_20` | `Diphthong Contrasts: /aɪ/ vs /ɔɪ/ Medial` | English diphthong inventory does not transfer cleanly | replace with a Spanish diphthong contrast such as `/ai/ vs /ei/` or `/ai/ vs /oi/` |
| `drill_pack_21` | `Affricate/Fricative: /tʃ/ vs /ʃ/ Initial` | `/ʃ/` is not pan-regional enough for launch | replace with `/tʃ/ vs /s/` or keep affricate contrast with `/tʃ/ vs /ʝ/` |

## Recommended replacement pack set

### 1. `/s/ vs /f/` initial and final fricative contrast
- Clinical goal: high-salience fricative distinction without relying on non-panregional `/z/`
- Candidate anchors:
  - `sopa` / `foca`
  - `sello` / `fello` is not acceptable; use real-word pairs only
- Design rule: prioritize real words over perfect minimality

### 2. `/t/ vs /d/` initial alveolar stop contrast
- Clinical goal: stable voicing contrast with high transfer value
- Candidate anchors:
  - `tía` / `día`
  - `tasa` / `dasa` is not acceptable; avoid pseudo-words at launch
- Design rule: everyday lexical items, initial position first

### 3. `/tʃ/ vs /ʝ/` initial affricate/palatal contrast
- Clinical goal: Spanish-native consonant contrast that preserves affricate discrimination work
- Candidate anchors:
  - `chapa` / `yapa`
  - `chico` / `yico` is not acceptable; avoid non-words
- Design rule: bilingual clinical review required because regional realizations vary

### 4. `/o/ vs /u/` medial vowel contrast
- Clinical goal: replace English tense/lax back-vowel logic with a real Spanish vowel-height contrast
- Candidate anchors:
  - `copa` / `cupa` only if lexical validity is preserved
  - `mono` / `muno` is not acceptable
- Design rule: may need near-minimal word pairs and sentence frame support

### 5. `/ai/ vs /ei/` or `/ai/ vs /oi/` diphthong contrast
- Clinical goal: preserve dynamic vowel-glide listening work in a Spanish-valid way
- Candidate anchors:
  - likely phrase-level or morphologically contrasted items rather than pure word pairs
- Design rule: this pack may need broader redesign than a simple lexical swap

### 6. `/tʃ/ vs /s/` initial affricate/fricative contrast
- Clinical goal: retain burst-vs-frication discrimination with a pan-regional fricative target
- Candidate anchors:
  - `chino` / `sino`
  - `chata` / `sata` is not acceptable
- Design rule: accept near-minimal pairs when the auditory contrast stays strong and the vocabulary remains natural

## Release recommendation
Do not silently patch these packs row-by-row.

The correct release bar is:
1. choose the Spanish-native replacement contrast at pack level
2. relabel the pack clinically
3. rebuild the full row set for that pack
4. regenerate audio
5. rerun bilingual listening QC before production use

## Current blocker
The local Spanish template files that would need direct row rewrites are not currently versioned on the release branch.

Implication:
- I can commit the redesign spec and analytics work safely
- I should not rewrite or regenerate these packs in branch history until you confirm whether the local-only Spanish template set should be brought into version control

## Decision needed
Choose one:
1. bring the Spanish template source files into git, then I will rewrite the invalid packs properly
2. keep them local-only for now, and I will leave this as a tracked redesign spec plus production caution
