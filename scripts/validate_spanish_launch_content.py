#!/usr/bin/env python3
"""
Validate Spanish launch templates before audio generation or Supabase ingest.

The goal is to block English-shaped or acoustically collapsed Spanish content
from entering the production pipeline.
"""

from __future__ import annotations

import argparse
import json
import unicodedata
from pathlib import Path
from typing import Any

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TEMPLATES_DIR = ROOT / "content" / "spanish_templates_1x"
APPROVED_DRILL_STATUSES = {"clinically_reviewed", "approved_for_launch"}
KNOWN_ENGLISH_SHAPED_PACKS = {
    "pack_s_vs_z",
    "pack_th_voiced_unvoiced",
    "pack_ch_vs_j",
    "drill_pack_19",
    "drill_pack_20",
    "drill_pack_21",
}


def normalize_text(value: Any) -> str:
    text = "" if value is None else str(value)
    text = unicodedata.normalize("NFD", text.strip().casefold())
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    return " ".join(text.split())


def read_csv(templates_dir: Path, filename: str) -> pd.DataFrame:
    path = templates_dir / filename
    if not path.exists():
        raise FileNotFoundError(path)
    return pd.read_csv(path)


def append_error(errors: list[dict[str, Any]], corpus: str, row_id: str, issue: str, details: dict[str, Any]) -> None:
    errors.append({
        "corpus": corpus,
        "row_id": row_id,
        "issue": issue,
        "details": details,
    })


def validate_sentences(df: pd.DataFrame, errors: list[dict[str, Any]]) -> None:
    for _, row in df.iterrows():
        row_id = str(row.get("source_row_id", ""))
        required_fields = ("sentence_text_es", "question_text_es", "correct_answer_es", "acoustic_foil_es", "semantic_foil_es")
        missing = [field for field in required_fields if not normalize_text(row.get(field))]
        if missing:
            append_error(errors, "sentences", row_id, "missing_spanish_fields", {"fields": missing})
            continue

        answer = normalize_text(row.get("correct_answer_es"))
        acoustic = normalize_text(row.get("acoustic_foil_es"))
        semantic = normalize_text(row.get("semantic_foil_es"))

        if answer == acoustic:
            append_error(
                errors,
                "sentences",
                row_id,
                "acoustic_foil_collapses_to_correct_answer",
                {
                    "correct_answer_es": row.get("correct_answer_es"),
                    "acoustic_foil_es": row.get("acoustic_foil_es"),
                },
            )
        if answer == semantic:
            append_error(
                errors,
                "sentences",
                row_id,
                "semantic_foil_collapses_to_correct_answer",
                {
                    "correct_answer_es": row.get("correct_answer_es"),
                    "semantic_foil_es": row.get("semantic_foil_es"),
                },
            )


def validate_conversations(df: pd.DataFrame, errors: list[dict[str, Any]]) -> None:
    for _, row in df.iterrows():
        row_id = str(row.get("source_row_id", row.get("id", "")))
        required_fields = (
            "prompt_text_es",
            "response_text_es",
            "target_keyword_es",
            "acoustic_foil_es",
            "semantic_foil_es",
            "plausible_foil_es",
        )
        missing = [field for field in required_fields if not normalize_text(row.get(field))]
        if missing:
            append_error(errors, "conversations", row_id, "missing_spanish_fields", {"fields": missing})
            continue

        values = {
            "target_keyword_es": normalize_text(row.get("target_keyword_es")),
            "acoustic_foil_es": normalize_text(row.get("acoustic_foil_es")),
            "semantic_foil_es": normalize_text(row.get("semantic_foil_es")),
            "plausible_foil_es": normalize_text(row.get("plausible_foil_es")),
        }
        if len(set(values.values())) < len(values):
            append_error(
                errors,
                "conversations",
                row_id,
                "foil_set_contains_duplicates",
                {
                    "target_keyword_es": row.get("target_keyword_es"),
                    "acoustic_foil_es": row.get("acoustic_foil_es"),
                    "semantic_foil_es": row.get("semantic_foil_es"),
                    "plausible_foil_es": row.get("plausible_foil_es"),
                },
            )


def validate_drills(df: pd.DataFrame, errors: list[dict[str, Any]]) -> None:
    for _, row in df.iterrows():
        row_id = str(row.get("id", row.get("source_row_id", "")))
        status = normalize_text(row.get("translation_status"))
        pack_id = str(row.get("drill_pack_id", "")).strip()

        if status == "machine_translated":
            append_error(
                errors,
                "drills",
                row_id,
                "machine_translated_drills_are_not_launch_safe",
                {"drill_pack_id": pack_id},
            )

        if status not in APPROVED_DRILL_STATUSES:
            continue

        word_1 = normalize_text(row.get("word_1_es"))
        word_2 = normalize_text(row.get("word_2_es"))
        target = normalize_text(row.get("target_phoneme_es"))
        contrast = normalize_text(row.get("contrast_phoneme_es"))

        if not word_1 or not word_2:
            append_error(errors, "drills", row_id, "approved_drill_missing_words", {"drill_pack_id": pack_id})
        elif word_1 == word_2:
            append_error(
                errors,
                "drills",
                row_id,
                "approved_drill_collapses_to_same_word",
                {"word_1_es": row.get("word_1_es"), "word_2_es": row.get("word_2_es")},
            )

        if not target or not contrast:
            append_error(
                errors,
                "drills",
                row_id,
                "approved_drill_missing_spanish_phoneme_metadata",
                {
                    "target_phoneme_es": row.get("target_phoneme_es"),
                    "contrast_phoneme_es": row.get("contrast_phoneme_es"),
                },
            )

        if pack_id in KNOWN_ENGLISH_SHAPED_PACKS:
            append_error(
                errors,
                "drills",
                row_id,
                "approved_drill_uses_known_english_shaped_pack",
                {"drill_pack_id": pack_id},
            )


def validate_templates(templates_dir: Path) -> dict[str, Any]:
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []

    sentences = read_csv(templates_dir, "sentences_es_launch_template.csv")
    conversations = read_csv(templates_dir, "conversations_es_launch_template.csv")
    drills = read_csv(templates_dir, "phoneme_drills_es_launch_template.csv")

    validate_sentences(sentences, errors)
    validate_conversations(conversations, errors)
    validate_drills(drills, errors)

    return {"errors": errors, "warnings": warnings}


def summarize_findings(findings: dict[str, Any], limit: int = 10) -> dict[str, Any]:
    errors = findings["errors"]
    by_issue: dict[str, int] = {}
    for error in errors:
        by_issue[error["issue"]] = by_issue.get(error["issue"], 0) + 1

    return {
        "error_count": len(errors),
        "warning_count": len(findings["warnings"]),
        "issues": by_issue,
        "examples": errors[:limit],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate Spanish launch content")
    parser.add_argument("--templates-dir", default=str(DEFAULT_TEMPLATES_DIR))
    parser.add_argument("--json", action="store_true", help="Print full findings as JSON")
    args = parser.parse_args()

    templates_dir = Path(args.templates_dir)
    findings = validate_templates(templates_dir)
    summary = summarize_findings(findings)

    if args.json:
        print(json.dumps(findings, indent=2, ensure_ascii=False))
    else:
        print(json.dumps(summary, indent=2, ensure_ascii=False))

    if findings["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
