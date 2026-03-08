# Spanish Listening QC Protocol

## Purpose
This is the final non-automated launch gate for the remediated Spanish corpus.

Automated checks are already green:
- source-template validation
- drill audio storage and duration audit
- live Supabase rollout verification

What remains is human bilingual review of whether the generated Spanish actually sounds clinically defensible and launch-safe.

## Files
- packet: `reports/spanish_listening_qc_packet.csv`
- browser review surface: `reports/spanish_listening_qc_packet.html`
- packet summary: `reports/spanish_listening_qc_summary.json`
- launch readiness: `reports/spanish_launch_readiness.json`

## Reviewer Standard
Reviewer should be:
- fluent Spanish speaker
- comfortable judging pan-regional naturalness
- able to think like an aural-rehab reviewer, not a generic language learner

Ideal reviewer profile:
- bilingual Spanish/English clinician
- bilingual speech-language or auditory-verbal professional
- or at minimum a strong Spanish-native reviewer briefed on Erber-style listening goals

## Review Rubric
For each packet row, judge:

1. Intelligibility
- Is the word or utterance clearly understandable on first listen?

2. Naturalness
- Does it sound like plausible Spanish rather than translated or synthetic phrasing?

3. Regional neutrality
- Is it broadly acceptable for launch across Spanish-speaking users?
- Mild accent color is acceptable.
- Dialect-dependent lexical oddity is not.

4. Clinical validity
- Detection: cue is audible and free of spoken carrier contamination
- Drills: the contrast is perceptible and the pair is appropriate for the stated pack logic
- Sentences/conversations: foils remain plausible and clinically useful in Spanish
- Scenarios: utterance fits the role and context naturally

5. Technical acceptability
- no truncation
- no clipping
- no abrupt pacing artifact
- no strange silent gap

## Disposition Values
Use the `disposition` column in `reports/spanish_listening_qc_packet.csv`.

Allowed values:
- `pass`
- `flag_audio`
- `flag_language`
- `flag_clinical_logic`
- `flag_pack`

Use `reviewer_notes` to explain the issue briefly and concretely.

## Failure Policy
If any row is flagged:
- do not treat Spanish as broad-launch ready
- fix the source template or audio generation issue
- regenerate only the affected content
- rerun the relevant automated checks
- rerun QC for the affected rows or pack

If a drill row is flagged for contrast validity:
- reopen the whole pack, not just the sampled row

## Readiness Rule
Spanish is operationally ready for launch only when:
1. `reports/spanish_launch_readiness.json` shows all automated gates green
2. the listening packet is fully reviewed
3. all reviewed rows are `pass`

Until then, the correct status is:
- `ready_pending_human_qc`
