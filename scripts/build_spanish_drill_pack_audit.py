#!/usr/bin/env python3
"""
Build a pack-level audit for Spanish drill redesign planning.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_TEMPLATE = ROOT / "content" / "spanish_templates_1x" / "phoneme_drills_es_launch_template.csv"
DEFAULT_OUTPUT = ROOT / "content" / "spanish_templates_1x" / "phoneme_drill_pack_audit.csv"

KNOWN_INVALID_PACKS = {
    "pack_s_vs_z": {
        "recommended_action": "redesign_required",
        "reason": "/s/ vs /z/ is not pan-regional Spanish phonology",
        "proposed_replacement": "/s/ vs /f/ or /s/ vs /x/",
    },
    "pack_s_vs_sh": {
        "recommended_action": "redesign_required",
        "reason": "/s/ vs /ʃ/ is not a pan-regional launch contrast in Spanish",
        "proposed_replacement": "/s/ vs /tʃ/ or /s/ vs /x/",
    },
    "pack_th_voiced_unvoiced": {
        "recommended_action": "redesign_required",
        "reason": "English dental-fricative voicing contrast does not transfer pan-regionally",
        "proposed_replacement": "/t/ vs /d/ or /l/ vs /r/",
    },
    "pack_ch_vs_j": {
        "recommended_action": "redesign_required",
        "reason": "/tʃ/ vs /dʒ/ is not the right Spanish counterpart",
        "proposed_replacement": "/tʃ/ vs /ʝ/",
    },
    "pack_f_vs_v": {
        "recommended_action": "redesign_required",
        "reason": "English /f/ vs /v/ voicing does not map to a pan-regional Spanish phonemic contrast",
        "proposed_replacement": "/f/ vs /b/",
    },
    "drill_pack_17": {
        "recommended_action": "redesign_required",
        "reason": "Orthographic b/v does not create a Spanish phonemic contrast",
        "proposed_replacement": "/b/ vs /m/ or retire pack",
    },
    "drill_pack_11": {
        "recommended_action": "redesign_required",
        "reason": "English initial /s/ vs /ʃ/ does not map to a pan-regional Spanish launch contrast",
        "proposed_replacement": "/s/ vs /tʃ/ or /s/ vs /x/",
    },
    "drill_pack_12": {
        "recommended_action": "redesign_required",
        "reason": "English final /s/ vs /ʃ/ does not map cleanly to a Spanish coda contrast",
        "proposed_replacement": "/l/ vs /r/ final or another Spanish-valid coda task",
    },
    "drill_pack_16": {
        "recommended_action": "redesign_required",
        "reason": "Word-final /m/ versus /n/ is not a stable Spanish launch contrast",
        "proposed_replacement": "/m/ vs /n/ medial or /n/ vs /ɲ/",
    },
    "drill_pack_18": {
        "recommended_action": "redesign_required",
        "reason": "English /ɪ/ vs /iː/ tense/lax logic does not map to Spanish",
        "proposed_replacement": "/i/ vs /e/",
    },
    "drill_pack_19": {
        "recommended_action": "redesign_required",
        "reason": "English tense/lax back-vowel logic does not map to Spanish",
        "proposed_replacement": "/o/ vs /u/",
    },
    "drill_pack_20": {
        "recommended_action": "redesign_required",
        "reason": "English diphthong contrast does not transfer cleanly",
        "proposed_replacement": "/ai/ vs /ei/ or /ai/ vs /oi/",
    },
    "drill_pack_21": {
        "recommended_action": "redesign_required",
        "reason": "/tʃ/ vs /ʃ/ is not pan-regional enough for launch",
        "proposed_replacement": "/tʃ/ vs /s/ or /tʃ/ vs /ʝ/",
    },
    "drill_pack_22": {
        "recommended_action": "redesign_required",
        "reason": "English /dʒ/ vs /ʒ/ affricate/fricative logic does not transfer cleanly to Spanish",
        "proposed_replacement": "retire or replace with a Spanish palatal contrast",
    },
    "drill_pack_23": {
        "recommended_action": "redesign_required",
        "reason": "English s-stop cluster voicing logic does not transfer to Spanish onset phonotactics",
        "proposed_replacement": "/pl/ vs /pr/ or another Spanish-valid cluster contrast",
    },
    "drill_pack_24": {
        "recommended_action": "redesign_required",
        "reason": "English final /t/ versus null awareness is not a stable Spanish launch contrast",
        "proposed_replacement": "/s/ vs null or another Spanish-final awareness task",
    },
    "drill_pack_25": {
        "recommended_action": "redesign_required",
        "reason": "Mixed hardest-pair inventory still contains multiple English-only contrasts",
        "proposed_replacement": "retire and rebuild from validated Spanish advanced packs",
    },
    "pack_i_vs_I": {
        "recommended_action": "redesign_required",
        "reason": "English /i/ vs /ɪ/ contrast does not map to Spanish vowel inventory",
        "proposed_replacement": "/i/ vs /e/",
    },
    "pack_e_vs_ae": {
        "recommended_action": "redesign_required",
        "reason": "English /ɛ/ vs /æ/ contrast does not map to Spanish vowel inventory",
        "proposed_replacement": "/e/ vs /a/",
    },
}

APPROVED_STATUSES = {"clinically_reviewed", "approved_for_launch"}


def classify_pack(pack_id: str, status_counts: dict[str, int], row_count: int) -> tuple[str, str, str]:
    approved_count = sum(status_counts.get(status, 0) for status in APPROVED_STATUSES)
    if approved_count == row_count and status_counts.get("machine_translated", 0) == 0 and status_counts.get("needs_pack_redesign", 0) == 0:
        return (
            "approved",
            "Pack has a fully reviewed Spanish-native lexical set and is ready for downstream audio/QC work.",
            "",
        )
    if pack_id in KNOWN_INVALID_PACKS:
        item = KNOWN_INVALID_PACKS[pack_id]
        return item["recommended_action"], item["reason"], item["proposed_replacement"]
    return (
        "clinical_review_required",
        "Pack may be clinically salvageable, but machine-translated drill words are not launch-safe.",
        "",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Spanish drill pack audit")
    parser.add_argument("--template", type=Path, default=DEFAULT_TEMPLATE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    template_path = args.template if args.template.is_absolute() else (ROOT / args.template)
    output_path = args.output if args.output.is_absolute() else (ROOT / args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(template_path)
    rows: list[dict[str, object]] = []

    for pack_id, group in df.groupby("drill_pack_id", dropna=False):
        pack_id = str(pack_id)
        pack_name = str(group["pack_name"].iloc[0])
        contrast_type = str(group["contrast_type"].iloc[0])
        status_counts = group["translation_status"].fillna("").value_counts().to_dict()
        recommended_action, reason, proposed_replacement = classify_pack(pack_id, status_counts, int(len(group)))

        rows.append({
            "drill_pack_id": pack_id,
            "pack_name": pack_name,
            "contrast_type": contrast_type,
            "row_count": int(len(group)),
            "machine_translated_rows": int(status_counts.get("machine_translated", 0)),
            "clinically_reviewed_rows": int(status_counts.get("clinically_reviewed", 0)),
            "approved_for_launch_rows": int(status_counts.get("approved_for_launch", 0)),
            "needs_pack_redesign_rows": int(status_counts.get("needs_pack_redesign", 0)),
            "recommended_action": recommended_action,
            "reason": reason,
            "proposed_replacement": proposed_replacement,
        })

    rows.sort(key=lambda row: (row["recommended_action"] != "redesign_required", row["drill_pack_id"]))

    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Spanish drill pack audit written: {output_path}")
    print(f"Rows: {len(rows)}")


if __name__ == "__main__":
    main()
