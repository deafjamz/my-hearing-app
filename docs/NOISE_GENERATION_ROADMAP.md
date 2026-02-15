# Clinical Noise Generation Roadmap

## Vision: Scenario-Specific Ecological Validity

**Strategic Goal:** Every dialogue scenario in SoundSteps should have acoustically-matched background noise that mirrors real-world listening environments.

**Clinical Rationale:** Ecological validity improves transfer of training to real-life communication situations. When users practice "ordering food at a restaurant" with actual restaurant ambience, the neural pathways generalize better to real restaurants.

---

## Current State

### ✅ What We Have:
- Database schema (`noise_assets` table)
- Clinical specification document
- ElevenLabs Sound Effects API integration
- RMS normalization pipeline
- Supabase Storage infrastructure

### 🚧 What We're Building:
- Tier 1 foundational noise (3 assets)
- Clinical validation framework
- Scenario → Noise mapping system

---

## Implementation Phases

### **Phase 1: Foundational Noise Library** (This Week)

**Objective:** Generate and validate core training noise for word/sentence exercises.

#### Assets to Generate:
1. ✅ `babble_8talker_cafeteria.mp3` - Multi-talker babble (gold standard)
2. ✅ `restaurant_moderate.mp3` - Restaurant ambience
3. ✅ `speech_shaped_steady.mp3` - Standardized test noise

#### Tasks:
- [ ] Run database migration (`add_noise_clinical_metadata.sql`)
- [ ] Execute `generate_clinical_noise.py --tier 1`
- [ ] Verify all files uploaded to Supabase Storage
- [ ] Test audio playback at `/snr-test`
- [ ] Clinical validation (perceptual review by audiologist)

**Success Criteria:**
- All 3 files play correctly in SNR mixer
- RMS verified at -20 dB FS
- No intelligible words in babble tracks
- Audiologist approval

---

### **Phase 2: Scenario Integration** (Week 2)

**Objective:** Link scenarios to contextually-appropriate background noise.

#### Scenario → Noise Mapping:

| Scenario | Appropriate Noise | Rationale |
|----------|-------------------|-----------|
| **Restaurant Ordering** | `restaurant_moderate.mp3` | Matches real dining environment |
| **Doctor's Office** | `medical_office_ambient.mp3` | Professional, subdued setting |
| **Grocery Shopping** | `grocery_store_ambient.mp3` | Retail soundscape with PA/carts |
| **Public Transit** | `transit_ambient.mp3` | Engine hum + passenger chatter |
| **Phone Conversation** | `speech_shaped_steady.mp3` | Line noise simulation |
| **Coffee Shop** | `babble_8talker_cafeteria.mp3` | High babble density |

#### Database Schema Addition:
```sql
ALTER TABLE scenarios
  ADD COLUMN IF NOT EXISTS default_noise_id UUID REFERENCES noise_assets(id),
  ADD COLUMN IF NOT EXISTS noise_snr_range JSONB; -- {"min": 5, "max": 15}
```

#### Implementation:
```typescript
// ScenarioPlayer.tsx enhancement
const { snr, setSNR, play } = useSNRMixer({
  speechUrl: currentItem.audio_path,
  noiseUrl: scenario.default_noise_url, // ← New field
  initialSNR: userAdaptiveSNR,
});
```

---

### **Phase 3: Adaptive Difficulty Noise** (Week 3)

**Objective:** Provide noise variants for different difficulty levels.

#### Assets to Generate (Tier 2):
1. `speech_shaped_modulated.mp3` - Easier (allows glimpsing)
2. `competing_talker_female.mp3` - Harder (informational masking)
3. `competing_talker_male.mp3` - Harder (voice variation)

#### Smart Coach Integration:
```python
# Supabase Edge Function: calculate_next_difficulty
def get_noise_for_level(performance_level: str):
    if performance_level == "struggling":
        return "speech_shaped_modulated"  # Easiest
    elif performance_level == "improving":
        return "babble_8talker_cafeteria"  # Moderate
    elif performance_level == "advanced":
        return "competing_talker_female"  # Hardest
```

---

### **Phase 4: Advanced Scenario Noise** (Week 4)

**Objective:** Generate scenario-specific noise for all scenarios in the content library.

#### Tier 3 Assets:
1. `medical_office_ambient.mp3` - Doctor's office
2. `grocery_store_ambient.mp3` - Shopping environment
3. `transit_ambient.mp3` - Bus/train interior
4. `classroom_moderate.mp3` - Educational setting
5. `office_meeting_room.mp3` - Professional meeting
6. `outdoor_park_ambient.mp3` - Nature + distant voices

