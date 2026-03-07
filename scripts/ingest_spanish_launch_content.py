#!/usr/bin/env python3
"""
Spanish launch content ingest for Supabase.

What this script handles now:
- sentences
- conversations
- phoneme drills
- detection

What it intentionally does not handle yet:
- scenarios (runtime still uses scenarios/scenario_items, not stimuli_catalog)
"""

from __future__ import annotations

import argparse
import json
import unicodedata
import uuid
from pathlib import Path
from typing import Iterable

import pandas as pd
from supabase import Client, create_client


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TEMPLATES_DIR = ROOT / "content" / "spanish_templates_1x"
DEFAULT_REPORT_PATH = ROOT / "reports" / "spanish_ingest_plan.json"
VOICE_IDS = ("sergio", "roma")
APPROVED_DRILL_STATUSES = {"", "machine_translated", "clinically_reviewed", "approved_for_launch"}
UUID_NAMESPACE = uuid.UUID("3cb41992-5ab6-4f8a-9f93-71ba0f6714e0")


def get_key_from_env_file(key_name: str, file_path: Path) -> str | None:
    if not file_path.exists():
        return None
    with file_path.open("r", encoding="utf-8") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                if key.strip() == key_name:
                    return value.strip()
    return None


def slugify_audio_token(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.strip().lower())
    ascii_only = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    cleaned = []
    prev_underscore = False
    for char in ascii_only:
        keep = char.isalnum() or char in {"_", "-"}
        if keep:
            cleaned.append(char)
            prev_underscore = False
        elif not prev_underscore:
            cleaned.append("_")
            prev_underscore = True
    token = "".join(cleaned).strip("_")
    return (token[:64] or "item")


def deterministic_uuid(*parts: str) -> str:
    return str(uuid.uuid5(UUID_NAMESPACE, "::".join(parts)))


def clean_value(value):
    return None if pd.isna(value) else value


def cleaned_dict(data: dict) -> dict:
    return {key: clean_value(value) for key, value in data.items()}


def create_supabase_client() -> Client:
    env_path = ROOT / ".env"
    url = get_key_from_env_file("SUPABASE_URL", env_path)
    key = get_key_from_env_file("SUPABASE_SERVICE_ROLE_KEY", env_path)
    if not url or not key:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
    return create_client(url, key)


def chunked(items: list[dict], size: int) -> Iterable[list[dict]]:
    for idx in range(0, len(items), size):
        yield items[idx:idx + size]


def build_sentence_records(df: pd.DataFrame) -> tuple[list[dict], list[dict]]:
    stimuli: list[dict] = []
    audio_assets: list[dict] = []

    for _, row in df.iterrows():
        source_row_id = str(row["source_row_id"]).strip()
        sentence_id = deterministic_uuid("sentence", "es", source_row_id)
        metadata = cleaned_dict({
            "content_language": "es",
            "source_row_id": source_row_id,
            "target_keyword": row["correct_answer_es"],
            "target_phoneme": row["target_phoneme"],
            "question_text": row["question_text_es"],
            "correct_answer": row["correct_answer_es"],
            "acoustic_foil": row.get("acoustic_foil_es"),
            "semantic_foil": row.get("semantic_foil_es"),
            "distractor_1": row.get("acoustic_foil_es"),
            "distractor_2": row.get("semantic_foil_es"),
            "distractor_3": None,
            "scenario": row["scenario"],
            "difficulty": int(row["difficulty"]),
            "translation_status": row.get("translation_status", ""),
        })
        stimuli.append(cleaned_dict({
            "id": sentence_id,
            "content_type": "sentence",
            "type": "sentence",
            "content_text": row["sentence_text_es"],
            "text_alt": None,
            "erber_level": "comprehension",
            "difficulty": int(row["difficulty"]),
            "target_phoneme": row["target_phoneme"],
            "contrast_phoneme": None,
            "phoneme_position": None,
            "clinical_metadata": metadata,
            "training_metadata": metadata,
            "tier": row.get("tier", "free") if "tier" in row else "free",
            "drill_pack_id": None,
            "prompt_text": None,
            "response_text": None,
        }))

        for voice_id in VOICE_IDS:
            storage_path = f"spanish/sentences/{voice_id}/{source_row_id}.mp3"
            audio_assets.append({
                "id": deterministic_uuid("audio", storage_path),
                "stimuli_id": sentence_id,
                "voice_id": voice_id,
                "storage_path": storage_path,
                "verified_rms_db": -20,
                "duration_ms": None,
                "speaking_rate": "normal",
            })

    return stimuli, audio_assets


