#!/usr/bin/env python3
"""
Build Spanish drill review queue CSVs from the launch template.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_TEMPLATE = ROOT / "content" / "spanish_templates_1x" / "phoneme_drills_es_launch_template.csv"
DEFAULT_OUTPUT_DIR = ROOT / "content" / "spanish_templates_1x"


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Spanish drill review queues")
    parser.add_argument("--template", type=Path, default=DEFAULT_TEMPLATE)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    args = parser.parse_args()

    template_path = args.template if args.template.is_absolute() else (ROOT / args.template)
    output_dir = args.output_dir if args.output_dir.is_absolute() else (ROOT / args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(template_path)
    review_cols = [
        "id",
        "drill_pack_id",
        "pack_name",
        "contrast_type",
        "difficulty",
        "tier",
        "word_1_en",
        "word_1_es",
        "word_2_en",
        "word_2_es",
        "target_phoneme_en",
        "target_phoneme_es",
        "contrast_phoneme_en",
        "contrast_phoneme_es",
        "clinical_note_en",
        "clinical_note_es",
        "translation_status",
    ]

    clinical_review = df[df["translation_status"] == "needs_clinical_review"][review_cols]
    pack_redesign = df[df["translation_status"] == "needs_pack_redesign"][review_cols]

    clinical_path = output_dir / "phoneme_drills_clinical_review_queue.csv"
    redesign_path = output_dir / "phoneme_drills_pack_redesign_queue.csv"

    clinical_review.to_csv(clinical_path, index=False)
    pack_redesign.to_csv(redesign_path, index=False)

    print("Spanish review queues updated")
    print(f"  clinical_review: {len(clinical_review)} -> {clinical_path}")
    print(f"  pack_redesign:   {len(pack_redesign)} -> {redesign_path}")


if __name__ == "__main__":
    main()