#### Dynamic Scenario Prompts:
```python
# Future: Generate noise on-demand for custom scenarios
def generate_scenario_noise(scenario_description: str):
    prompt = f"""
    Generate a 15-second audio clip of the following environment:
    {scenario_description}

    Include ambient sounds and background conversation appropriate for this setting.
    Keep all speech unintelligible.
    """
    return elevenlabs.sound_generation(text=prompt)
```

---

## Clinical Validation Protocol

### Perceptual Validation (All Tiers):
1. **Intelligibility Check**
   - [ ] Play to audiologist
   - [ ] Confirm: No individual words distinguishable
   - [ ] Rate naturalness (1-5 scale)

2. **Spectral Analysis**
   - [ ] Compare to LTASS reference curve
   - [ ] Verify energy distribution (200-8000 Hz)
   - [ ] Check for spectral holes

3. **Pilot Testing**
   - [ ] Test with 5 CI users
   - [ ] Measure comprehension at +5, +10, +15 dB SNR
   - [ ] Compare to published QuickSIN norms

### Objective Metrics:
- **RMS:** -20 dB FS (±0.5 dB)
- **Duration:** 10-20 seconds (loopable)
- **Sample Rate:** 44.1 kHz
- **Format:** MP3 @ 128 kbps

---

## Technical Architecture

### Storage Structure:
```
audio/
└── noise/
    ├── babble_8talker_cafeteria.mp3
    ├── restaurant_moderate.mp3
    ├── speech_shaped_steady.mp3
    ├── medical_office_ambient.mp3
    └── ... (tier 2 & 3)
```

### Database Schema:
```sql
noise_assets (
  id UUID,
  name TEXT UNIQUE,
  category TEXT,  -- 'speech_babble', 'environmental', 'white_noise'
  spectral_type TEXT,  -- 'babble', 'speech_shaped', 'ambient'
  temporal_type TEXT,  -- 'steady', 'modulated', 'transient'
  talker_count INTEGER,
  masking_type TEXT,  -- 'energetic', 'informational', 'mixed'
  verified_rms_db FLOAT,
  clinical_validated BOOLEAN,
  storage_url TEXT
)
```

### API Integration Flow:
```
User Request
    ↓
Frontend (useSNRMixer)
    ↓
Supabase (noise_assets table)
    ↓
Fetch noise_url for scenario
    ↓
Web Audio API mixing
    ↓
Play speech + noise at calculated SNR
```

---

## Future Enhancements

### **Dynamic Noise Generation** (Month 2+)
- Generate noise on-the-fly for user-created scenarios
- Personalize noise based on user's real-world challenges
- "Record your difficult listening environment" feature

### **Spatial Audio** (Advanced)
- Position noise sources in 3D space
- Simulate cocktail party effect
- Train directional hearing

### **Noise Reduction Training** (Clinical Research)
- Progressive noise reduction challenge
- Train users to use assistive device features
- Gamify noise tolerance thresholds

---

## Success Metrics

### Technical Validation:
- ✅ All noise files pass RMS normalization (±0.5 dB)
- ✅ Spectral analysis matches LTASS
- ✅ Zero intelligible words in babble tracks

### Clinical Validation:
- ✅ Audiologist approval for clinical use
- ✅ CI user comprehension matches QuickSIN norms (±5%)
- ✅ Users report noise as "realistic"

### Product Validation:
- ✅ Scenario-specific noise deployed for top 10 scenarios
- ✅ Smart Coach successfully modulates SNR
- ✅ User engagement with SNR training > 80% completion rate

---

## Timeline

| Week | Phase | Deliverable |
|------|-------|-------------|
| 1 | Foundation | Tier 1 noise generated & validated |
| 2 | Scenarios | 10 scenarios linked to appropriate noise |
| 3 | Adaptive | Tier 2 noise + Smart Coach integration |
| 4 | Advanced | Tier 3 scenario-specific noise complete |

---

## Next Immediate Actions

1. **Run Database Migration:**
   ```bash
   # In Supabase SQL Editor
   Run sql_migrations/add_noise_clinical_metadata.sql
   ```

2. **Generate Tier 1 Noise:**
   ```bash
   python3 scripts/generate_clinical_noise.py --tier 1
   ```

3. **Test SNR Mixer:**
   - Navigate to http://localhost:5174/snr-test
   - Verify audio playback with noise

4. **Clinical Validation:**
   - Share samples with audiologist
   - Collect perceptual ratings
   - Iterate on prompts if needed

---

**Vision Statement:** By Week 4, every SoundSteps scenario will have clinically-validated, ecologically-appropriate background noise that mirrors real-world listening challenges, giving CI users the best possible training for social communication success.
