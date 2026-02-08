# Regulatory Language Rules - SoundSteps

## CRITICAL: FDA Compliance

SoundSteps is a **training app**, NOT a medical device.
Following the Whoop/FDA ruling, avoid terminology that implies medical claims.

## Prohibited Terms (User-Facing)

| DO NOT USE | USE INSTEAD |
|------------|-------------|
| clinical | structured, professional |
| therapy/therapeutic | training, practice |
| treatment | exercises, activities |
| diagnose/diagnosis | assess, evaluate |
| medical | health, wellness |
| patient | user, member |
| rehabilitate | improve, develop |
| cure/heal | support, enhance |
| prescription | recommendation |
| doctor-recommended | expert-designed |

## Acceptable Terms

- "Hearing training exercises"
- "Auditory practice activities"
- "Speech recognition training"
- "Listening skill development"
- "Sound awareness exercises"
- "Professional voice roster"
- "Structured training pathways"
- "Progress tracking"

## Code Review Requirement

Before merging ANY user-facing text:
1. Search for prohibited terms: `grep -ri "clinical\|therapy\|treatment" src/`
2. Review all UI strings in components
3. Check Supabase seed data for terminology
4. Verify marketing copy in README/docs

## Database Schema

- Use `training_metadata` NOT `clinical_metadata`
- Use `user_training_summary` NOT `clinical_summary`
- Audio assets: `babble_6talker` NOT `babble_6talker_clinical`

## Documentation

See: `docs/REGULATORY_LANGUAGE_GUIDE.md` for comprehensive guidance.

## Disclaimer Requirements

All app stores and marketing must include:
> "SoundSteps is designed for hearing training and practice. It is not intended to diagnose, treat, cure, or prevent any medical condition. Consult a healthcare professional for medical advice."
