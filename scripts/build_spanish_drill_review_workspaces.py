#!/usr/bin/env python3
"""
Build structured clinical-review workspaces for Spanish drill packs that may be salvageable.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_TEMPLATE = ROOT / "content" / "spanish_templates_1x" / "phoneme_drills_es_launch_template.csv"
DEFAULT_OUTPUT_DIR = ROOT / "content" / "spanish_templates_1x" / "drill_review_workspaces"
DEFAULT_BACKLOG = ROOT / "content" / "spanish_templates_1x" / "phoneme_drill_review_backlog.csv"

REDESIGN_REQUIRED = {
    "pack_s_vs_z",
    "pack_th_voiced_unvoiced",
    "pack_ch_vs_j",
    "drill_pack_19",
    "drill_pack_20",
    "drill_pack_21",
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Spanish drill clinical-review workspaces")
    parser.add_argument("--template", type=Path, default=DEFAULT_TEMPLATE)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--backlog", type=Path, default=DEFAULT_BACKLOG)
    args = parser.parse_args()

    template_path = args.template if args.template.is_absolute() else (ROOT / args.template)
    output_dir = args.output_dir if args.output_dir.is_absolute() else (ROOT / args.output_dir)
    backlog_path = args.backlog if args.backlog.is_absolute() else (ROOT / args.backlog)
    output_dir.mkdir(parents=True, exist_ok=True)
    backlog_path.parent.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(template_path)
    backlog_rows: list[dict[str, object]] = []

    for pack_id, pack_df in df.groupby("drill_pack_id", dropna=False):
        pack_id = str(pack_id)
        if pack_id in REDESIGN_REQUIRED:
            continue

        pack_name = str(pack_df["pack_name"].iloc[0])
        contrast_type = str(pack_df["contrast_type"].iloc[0])
        workspace_rows: list[dict[str, object]] = []

        for _, row in pack_df.iterrows():
            workspace_rows.append({
                "source_pack_id": pack_id,
                "source_row_id": row["id"],
                "source_pack_name": pack_name,
                "contrast_type": contrast_type,
                "difficulty": row["difficulty"],
                "tier": row["tier"],
                "position": row["position"],
                "target_phoneme_en": row["target_phoneme_en"],
                "contrast_phoneme_en": row["contrast_phoneme_en"],
                "target_phoneme_es_current": row["target_phoneme_es"],
                "contrast_phoneme_es_current": row["contrast_phoneme_es"],
                "word_1_en": row["word_1_en"],
                "word_1_es_current": row["word_1_es"],
                "word_2_en": row["word_2_en"],
                "word_2_es_current": row["word_2_es"],
                "clinical_note_en": row["clinical_note_en"],
                "clinical_note_es_current": row["clinical_note_es"],
                "review_decision": "pending",
                "approved_word_1_es": "",
                "approved_word_2_es": "",
                "approved_target_phoneme_es": "",
                "approved_contrast_phoneme_es": "",
                "approved_clinical_note_es": "",
                "review_notes": "",
            })

        workspace_path = output_dir / f"{pack_id}_review.csv"
        with workspace_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(workspace_rows[0].keys()))
            writer.writeheader()
            writer.writerows(workspace_rows)

        backlog_rows.append({
            "source_pack_id": pack_id,
            "source_pack_name": pack_name,
            "contrast_type": contrast_type,
            "row_count": int(len(pack_df)),
            "current_machine_translated_rows": int((pack_df["translation_status"] == "machine_translated").sum()),
            "current_clinically_reviewed_rows": int((pack_df["translation_status"] == "clinically_reviewed").sum()),
            "workspace_file": str(workspace_path),
            "status": "pending_clinical_review",
        })

    with backlog_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(backlog_rows[0].keys()))
        writer.writeheader()
        writer.writerows(backlog_rows)

    print(f"Spanish drill review backlog written: {backlog_path}")
    print(f"Workspaces: {len(backlog_rows)}")


if __name__ == "__main__":
    main()
