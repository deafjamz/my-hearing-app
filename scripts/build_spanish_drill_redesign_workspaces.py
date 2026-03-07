#!/usr/bin/env python3
"""
Build structured redesign workspaces for Spanish drill packs that are invalid at the pack level.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_TEMPLATE = ROOT / "content" / "spanish_templates_1x" / "phoneme_drills_es_launch_template.csv"
DEFAULT_OUTPUT_DIR = ROOT / "content" / "spanish_templates_1x" / "drill_redesign_workspaces"
DEFAULT_BACKLOG = ROOT / "content" / "spanish_templates_1x" / "phoneme_drill_redesign_backlog.csv"

REDESIGN_SPECS = {
    "pack_s_vs_z": {
        "proposed_pack_id": "pack_es_s_vs_f",
        "proposed_pack_name": "Fricative Contrast: /s/ vs /f/",
        "proposed_target_phoneme_es": "/s/",
        "proposed_contrast_phoneme_es": "/f/",
        "clinical_goal": "high-salience fricative distinction with pan-regional Spanish targets",
    },
    "pack_th_voiced_unvoiced": {
        "proposed_pack_id": "pack_es_t_vs_d",
        "proposed_pack_name": "Stop Voicing: /t/ vs /d/",
        "proposed_target_phoneme_es": "/t/",
        "proposed_contrast_phoneme_es": "/d/",
        "clinical_goal": "stable Spanish voicing contrast with strong transfer value",
    },
    "pack_ch_vs_j": {
        "proposed_pack_id": "pack_es_tch_vs_ye",
        "proposed_pack_name": "Affricate Contrast: /tʃ/ vs /ʝ/",
        "proposed_target_phoneme_es": "/tʃ/",
        "proposed_contrast_phoneme_es": "/ʝ/",
        "clinical_goal": "Spanish-native affricate versus palatal contrast",
    },
    "drill_pack_19": {
        "proposed_pack_id": "pack_es_o_vs_u_medial",
        "proposed_pack_name": "Vowel Contrast: /o/ vs /u/ Medial",
        "proposed_target_phoneme_es": "/o/",
        "proposed_contrast_phoneme_es": "/u/",
        "clinical_goal": "replace English tense/lax back-vowel logic with Spanish vowel contrast",
    },
    "drill_pack_20": {
        "proposed_pack_id": "pack_es_ai_vs_ei_medial",
        "proposed_pack_name": "Diphthong Contrast: /ai/ vs /ei/ Medial",
        "proposed_target_phoneme_es": "/ai/",
        "proposed_contrast_phoneme_es": "/ei/",
        "clinical_goal": "retain glide perception work using Spanish-valid diphthongs",
    },
    "drill_pack_21": {
        "proposed_pack_id": "pack_es_tch_vs_s_initial",
        "proposed_pack_name": "Affricate/Fricative: /tʃ/ vs /s/ Initial",
        "proposed_target_phoneme_es": "/tʃ/",
        "proposed_contrast_phoneme_es": "/s/",
        "clinical_goal": "retain burst-vs-frication discrimination with pan-regional fricative target",
    },
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Spanish drill redesign workspaces")
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

    for pack_id, spec in REDESIGN_SPECS.items():
        pack_df = df[df["drill_pack_id"] == pack_id].copy()
        if pack_df.empty:
            continue

        workspace_rows: list[dict[str, object]] = []
        for idx, (_, row) in enumerate(pack_df.iterrows(), start=1):
            workspace_rows.append({
                "source_pack_id": pack_id,
                "source_row_id": row["id"],
                "source_pack_name": row["pack_name"],
                "difficulty": row["difficulty"],
                "tier": row["tier"],
                "position": row["position"],
                "proposed_pack_id": spec["proposed_pack_id"],
                "proposed_pack_name": spec["proposed_pack_name"],
                "proposed_target_phoneme_es": spec["proposed_target_phoneme_es"],
                "proposed_contrast_phoneme_es": spec["proposed_contrast_phoneme_es"],
                "clinical_goal": spec["clinical_goal"],
                "candidate_slot": idx,
                "proposed_word_1_es": "",
                "proposed_word_2_es": "",
                "lexical_naturalness_notes": "",
                "regional_notes": "",
                "approval_status": "draft",
            })

        workspace_path = output_dir / f"{pack_id}_workspace.csv"
        with workspace_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(workspace_rows[0].keys()))
            writer.writeheader()
            writer.writerows(workspace_rows)

        backlog_rows.append({
            "source_pack_id": pack_id,
            "source_pack_name": str(pack_df["pack_name"].iloc[0]),
            "row_count": int(len(pack_df)),
            "proposed_pack_id": spec["proposed_pack_id"],
            "proposed_pack_name": spec["proposed_pack_name"],
            "proposed_target_phoneme_es": spec["proposed_target_phoneme_es"],
            "proposed_contrast_phoneme_es": spec["proposed_contrast_phoneme_es"],
            "clinical_goal": spec["clinical_goal"],
            "workspace_file": str(workspace_path),
            "status": "draft",
        })

    with backlog_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(backlog_rows[0].keys()))
        writer.writeheader()
        writer.writerows(backlog_rows)

    print(f"Spanish drill redesign backlog written: {backlog_path}")
    print(f"Workspaces: {len(backlog_rows)}")


if __name__ == "__main__":
    main()
