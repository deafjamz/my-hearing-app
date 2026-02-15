# Clinical Babble Generation: The Corrected Approach

## 🚨 Critical Correction Made

**Initial Error:** Suggested using ElevenLabs Sound Effects API for multi-talker babble.

**Problem:** Sound Effects generate unpredictable volume spikes (laughs, plate drops, pauses) that destroy SNR calibration accuracy.

**Corrected Approach:** Use Speech Synthesis API + manual mixing for controlled, consistent babble.

---

## Why Speech Synthesis > Sound Effects for Babble

### The Math Problem:
```
SNR = 10 * log₁₀(Signal_Power / Noise_Power)

If Noise has volume spike at t=5.0s:
- User hears word at +10 dB SNR
- Plate drops at t=5.1s → Noise spikes to -10 dB
- Same word now perceived at -5 dB SNR
- User's score becomes meaningless
```

### The Clinical Problem:
- QuickSIN, WIN, HINT tests use **controlled babble** with consistent RMS
- Published norms assume ±1 dB variation max
- Volume spikes invalidate comparison to research literature
- Can't claim "clinical-grade" with inconsistent noise

### The Solution:
Generate 6 voices reading neutral text → Mix together → Normalize RMS

**Result:** Mathematically accurate, reproducible, clinically valid babble.

---

## The Babble Builder: Technical Specification

### Script: `generate_babble.py`

#### Voice Selection (ElevenLabs Premium):
**Male Voices:**
- Arnold (VR6AewLTigWG4xSOukaG) - Deep, authoritative
- Adam (pNInz6obpgDQGcFmaJgB) - Clear, balanced
- Sam (yoZ06aMxZJJ28mfd3POQ) - Conversational

**Female Voices:**
- Sarah (EXAVITQu4vr4xnSDxMaL) - Professional, clear
- Rachel (21m00Tcm4TlvDq8ikWAM) - Calm, narrative
- Elli (MF3mGyEYCl7XYWbV9V6O) - Natural, friendly

**Why 6 voices?**
- Research shows 4-12 talkers optimal for babble
- 6 = balance of complexity vs. processing time
- 3M + 3F = spectral diversity (male 85-180 Hz, female 165-265 Hz)

#### Text Corpus: Neutral Content
**Requirement:** Semantically boring to prevent contextual interference

**Source:** Lorem Ipsum variants (Latin text derivatives)

**Why not real English?**
- "The dog ran fast" → User might parse "dog" subconsciously
- Lorem Ipsum → No semantic content = pure phonetic masking

**Alternative:** Wikipedia excerpts on boring topics (geology, textile manufacturing)

#### Generation Process:
```python
1. Split neutral text into 6 segments (one per voice)
2. Generate 60 seconds of speech per voice via ElevenLabs TTS
3. Load all 6 MP3 files
4. Reduce each track volume by -6 dB (prevents clipping when mixed)
5. Overlay all 6 tracks simultaneously
6. Export as single MP3
7. Normalize final RMS to -20 dB FS
8. Validate spectral characteristics
```

#### Audio Processing Pipeline:
```
ElevenLabs TTS API
    ↓ (6 requests)
6 individual MP3 files
    ↓ (PyDub overlay)
Raw mixed babble (variable RMS)
    ↓ (Librosa normalization)
Normalized babble (-20 dB RMS)
    ↓ (Spectral validation)
Clinical-grade babble
    ↓ (Upload)
Supabase Storage
```

---

## Clinical Validation Checklist

### ✅ **Perceptual Validation:**
- [ ] Play to audiologist
- [ ] Confirm: Zero intelligible words
- [ ] Rate naturalness (1-5 scale)
- [ ] Compare to QuickSIN sample babble

### ✅ **Objective Metrics:**
- [ ] RMS: -20 ± 0.5 dB FS
- [ ] Spectral Centroid: 300-3000 Hz (speech range)
- [ ] Spectral Rolloff: < 8000 Hz
- [ ] Zero clipping artifacts

### ✅ **Pilot Testing:**
- [ ] Test with 5 CI users
- [ ] Measure comprehension at +5, +10, +15 dB SNR
- [ ] Compare to QuickSIN published norms (±5% acceptable)

---

## Usage Instructions

