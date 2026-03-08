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
    "pack_s_vs_sh": {
        "proposed_pack_id": "pack_es_s_vs_tch",
        "proposed_pack_name": "Fricative/Affricate: /s/ vs /tʃ/",
        "proposed_target_phoneme_es": "/s/",
        "proposed_contrast_phoneme_es": "/tʃ/",
        "clinical_goal": "replace non-panregional /ʃ/ with a Spanish-valid high-frequency contrast",
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
    "pack_f_vs_v": {
        "proposed_pack_id": "pack_es_f_vs_b",
        "proposed_pack_name": "Fricative Contrast: /f/ vs /b/",
        "proposed_target_phoneme_es": "/f/",
        "proposed_contrast_phoneme_es": "/b/",
        "clinical_goal": "replace English /f/ vs /v/ with a Spanish-native labial contrast",
    },
    "drill_pack_17": {
        "proposed_pack_id": "pack_es_b_vs_m_initial",
        "proposed_pack_name": "Labial Contrast: /b/ vs /m/ Initial",
        "proposed_target_phoneme_es": "/b/",
        "proposed_contrast_phoneme_es": "/m/",
        "clinical_goal": "replace orthographic b/v with a real Spanish labial contrast",
    },
    "drill_pack_11": {
        "proposed_pack_id": "pack_es_s_vs_tch_initial",
        "proposed_pack_name": "Fricative/Affricate: /s/ vs /tʃ/ Initial",
        "proposed_target_phoneme_es": "/s/",
        "proposed_contrast_phoneme_es": "/tʃ/",
        "clinical_goal": "replace English /s/ vs /ʃ/ with a Spanish-valid initial contrast",
    },
    "drill_pack_12": {
        "proposed_pack_id": "pack_es_l_vs_r_final",
        "proposed_pack_name": "Liquid Contrast: /l/ vs /r/ Final",
        "proposed_target_phoneme_es": "/l/",
        "proposed_contrast_phoneme_es": "/r/",
        "clinical_goal": "replace English final /s/ vs /ʃ/ with a Spanish-valid coda contrast",
    },
    "drill_pack_16": {
        "proposed_pack_id": "pack_es_m_vs_n_medial",
        "proposed_pack_name": "Nasal Contrast: /m/ vs /n/ Medial",
        "proposed_target_phoneme_es": "/m/",
        "proposed_contrast_phoneme_es": "/n/",
        "clinical_goal": "retain nasal place discrimination with a stable Spanish medial contrast",
    },
    "drill_pack_18": {
        "proposed_pack_id": "pack_es_i_vs_e_medial",
        "proposed_pack_name": "Vowel Contrast: /i/ vs /e/ Medial",
        "proposed_target_phoneme_es": "/i/",
        "proposed_contrast_phoneme_es": "/e/",
        "clinical_goal": "replace English tense/lax front-vowel logic with a Spanish vowel contrast",
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
    "drill_pack_22": {
        "proposed_pack_id": "pack_es_palatal_redesign",
        "proposed_pack_name": "Palatal Contrast Redesign",
        "proposed_target_phoneme_es": "/ʝ/",
        "proposed_contrast_phoneme_es": "/tʃ/",
        "clinical_goal": "replace English affricate/fricative logic with a Spanish-valid palatal contrast",
    },
    "drill_pack_23": {
        "proposed_pack_id": "pack_es_pl_vs_pr_initial",
        "proposed_pack_name": "Cluster Contrast: /pl/ vs /pr/ Initial",
        "proposed_target_phoneme_es": "/pl/",
        "proposed_contrast_phoneme_es": "/pr/",
        "clinical_goal": "replace English s-stop clusters with a Spanish-valid onset cluster contrast",
    },
    "drill_pack_24": {
        "proposed_pack_id": "pack_es_final_s_vs_null",
        "proposed_pack_name": "Final Awareness: /s/ vs null",
        "proposed_target_phoneme_es": "/s/",
        "proposed_contrast_phoneme_es": "null",
        "clinical_goal": "replace English final /t/ deletion awareness with a Spanish-final contrast",
    },
    "drill_pack_25": {
        "proposed_pack_id": "pack_es_advanced_mix",
        "proposed_pack_name": "Advanced Spanish Contrast Mix",
        "proposed_target_phoneme_es": "multiple",
        "proposed_contrast_phoneme_es": "multiple",
        "clinical_goal": "rebuild the hardest-pairs block only from validated Spanish-native contrast families",
    },
    "pack_i_vs_I": {
        "proposed_pack_id": "pack_es_i_vs_e",
        "proposed_pack_name": "Vowel Contrast: /i/ vs /e/",
        "proposed_target_phoneme_es": "/i/",
        "proposed_contrast_phoneme_es": "/e/",
        "clinical_goal": "replace English tense/lax high-front vowel logic with a Spanish vowel contrast",
    },
    "pack_e_vs_ae": {
        "proposed_pack_id": "pack_es_e_vs_a",
        "proposed_pack_name": "Vowel Contrast: /e/ vs /a/",
        "proposed_target_phoneme_es": "/e/",
        "proposed_contrast_phoneme_es": "/a/",
        "clinical_goal": "replace English mid-front/low-front vowel logic with a Spanish vowel contrast",
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
