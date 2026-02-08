# 10_CLINICAL_CONSTANTS: Physics & Algorithms

## 1. SNR (Signal-to-Noise Ratio) Math
* **Definition:** $SNR = Volume_{speech} - Volume_{noise}$ (in dB).
* **Implementation:**
    * Speech Gain: 1.0 (0 dB) - Always constant.
    * Noise Gain: $10^{(-SNR / 20)}$
* **Bounds:**
    * Max SNR (Easiest): +20 dB.
    * Min SNR (Hardest): -10 dB.
    * **Quiet Condition:** NULL or omitted (no noise present).
* **Database Storage:**
    * Column: `condition_snr INTEGER`
    * Constraint: `CHECK (condition_snr BETWEEN -10 AND 20 OR condition_snr IS NULL)`
    * NULL indicates quiet/no-noise trials.

## 2. The Smart Coach Algorithm (Staircase)
* **Trigger:** Every 10 Trials (1 Block).
* **Logic:**
    * **Increase Difficulty (SNR - 5):** Accuracy ≥ 80% (8/10).
    * **Decrease Difficulty (SNR + 5):** Accuracy ≤ 50% (5/10).
    * **Maintain:** Accuracy 51% - 79%.
* **Constraint:** Never adjust mid-block. Only after 10 trials.

## 3. Noise Types & Babble Specs
* **Primary Noise Type:** `babble_6talker`
    * **Composition:** 6-Talker Mix (3 Male, 3 Female).
    * **Processing:** 10:1 Compression (Aggressive Glue).
    * **Normalization:** -20 LUFS.
* **Other Supported Types:**
    * `quiet` - No noise (NULL SNR)
    * `traffic` - Traffic ambience (future)
    * `cafeteria` - Restaurant noise (future)
* **Database Storage:**
    * Column: `condition_noise_type TEXT`
    * Default: `quiet` (for backward compatibility)
    * Active noise trials: Set to `babble_6talker`

## 4. Audio Processing Physics
* **Carrier Phrase Trimming:**
    * **Pre-Trim:** ~1.3 seconds (Removes "The next word is").
    * **Silence Detection:** Must use `librosa.effects.split` or `pydub.silence`.
    * **Safety Margin:** Leave 50ms of silence at Start/End to prevent "clipping" the consonant attack.
* **Min Duration Flag:** Any trimmed asset < 0.3s is flagged as "Corrupted" and discarded.
