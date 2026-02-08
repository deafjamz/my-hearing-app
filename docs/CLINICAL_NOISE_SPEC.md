# Clinical Background Noise Specification

## Objective: Evidence-Based Noise for Auditory Rehabilitation

**Target Users:** Cochlear implant recipients, hearing aid users, individuals with auditory processing challenges

**Clinical Goal:** Train speech-in-noise comprehension using ecologically valid background sounds that simulate real-world listening environments.

---

## 🎯 Audiology Best Practices

### Industry Standards for Speech-in-Noise Testing:

1. **Multi-Talker Babble** (Gold Standard)
   - **Description:** Overlapping speech from 4-20 talkers (unintelligible)
   - **Why:** Most common real-world distractor
   - **Standards:** ICRA Noise, Speech-Shaped Noise, 20-talker babble
   - **Clinical Use:** QuickSIN, WIN, HINT tests

2. **Spectral Matching**
   - Background noise should match the **long-term average speech spectrum (LTASS)**
   - Prevents frequency-specific advantages/disadvantages
   - Ensures fair challenge across phonemes

3. **Temporal Characteristics**
   - **Steady-State vs. Modulated:**
     - Steady (e.g., white noise): Harder for CI users (no "listening in the dips")
     - Modulated (e.g., babble): More realistic, allows glimpsing
   - **Recommendation:** Use both types across difficulty levels

4. **Intensity Control**
   - Noise RMS should be calibrated (e.g., -20 dB FS)
   - SNR calculated using RMS, not peak levels
   - Consistent loudness across noise types

---

## 🔬 Noise Types for SoundSteps

### **🚨 CRITICAL DISTINCTION: Two Generation Methods**

#### **Method 1: Speech Synthesis API** (For Multi-Talker Babble)
- **What:** Controlled, consistent-volume babble
- **How:** Generate 6 voices reading neutral text, mix together
- **Why:** No sudden spikes (laughs, plate drops) that ruin SNR math
- **Use Case:** Primary training noise (Tier 1)

#### **Method 2: Sound Effects API** (For Environmental Soundscapes)
- **What:** Ecological scene-setting ambience
- **How:** Generate realistic environmental sounds
- **Why:** Scenario immersion and real-world listening challenges
- **Use Case:** Scenario-specific backgrounds (Tier 3)

---

### **Tier 1: Foundational Training Noise (Generate First)**

#### 1. **Multi-Talker Babble** (PRIMARY - Use Speech Synthesis)
- **Generation Method:** Speech Synthesis API (6 voices + mixing)
- **Script:** `generate_babble.py`
- **Voices:** 3 male + 3 female (Arnold, Adam, Sam, Sarah, Rachel, Elli)
- **Text:** Neutral corpus (Lorem Ipsum variants)
- **Duration:** 60 seconds (loopable)
- **RMS:** Normalized to -20 dB FS
- **Use Case:** Gold standard for all speech-in-noise training
- **Clinical Validation:** Matches QuickSIN/WIN/HINT test conditions
- **File:** `babble_6talker_clinical.mp3`

#### 2. **Restaurant Ambience with Chatter**
- **Prompt:** "Generate a 10-second audio clip of a busy restaurant environment with background conversations, occasional silverware clinks, and gentle ambient noise. The conversation babble should be unintelligible and blend into the background. Include subtle sounds of plates and glasses but keep speech-like noise dominant."
- **Use Case:** Scenario-specific training (restaurant dialogue)
- **Clinical Validation:** Ecologically valid, real-world scenario
- **File:** `restaurant_moderate.mp3`

#### 3. **Speech-Shaped Steady Noise**
- **Prompt:** "Generate a 10-second audio clip of continuous steady-state noise that matches the frequency spectrum of human speech. This should sound like a constant 'shh' sound with energy across speech frequencies (200-8000 Hz), similar to pink noise but optimized for the speech spectrum. No fluctuations or modulation."
- **Use Case:** Baseline training, standardized testing
- **Clinical Validation:** Matches ICRA-1 (steady-state speech noise)
- **File:** `speech_shaped_steady.mp3`

---

### **Tier 2: Adaptive Difficulty Noise (Future)**

#### 4. **Modulated Speech Noise**
- **Prompt:** "Generate speech-shaped noise with slow amplitude modulation (4 Hz) that creates 'listening dips' every 250ms, similar to the rhythm of natural conversation pauses."
- **Use Case:** Easier than steady noise (allows glimpsing)
- **Clinical Note:** Better for early-stage CI users
- **File:** `speech_shaped_modulated.mp3`

#### 5. **Single Competing Talker**
- **Prompt:** "Generate a 10-second monologue by one female speaker saying random sentences in a conversational tone. The content should be semantically unrelated to avoid contextual interference."
- **Use Case:** Informational masking training (harder than babble)
- **Clinical Note:** Tests selective attention, not just energetic masking
- **File:** `competing_talker_female.mp3`

---

### **Tier 3: Scenario-Specific Noise (Ecological Validity)**

#### 6. **Doctor's Office**
- **Prompt:** "Generate a medical office environment with muffled conversations in the background, occasional phone ringing, keyboard typing, and footsteps in a hallway. Keep the ambience calm and professional."
- **Use Case:** Medical Scenario training
- **File:** `medical_office_ambient.mp3`

