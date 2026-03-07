#!/usr/bin/env python3
"""
Build Spanish rewrite queues for comprehension content that failed validation.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import pandas as pd

from validate_spanish_launch_content import normalize_text


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_TEMPLATES_DIR = ROOT / "content" / "spanish_templates_1x"


def build_sentence_queue(df: pd.DataFrame) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for _, row in df.iterrows():
        answer = normalize_text(row.get("correct_answer_es"))
        acoustic = normalize_text(row.get("acoustic_foil_es"))
        semantic = normalize_text(row.get("semantic_foil_es"))

        issues: list[str] = []
        if answer == acoustic:
            issues.append("acoustic_foil_collapses_to_correct_answer")
        if answer == semantic:
            issues.append("semantic_foil_collapses_to_correct_answer")
        if not issues:
            continue

        rows.append({
            "source_row_id": str(row.get("source_row_id", "")),
            "scenario": str(row.get("scenario", "")),
            "difficulty": str(row.get("difficulty", "")),
            "issue": ";".join(issues),
            "sentence_text_en": str(row.get("sentence_text_en", "")),
            "sentence_text_es": str(row.get("sentence_text_es", "")),
            "correct_answer_en": str(row.get("correct_answer_en", "")),
            "correct_answer_es": str(row.get("correct_answer_es", "")),
            "acoustic_foil_en": str(row.get("acoustic_foil_en", "")),
            "acoustic_foil_es": str(row.get("acoustic_foil_es", "")),
            "semantic_foil_en": str(row.get("semantic_foil_en", "")),
            "semantic_foil_es": str(row.get("semantic_foil_es", "")),
            "translation_status": str(row.get("translation_status", "")),
        })
    return rows


def build_conversation_queue(df: pd.DataFrame) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for _, row in df.iterrows():
        values = {
            "target_keyword_es": normalize_text(row.get("target_keyword_es")),
            "acoustic_foil_es": normalize_text(row.get("acoustic_foil_es")),
            "semantic_foil_es": normalize_text(row.get("semantic_foil_es")),
            "plausible_foil_es": normalize_text(row.get("plausible_foil_es")),
        }
        if len(set(values.values())) == len(values):
            continue

        issues: list[str] = []
        items = list(values.items())
        for idx, (left_name, left_value) in enumerate(items):
            for right_name, right_value in items[idx + 1:]:
                if left_value and left_value == right_value:
                    issues.append(f"{left_name}={right_name}")

        rows.append({
            "source_row_id": str(row.get("source_row_id", "")),
            "id": str(row.get("id", "")),
            "category": str(row.get("category", "")),
            "difficulty": str(row.get("difficulty", "")),
            "issue": ";".join(issues),
            "prompt_text_en": str(row.get("prompt_text_en", "")),
            "prompt_text_es": str(row.get("prompt_text_es", "")),
            "response_text_en": str(row.get("response_text_en", "")),
            "response_text_es": str(row.get("response_text_es", "")),
            "target_keyword_en": str(row.get("target_keyword_en", "")),
            "target_keyword_es": str(row.get("target_keyword_es", "")),
            "acoustic_foil_en": str(row.get("acoustic_foil_en", "")),
            "acoustic_foil_es": str(row.get("acoustic_foil_es", "")),
            "semantic_foil_en": str(row.get("semantic_foil_en", "")),
            "semantic_foil_es": str(row.get("semantic_foil_es", "")),
            "plausible_foil_en": str(row.get("plausible_foil_en", "")),
            "plausible_foil_es": str(row.get("plausible_foil_es", "")),
            "translation_status": str(row.get("translation_status", "")),
        })
    return rows


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8")
        return

    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Spanish rewrite queues")
    parser.add_argument("--templates-dir", type=Path, default=DEFAULT_TEMPLATES_DIR)
    args = parser.parse_args()

    templates_dir = args.templates_dir if args.templates_dir.is_absolute() else (ROOT / args.templates_dir)
    sentences = pd.read_csv(templates_dir / "sentences_es_launch_template.csv")
    conversations = pd.read_csv(templates_dir / "conversations_es_launch_template.csv")

    sentence_rows = build_sentence_queue(sentences)
    conversation_rows = build_conversation_queue(conversations)

    sentence_path = templates_dir / "sentences_foil_rewrite_queue.csv"
    conversation_path = templates_dir / "conversations_foil_rewrite_queue.csv"
    summary_path = templates_dir / "rewrite_queue_summary.json"

    write_csv(sentence_path, sentence_rows)
    write_csv(conversation_path, conversation_rows)
    summary_path.write_text(
        json.dumps(
            {
                "sentences_requiring_rewrite": len(sentence_rows),
                "conversations_requiring_rewrite": len(conversation_rows),
                "sentence_queue": str(sentence_path),
                "conversation_queue": str(conversation_path),
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    print("Spanish rewrite queues updated")
    print(f"  sentences: {len(sentence_rows)} -> {sentence_path}")
    print(f"  conversations: {len(conversation_rows)} -> {conversation_path}")
    print(f"  summary: {summary_path}")


if __name__ == "__main__":
    main()
