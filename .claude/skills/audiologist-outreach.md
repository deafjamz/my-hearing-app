# Audiologist Outreach Skill

Generate B2B messaging, outreach emails, one-pagers, and demo scripts for audiologists and hearing healthcare professionals.

## When to Activate

- Writing outreach emails to audiologists or clinics
- Creating a one-pager or PDF for audiologist offices
- Drafting demo scripts for showing SoundSteps to professionals
- Writing the "For Audiologists" landing page
- Creating conference or trade show materials
- Responding to audiologist inquiries

## Audience Profile: Audiologists

### Who They Are

- Licensed healthcare professionals (Au.D. or M.S. in Audiology)
- Work in private practice, hospitals, ENT clinics, or CI centers
- See 15-30 patients per week
- Recommend home exercises but have limited tools to prescribe
- Frustrated by patient compliance with at-home practice
- Value evidence-informed approaches but skeptical of consumer apps
- Time-poor — need to evaluate tools quickly

### Their Pain Points

1. **Low compliance:** Patients don't practice at home between appointments
2. **No visibility:** Can't see what patients are doing (or not doing) between visits
3. **Outdated tools:** LACE is from 2006, Angel Sound has minimal UX, AB Clix is brand-locked
4. **No structured progression:** Recommending "practice listening" is vague — need specific activities
5. **Documentation gap:** No easy way to get home practice data into clinical notes

### What They Want

- A tool they can confidently recommend (not a toy)
- Structured progression their patients can follow independently
- Data they can review (CSV export, progress reports)
- Something patients will actually use (good UX, modern design)
- No regulatory risk to their license

## Messaging Framework

### Core Message

**SoundSteps gives your patients structured, trackable listening practice between appointments — so they show up to every session making real progress.**

### Positioning (For Professionals)

- "Supplements your care" — never "replaces"
- "Evidence-informed" — based on the Erber model, a foundational audiology framework
- "Home practice, not home testing" — training data, not diagnostic data
- "You stay in control" — patients practice, you guide

### Key Proof Points

| Feature | What Audiologists Care About |
|---------|------------------------------|
| Erber model progression | Structured, recognizable framework they learned in grad school |
| 4 activity levels | Maps to Detection → Discrimination → Identification → Comprehension |
| 9 professional voices | Male/female, US/UK/AU accents — builds generalization |
| Speech-in-noise training | Adaptive SNR with Smart Coach (2-down/1-up staircase) |
| Progress reports | Per-activity accuracy, phoneme mastery, trend data |
| CSV export | Raw data for clinical notes or research |
| Bluetooth hearing aid support | Works with MFi/ASHA devices — audio routes correctly |
| Daily Practice plans | Personalized, algorithm-driven — reduces decision fatigue |

### Objection Handling

| Objection | Response |
|-----------|----------|
| "Is this a medical device?" | No — SoundSteps is a training tool. It does not diagnose, assess, or measure hearing. It provides structured listening practice. |
| "How is this different from LACE?" | Modern web app (works on any device), 9 voices for generalization, Erber-based progression, real-time progress tracking, Bluetooth hearing aid support. |
| "Will patients actually use it?" | Designed for daily 10-minute sessions with streak tracking, personalized difficulty, and encouraging feedback. Modern UX inspired by apps your patients already use. |
| "Can I see their data?" | Yes — patients can share progress reports or export CSV data. We're exploring a clinician dashboard for Phase 4. |
| "What about privacy?" | All data stored in Supabase with row-level security. No data shared without user consent. No advertising, no data sales. |

## Copy Templates

### Cold Outreach Email (Short)

Subject: Home practice tool for your CI/HA patients

Hi Dr. [Name],

I built SoundSteps because I wear cochlear implants and wished I had structured practice between audiology appointments.

It's a web-based training app with 7 activities across all 4 Erber levels — Detection through Comprehension. Patients get personalized daily plans, and you can see their progress via exportable reports.

Would you be open to trying it for 5 minutes? I can set up a demo account for you.

Best,
Bruce

### One-Pager Sections

1. **What is SoundSteps?** — Structured listening training for CI and hearing aid users
2. **How it works** — 4 Erber levels, 7 activities, 9 voices, adaptive difficulty
3. **For your patients** — Daily 10-min sessions, progress tracking, Bluetooth support
4. **For you** — Progress reports, CSV export, evidence-informed framework
5. **Getting started** — Patients sign up free, start with a 3-minute Listening Check
6. **About the founder** — Bruce, bilateral CI user, built this for people like us

### Conference Booth Script (30 seconds)

"SoundSteps is a web-based listening training app for CI and hearing aid users. It uses the Erber model to progress patients from sound detection through comprehension, with adaptive difficulty and 9 professional voices. Patients get personalized daily plans and you get exportable progress data. Want to try the 3-minute Listening Check?"

## Language Rules

### DO use:
- "Evidence-informed" / "Research-based"
- "Structured listening practice"
- "Training data" / "Practice metrics"
- "Supplements your care"
- "Home practice between appointments"

### DO NOT use:
- "Clinically validated" / "Clinically proven"
- "Diagnostic" / "Assessment"
- "Treatment" / "Therapy"
- "Replaces" audiologist care
- "Medical-grade" measurements

See: `docs/REGULATORY_LANGUAGE_GUIDE.md` for full reference.

## Quality Checklist

- [ ] No clinical claims or diagnostic language
- [ ] Positioned as supplemental to professional care
- [ ] Proof points are factual (features that exist, not promises)
- [ ] Includes disclaimer where appropriate
- [ ] Tone is professional peer-to-peer, not sales-y
- [ ] Respects audiologists' expertise and judgment