#### 7. **Grocery Store**
- **Prompt:** "Generate a grocery store soundscape with distant announcements on PA system, shopping carts, rustling bags, beeping scanners, and background customer chatter. Keep speech babble unintelligible."
- **Use Case:** Grocery Scenario training
- **File:** `grocery_store_ambient.mp3`

#### 8. **Public Transit**
- **Prompt:** "Generate the interior sound of a bus or train with engine hum, occasional announcements, and passenger conversations. Include realistic vehicle movement sounds and ambient mechanical noise."
- **Use Case:** Public Transit Scenario training
- **File:** `transit_ambient.mp3`

---

## 📊 Technical Specifications

### RMS Normalization:
All noise files must be normalized to **-20 dB FS RMS** for consistent SNR calculations.

```python
# Post-processing after ElevenLabs generation
import librosa
import soundfile as sf

def normalize_noise(input_path, output_path, target_rms_db=-20.0):
    audio, sr = librosa.load(input_path, sr=None)
    current_rms = librosa.feature.rms(y=audio)[0].mean()
    current_rms_db = 20 * np.log10(current_rms)
    gain_db = target_rms_db - current_rms_db
    gain_linear = 10 ** (gain_db / 20)
    audio_normalized = audio * gain_linear
    sf.write(output_path, audio_normalized, sr)
```

### Duration:
- **Minimum:** 10 seconds (loopable)
- **Recommended:** 15-20 seconds (reduces loop artifacts)
- **Format:** MP3, 44.1 kHz, 128 kbps

### Looping:
Files should be designed to loop seamlessly (fade in/out if needed).

---

## 🧪 Clinical Validation Plan

### Phase 1: Perceptual Validation
- Have audiologists listen to ensure:
  - No individual words are intelligible
  - Spectral balance feels natural
  - No artifacts or unnatural sounds

### Phase 2: Objective Metrics
- **Spectral Analysis:** Compare to LTASS reference
- **Modulation Spectrum:** Verify temporal characteristics
- **Intelligibility Score:** Use ASR to confirm babble is unintelligible

### Phase 3: Pilot Testing
- Test with 5-10 CI users at various SNRs
- Measure comprehension scores
- Compare to published QuickSIN norms

---

## 🗂️ Database Schema Addition

```sql
-- Enhance noise_assets table with clinical metadata
ALTER TABLE noise_assets
  ADD COLUMN IF NOT EXISTS spectral_type TEXT CHECK (spectral_type IN ('babble', 'speech_shaped', 'ambient', 'modulated')),
  ADD COLUMN IF NOT EXISTS temporal_type TEXT CHECK (temporal_type IN ('steady', 'modulated', 'transient')),
  ADD COLUMN IF NOT EXISTS talker_count INTEGER,
  ADD COLUMN IF NOT EXISTS clinical_validated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS masking_type TEXT CHECK (masking_type IN ('energetic', 'informational', 'mixed'));
```

---

## 🚀 Implementation Roadmap

### Phase 1: Core Noise Assets (This Week)
- [ ] Generate Multi-Talker Babble
- [ ] Generate Restaurant Ambience
- [ ] Generate Speech-Shaped Noise
- [ ] Normalize all to -20 dB RMS
- [ ] Upload to Supabase Storage
- [ ] Update `noise_assets` table

### Phase 2: Scenario Integration (Week 2)
- [ ] Generate scenario-specific noise (Medical, Grocery, Transit)
- [ ] Link noise to specific scenarios in database
- [ ] Implement scenario → noise mapping in ScenarioPlayer

### Phase 3: Advanced Noise (Week 3-4)
- [ ] Generate modulated noise variants
- [ ] Generate competing talker stimuli
- [ ] Clinical validation with CI users

---

## 📝 ElevenLabs Sound Effects API Notes

### API Endpoint:
```
POST https://api.elevenlabs.io/v1/sound-generation
```

### Parameters:
- `text`: Detailed description (our prompts above)
- `duration_seconds`: 10-20 seconds
- `prompt_influence`: 0.5 (balance between prompt and natural sound)

### Post-Processing:
1. Download generated MP3
2. Normalize RMS to -20 dB
3. Fade in/out for seamless looping
4. Validate spectral characteristics
5. Upload to Supabase Storage

---

## 🎓 Clinical References

1. **Killion, M. C., Niquette, P. A., Gudmundsen, G. I., Revit, L. J., & Banerjee, S. (2004).** Development of a quick speech-in-noise test for measuring signal-to-noise ratio loss in normal-hearing and hearing-impaired listeners. *The Journal of the Acoustical Society of America, 116*(4), 2395-2405.

2. **Wagener, K., Josvassen, J. L., & Ardenkjær, R. (2003).** Design, optimization and evaluation of a Danish sentence test in noise. *International Journal of Audiology, 42*(1), 10-17.

3. **Cullington, H. E., & Zeng, F. G. (2008).** Speech recognition with varying numbers and types of competing talkers by normal-hearing, cochlear-implant, and implant simulation subjects. *The Journal of the Acoustical Society of America, 123*(1), 450-461.

4. **Duquesnoy, A. J. (1983).** The intelligibility of sentences in quiet and in noise in aged listeners. *The Journal of the Acoustical Society of America, 74*(4), 1136-1144.

---

**Next Step:** Implement `generate_clinical_noise.py` to create these assets using ElevenLabs Sound Effects API.