def build_conversation_records(df: pd.DataFrame) -> tuple[list[dict], list[str]]:
    stimuli: list[dict] = []
    storage_paths: list[str] = []

    for _, row in df.iterrows():
        source_row_id = str(row["source_row_id"]).strip()
        conversation_id = deterministic_uuid("conversation", "es", source_row_id)
        metadata = cleaned_dict({
            "content_language": "es",
            "source_row_id": source_row_id,
            "csv_id": row["id"],
            "category": row["category"],
            "target_keyword": row["target_keyword_es"],
            "acoustic_foil": row["acoustic_foil_es"],
            "semantic_foil": row["semantic_foil_es"],
            "plausible_foil": row["plausible_foil_es"],
            "translation_status": row.get("translation_status", ""),
        })
        stimuli.append(cleaned_dict({
            "id": conversation_id,
            "content_type": "conversation",
            "type": "word",
            "content_text": row["prompt_text_es"],
            "text_alt": None,
            "erber_level": "comprehension",
            "difficulty": int(row["difficulty"]),
            "target_phoneme": row.get("target_phoneme"),
            "contrast_phoneme": None,
            "phoneme_position": None,
            "clinical_metadata": metadata,
            "training_metadata": None,
            "tier": row["tier"],
            "drill_pack_id": None,
            "prompt_text": row["prompt_text_es"],
            "response_text": row["response_text_es"],
        }))

        for voice_id in VOICE_IDS:
            for suffix in ("prompt", "response"):
                storage_paths.append(f"spanish/conversations/{voice_id}/{source_row_id}_{suffix}.mp3")

    return stimuli, storage_paths


def build_drill_records(df: pd.DataFrame) -> tuple[list[dict], list[str]]:
    approved_df = df[df["translation_status"].fillna("").isin(APPROVED_DRILL_STATUSES)].copy()
    stimuli: list[dict] = []
    storage_paths: list[str] = []

    for _, row in approved_df.iterrows():
        source_row_id = str(row["source_row_id"]).strip()
        drill_id = deterministic_uuid("phoneme_drill", "es", source_row_id)
        metadata = cleaned_dict({
            "content_language": "es",
            "source_row_id": source_row_id,
            "csv_id": row["id"],
            "word_1": row["word_1_es"],
            "word_2": row["word_2_es"],
            "pack_name": row["pack_name"],
            "contrast_type": row["contrast_type"],
            "ipa_1": row["ipa_1"],
            "ipa_2": row["ipa_2"],
            "frequency_rank": row["frequency_rank"],
            "clinical_note": row.get("clinical_note_es") or row.get("clinical_note_en", ""),
            "translation_status": row.get("translation_status", ""),
        })
        stimuli.append(cleaned_dict({
            "id": drill_id,
            "content_type": "phoneme_drill",
            "type": "word",
            "content_text": row["word_1_es"],
            "text_alt": row["word_2_es"],
            "erber_level": "discrimination",
            "difficulty": int(row["difficulty"]),
            "target_phoneme": row["target_phoneme_es"],
            "contrast_phoneme": row["contrast_phoneme_es"],
            "phoneme_position": row["position"],
            "clinical_metadata": metadata,
            "training_metadata": None,
            "tier": row["tier"],
            "drill_pack_id": row["drill_pack_id"],
            "prompt_text": None,
            "response_text": None,
        }))

        for voice_id in VOICE_IDS:
            for word in (row["word_1_es"], row["word_2_es"]):
                storage_paths.append(
                    f"spanish/drills/{voice_id}/{row['drill_pack_id']}/"
                    f"{source_row_id}_{slugify_audio_token(word)}.mp3"
                )

    return stimuli, storage_paths


def build_detection_records(df: pd.DataFrame) -> tuple[list[dict], list[dict]]:
    stimuli: list[dict] = []
    audio_assets: list[dict] = []

    for _, row in df.iterrows():
        source_row_id = str(row["id"]).strip()
        stimulus_id = deterministic_uuid("detection", "es", source_row_id)
        metadata = cleaned_dict({
            "content_language": "es",
            "source_row_id": source_row_id,
            "block_type": row["block_type"],
            "acoustic_focus": row["acoustic_focus"],
            "clinical_note": row["clinical_note_es"],
            "status": row["status"],
        })
        stimuli.append(cleaned_dict({
            "id": stimulus_id,
            "content_type": "sentence",
            "type": "sentence",
            "content_text": row["stimulus_text_es"],
            "text_alt": None,
            "erber_level": "detection",
            "difficulty": int(row["difficulty"]),
            "target_phoneme": None,
            "contrast_phoneme": None,
            "phoneme_position": None,
            "clinical_metadata": metadata,
            "training_metadata": metadata,
            "tier": row["tier"],
            "drill_pack_id": None,
            "prompt_text": None,
            "response_text": None,
        }))

        for voice_id in VOICE_IDS:
            storage_path = f"spanish/detection/{voice_id}/{source_row_id}.mp3"
            audio_assets.append({
                "id": deterministic_uuid("audio", storage_path),
                "stimuli_id": stimulus_id,
                "voice_id": voice_id,
                "storage_path": storage_path,
                "verified_rms_db": -20,
                "duration_ms": None,
                "speaking_rate": "normal",
            })

    return stimuli, audio_assets


def build_plan(templates_dir: Path) -> dict:
    sentences_df = pd.read_csv(templates_dir / "sentences_es_launch_template.csv")
    conversations_df = pd.read_csv(templates_dir / "conversations_es_launch_template.csv")
    drills_df = pd.read_csv(templates_dir / "phoneme_drills_es_launch_template.csv")
    detection_df = pd.read_csv(templates_dir / "detection_es_launch_template.csv")
    scenarios_df = pd.read_csv(templates_dir / "scenario_items_es_launch_template.csv")

    sentence_stimuli, sentence_audio = build_sentence_records(sentences_df)
    conversation_stimuli, conversation_storage_paths = build_conversation_records(conversations_df)
    drill_stimuli, drill_storage_paths = build_drill_records(drills_df)
    detection_stimuli, detection_audio = build_detection_records(detection_df)

    return {
        "stimuli": {
            "sentences": sentence_stimuli,
            "conversations": conversation_stimuli,
            "drills": drill_stimuli,
            "detection": detection_stimuli,
        },
        "audio_assets": {
            "sentences": sentence_audio,
            "detection": detection_audio,
        },
        "derived_storage_only": {
            "conversations": conversation_storage_paths,
            "drills": drill_storage_paths,
            "reason": "audio_assets is unique on (stimuli_id, voice_id), so multi-file speech activities use derived storage paths in the runtime.",
        },
        "deferred": {
            "scenario_rows": int(len(scenarios_df)),
            "reason": "Scenarios still need production schema/runtime alignment.",
        },
    }


def write_report(report_path: Path, plan: dict) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    summary = {
        "stimuli_counts": {phase: len(records) for phase, records in plan["stimuli"].items()},
        "audio_asset_counts": {phase: len(records) for phase, records in plan["audio_assets"].items()},
        "derived_storage_only_counts": {phase: len(paths) for phase, paths in plan["derived_storage_only"].items() if phase != "reason"},
        "deferred": plan["deferred"],
    }
    report_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")


def apply_records(client: Client, table: str, records: list[dict], batch_size: int) -> None:
    for batch in chunked(records, batch_size):
        client.table(table).upsert(batch, on_conflict="id").execute()


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest Spanish launch content into Supabase")
    parser.add_argument("--templates-dir", default=str(DEFAULT_TEMPLATES_DIR))
    parser.add_argument("--report", default=str(DEFAULT_REPORT_PATH))
    parser.add_argument("--apply", action="store_true", help="Write records to Supabase")
    parser.add_argument("--batch-size", type=int, default=250)
    args = parser.parse_args()

    templates_dir = Path(args.templates_dir)
    report_path = Path(args.report)
    plan = build_plan(templates_dir)
    write_report(report_path, plan)

    print("Spanish ingest plan")
    print(json.dumps({
        "stimuli_counts": {phase: len(records) for phase, records in plan["stimuli"].items()},
        "audio_asset_counts": {phase: len(records) for phase, records in plan["audio_assets"].items()},
        "derived_storage_only_counts": {phase: len(paths) for phase, paths in plan["derived_storage_only"].items() if phase != "reason"},
        "deferred": plan["deferred"],
        "report": str(report_path),
        "apply": args.apply,
    }, indent=2))

    if not args.apply:
        return

    client = create_supabase_client()
    for phase in ("sentences", "conversations", "drills", "detection"):
        apply_records(client, "stimuli_catalog", plan["stimuli"][phase], args.batch_size)
    for phase in ("sentences", "detection"):
        apply_records(client, "audio_assets", plan["audio_assets"][phase], args.batch_size)

    print("Supabase ingest complete")


if __name__ == "__main__":
    main()