### Install Dependencies:
```bash
pip3 install librosa soundfile pydub --break-system-packages
```

### Generate Babble:
```bash
# Generate 60-second babble (default)
python3 scripts/generate_babble.py

# Generate and upload to Supabase
python3 scripts/generate_babble.py --upload

# Custom duration
python3 scripts/generate_babble.py --duration 120
```

### Expected Output:
```
Clinical-Grade Multi-Talker Babble Generator
============================================================

[1/6] Generating speech for Arnold...
   ✅ Generated Arnold
[2/6] Generating speech for Adam...
   ✅ Generated Adam
...
[6/6] Generating speech for Elli...
   ✅ Generated Elli

🎚️ Mixing 6 voices into babble...
   ✅ Mixed duration: 60.0 seconds

📊 Normalizing RMS to -20.0 dB FS...
   ✅ RMS: -18.3 dB → -20.0 dB (Gain: -1.7 dB)

🔬 Validating spectral characteristics...
   ✅ Spectral Centroid: 1247 Hz (Expected: 300-3000 Hz)
   📊 Spectral Rolloff: 5832 Hz

✅ Babble generated: babble_6talker_clinical.mp3
   Voices: 6 speakers (3 male, 3 female)
   Duration: ~60 seconds
   RMS: -20.0 dB FS
```

---

## The Two-Noise Strategy

### **Noise Type 1: Clinical Babble** (Primary Training)
- **Method:** Speech Synthesis (this script)
- **Use:** All word/sentence exercises
- **Benefit:** Mathematically accurate SNR
- **Cost:** ~$0.60 per minute (6 TTS requests)

### **Noise Type 2: Environmental Soundscapes** (Scenario Immersion)
- **Method:** Sound Effects API
- **Use:** Scenario-specific ambience (restaurant, doctor's office)
- **Benefit:** Ecological validity
- **Cost:** ~$0.10 per sound effect

### **When to Use Each:**

| Exercise Type | Noise | Rationale |
|--------------|-------|-----------|
| Word Pairs | Babble | Pure phonetic training |
| Sentences | Babble | Standardized testing |
| Stories | Babble | Comprehension under distraction |
| Restaurant Scenario | Restaurant SFX | Real-world scene-setting |
| Medical Scenario | Medical Office SFX | Professional environment |
| Phone Call | Babble | Simulates line noise |

---

## Future Enhancements

### **Gender-Specific Babble:**
```python
# Male-only babble (harder for high-frequency loss)
generate_babble(voices=VOICE_CONFIG["male_voices"] * 2)

# Female-only babble (harder for low-frequency loss)
generate_babble(voices=VOICE_CONFIG["female_voices"] * 2)
```

### **Age-Specific Babble:**
- Add child voices for pediatric users
- Add elderly voices for realistic social scenarios

### **Language-Specific Babble:**
- Spanish babble for Hispanic CI users
- Multilingual babble for international users

---

## Cost Analysis

### Per Babble File:
- **6 TTS requests** × $0.10 = $0.60
- **Storage** = $0.00 (included in Supabase free tier)
- **Total per file:** $0.60

### For Complete Library:
- **3 babble variants** (6-talker, male-only, female-only) = $1.80
- **One-time generation cost**
- **Infinite reuse** across all users

---

## Success Criteria

### ✅ **Technical:**
- Zero clipping artifacts
- RMS within ±0.5 dB of target
- Spectral characteristics match LTASS

### ✅ **Clinical:**
- Audiologist approval
- CI user comprehension matches QuickSIN norms
- No intelligible words detected

### ✅ **Product:**
- SNR math verified accurate (±0.5 dB)
- User completion rates > 80%
- "Realistic noise" user feedback

---

## Next Immediate Action

```bash
# 1. Install dependencies
pip3 install librosa soundfile pydub --break-system-packages

# 2. Generate clinical babble
python3 scripts/generate_babble.py --upload

# 3. Test at /snr-test
# Navigate to: http://localhost:5174/snr-test
# Select babble_6talker_clinical.mp3 from database

# 4. Validate
# Listen: Confirm no intelligible words
# Test: Verify SNR slider works correctly
```

---

**Status:** 🟢 Corrected approach documented and implemented

**Key Insight:** Sound Effects are for *scenes*, Speech Synthesis is for *science*.
