# Content Strategy & Architecture

## 1. Asset Hierarchy (Erber's Model)
All content is organized by clinical difficulty:
- **Level 1: Discrimination (Word Pairs)**
    - Focus: Minimal Pairs (Voicing, Manner, Place).
    - Asset ID: `pair_{category}_{wordA}_{wordB}` (e.g., `pair_voicing_bear_pear`)
- **Level 2: Identification (Sentences)**
    - Focus: SPIN (Speech Perception in Noise).
    - Asset ID: `sent_{predictability}_{keyword}` (e.g., `sent_high_dog_bark`)
- **Level 3: Comprehension (Stories)**
    - Focus: Narrative Tracking.
    - Asset ID: `story_{topic}_{difficulty}`

## 2. Directory Structure (`public/audio/`)
We do NOT dump files in one folder. We use a faceted structure for "Matrix" access:
