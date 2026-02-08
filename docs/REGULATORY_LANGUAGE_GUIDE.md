# Regulatory Language Guide

> **Purpose:** Ensure all user-facing content positions SoundSteps as a **training/wellness app**, not a medical device.
> **Last Updated:** 2026-01-24
> **Reference:** FDA WHOOP Warning Letter (July 2025) - wellness vs. diagnostic distinction

---

## Core Principle

**SoundSteps is a training tool for people who already have hearing devices.**

We help users **practice** listening skills. We do NOT:
- Diagnose hearing conditions
- Assess hearing ability against clinical norms
- Provide medical-grade measurements
- Replace audiologist evaluations

---

## Terminology Guide

### Product Description

| Avoid | Use Instead |
|-------|-------------|
| "Clinically validated" | "Evidence-informed" or "Based on established audiology principles" |
| "Medical-grade" | "High-quality" or "Professional" |
| "Clinical assessment" | "Training progress" or "Practice summary" |
| "Diagnostic tool" | "Training tool" or "Practice platform" |
| "Treatment for hearing loss" | "Auditory training for CI/hearing aid users" |
| "Scientifically-backed" | "Evidence-informed" or "Research-based approach" |
| "Clinically proven" | "Designed with input from audiology research" |

### User Data & Analytics

| Avoid | Use Instead |
|-------|-------------|
| "Clinical metadata" | "Training data" or "Practice metrics" |
| "Clinical report" | "Training progress report" or "Practice summary" |
| "Assessment results" | "Training summary" |
| "Patient data" | "User data" or "Practice history" |
| "Diagnostic accuracy" | "Practice accuracy" |
| "Test results" | "Practice results" or "Exercise results" |

### Performance Feedback

| Avoid | Use Instead |
|-------|-------------|
| "You have a deficit in..." | "More practice recommended for..." |
| "Your hearing is impaired at..." | "Focus area for practice:" |
| "Assessment indicates..." | "Based on your practice sessions..." |
| "Clinically significant" | "Notable" or "Consistent pattern" |
| "Below normal range" | "Room for improvement" |
| "Diagnosis" | "Focus area" or "Practice recommendation" |

### Reporting Features

| Avoid | Use Instead |
|-------|-------------|
| "Clinical Report" | "Training Progress Report" |
| "Audiological Assessment" | "Practice Summary" |
| "Phoneme Confusion Matrix" | "Practice Focus Areas" or "Sound Pattern Insights" |
| "Patient Outcomes" | "Training Progress" |
| "Hearing Evaluation" | "Listening Practice Summary" |

---

## Safe Language Templates

### Progress Report Header

```
❌ AVOID:
"Clinical Assessment Report - Audiological Evaluation"

✅ USE:
"Training Progress Report"
"Share with your audiologist for additional context"
```

### Accuracy Display

```
❌ AVOID:
"Diagnostic Accuracy: 72%"
"Your hearing discrimination score: 72/100"

✅ USE:
"Practice Accuracy: 72%"
"This week's practice results: 72% correct"
```

### Identifying Weak Areas

```
❌ AVOID:
"Assessment indicates auditory processing deficit for /θ/ sounds"
"Clinical finding: Voiced consonant discrimination impairment"

✅ USE:
"Based on your practice sessions, you might benefit from more /θ/ exercises"
"Suggested focus area: Voiced consonants (/b/, /d/, /g/)"
"Your training data suggests practicing these sounds more"
```

### SNR/Difficulty Progression

```
❌ AVOID:
"Your hearing threshold has improved from +10 dB to +5 dB SNR"
"Clinical improvement: 5 dB gain"

✅ USE:
"Your training difficulty has progressed from +10 dB to +5 dB SNR"
"You're ready for more challenging exercises!"
"Great progress - moving to harder difficulty"
```

### Error Pattern Analysis

```
❌ AVOID:
"Phoneme Confusion Matrix showing auditory processing patterns"
"Diagnostic confusion analysis: /p/ ↔ /b/ discrimination failure rate: 34%"

✅ USE:
"Practice Focus Areas"
"Sounds to practice more: /p/ vs /b/ (65% accuracy - keep practicing!)"
"Your training shows these sound pairs need more practice"
```

### Safety Sound Performance

```
❌ AVOID:
"Critical deficit: Unable to identify smoke detector alarm"
"Safety assessment: FAIL"

✅ USE:
"Keep practicing: Smoke detector sounds"
"Recommended focus: Safety alert sounds"
"These important sounds need more practice time"
```

### Sharing with Audiologist

```
❌ AVOID:
"Clinical report for healthcare provider review"
"Audiological assessment data for diagnosis"

✅ USE:
"Training Progress Report"
"Share this summary with your audiologist to discuss your practice"
"This shows your home practice activity - your audiologist can use this
to personalize your care"
```

---

## Report Section Templates

### Section 1: Overview

```markdown
## Your Training Summary
Period: [Date Range]

You completed [X] practice sessions this [week/month].
Total practice time: [X] minutes

Keep up the great work! Regular practice helps build listening skills.
```

### Section 2: Practice Results

```markdown
## Practice Results

| Activity | Sessions | Accuracy | Trend |
|----------|----------|----------|-------|
| Word Pairs | 12 | 78% | ↑ Improving |
| Sentences | 8 | 65% | → Steady |
| Stories | 5 | 82% | ↑ Improving |

Your overall practice accuracy this week: 74%
```

### Section 3: Focus Areas (The Differentiator - Done Safely)

```markdown
## Suggested Practice Focus

Based on your recent practice sessions, here are sounds that could
use more attention:

### Sounds to Practice More
- **/p/ vs /b/** - 62% accuracy (try the "Voicing Pack" drill)
- **/s/ vs /ʃ/** - 58% accuracy (try the "Sibilants Pack" drill)

### Sounds You're Doing Well With
- **/t/ vs /d/** - 89% accuracy (great job!)
- **/f/ vs /v/** - 85% accuracy (keep it up!)

💡 **Tip:** The Smart Coach will automatically give you more practice
with your focus areas.
```

### Section 4: Difficulty Progression

```markdown
## Your Training Difficulty

You started at: +15 dB SNR (easier)
You're now at: +8 dB SNR (more challenging)

This means you're ready for harder listening situations!
The Smart Coach adjusted your difficulty based on your progress.

[Visual: Progress bar from +20 dB to -5 dB, with marker at current position]
```

### Section 5: For Your Audiologist

```markdown
## For Your Audiologist

This report summarizes home practice activity and can help inform
your clinical sessions.

**Note:** This is training data from self-directed practice, not a
clinical assessment. Results reflect practice performance, not
diagnostic measurements.

### Practice Metrics
- Total trials: [X]
- Date range: [X] to [Y]
- Average session length: [X] minutes
- Most practiced content: [Word pairs / Sentences / Stories]

### Areas of Focus in Training
- User showed consistent patterns with [X] sound contrasts
- Suggested areas for clinical attention: [X, Y, Z]

*Generated by SoundSteps - Auditory Training Platform*
```

---

## UI Component Language

### Smart Coach Feedback Modal

```typescript
// ✅ SAFE language examples

// When increasing difficulty (user doing well)
title: "Leveling Up!"
message: "Great work! You're ready for more challenging exercises."

// When decreasing difficulty (user struggling)
title: "Adjusting Difficulty"
message: "Let's practice at a more comfortable level."

// When maintaining difficulty
title: "Keep Going!"
message: "You're making progress. Keep practicing!"

// When mastery achieved
title: "Mastery Achieved!"
message: "Excellent! You've mastered this difficulty level."
```

### Progress Dashboard

```typescript
// ✅ SAFE labels
"Practice Streak: 7 days"
"This Week's Practice: 45 minutes"
"Exercises Completed: 234"
"Current Training Level: Intermediate"

// ❌ AVOID
"Clinical Score: 78"
"Hearing Assessment: Good"
"Diagnostic Level: 3"
```

### Error Feedback

```typescript
// ✅ SAFE - focus on the content, not the user's ability
"The word was 'pat' - listen for the /p/ sound at the start"
"Try again! The answer was 'three thirty'"

// ❌ AVOID - implies deficit
"Incorrect - you have difficulty with /p/ sounds"
"Wrong - your discrimination is poor"
```

---

## Legal Disclaimer Template

Include this in the app (Settings or About page) and in exported reports:

```
DISCLAIMER

SoundSteps is an auditory training application designed to supplement
professional audiological care. It is not a medical device and does not
diagnose, treat, cure, or prevent any hearing condition.

This app is intended for use by individuals who have already received
a diagnosis and are using hearing aids or cochlear implants under the
care of a licensed audiologist.

Training progress data reflects practice performance and should not be
interpreted as clinical measurements. Always consult your audiologist
for hearing assessments and medical advice.
```

---

## Review Checklist

Before shipping any user-facing feature, verify:

- [ ] No use of "clinical," "diagnostic," "assessment," or "medical-grade"
- [ ] Progress described as "training" or "practice," not "test results"
- [ ] Weak areas framed as "focus for practice," not "deficits"
- [ ] No comparison to clinical norms or "normal hearing" thresholds
- [ ] Disclaimer present where reports are generated or exported
- [ ] Audiologist sharing framed as "additional context," not "diagnosis"

---

## Examples in Context

### Feature: Phoneme Drill Pack Progress

**❌ Before (Risky):**
> "Clinical Assessment: Voicing Pack
> Your discrimination ability for voiced consonants is below average.
> Assessment score: 62/100
> Diagnosis: Difficulty with voice onset time perception"

**✅ After (Safe):**
> "Practice Progress: Voicing Pack (/p/ vs /b/)
> Your practice accuracy: 62%
> Keep going! These sounds need more practice.
> Suggested: Complete 10 more exercises this week"

### Feature: Weekly Summary Email

**❌ Before (Risky):**
> "Your Weekly Hearing Assessment
> Clinical findings from your practice sessions..."

**✅ After (Safe):**
> "Your Weekly Practice Summary
> Here's what you accomplished in your training sessions..."

---

## Questions?

If unsure whether language is safe, ask:
1. Does this compare the user to a clinical norm? → Avoid
2. Does this imply a diagnosis or medical condition? → Avoid
3. Does this describe practice performance relative to their own history? → Safe
4. Does this recommend more practice (not treatment)? → Safe
