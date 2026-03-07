#!/usr/bin/env python3
"""
Verify Spanish rollout state against live Supabase.

Checks:
- Spanish stimuli counts in stimuli_catalog
- Spanish audio_assets counts for sentence + detection content
- Legacy Spanish scenario counts in scenarios/scenario_items
- preferred_language column availability on profiles

Writes a machine-readable report to reports/spanish_rollout_verification.json.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from supabase import Client, create_client


ROOT = Path(__file__).resolve().parents[1]
REPORT_PATH = ROOT / "reports" / "spanish_rollout_verification.json"
SCENARIO_REPORT_PATH = ROOT / "reports" / "spanish_scenarios_ingest_plan.json"

EXPECTED_COUNTS = {
    "sentences_es": 1000,
    "conversations_es": 160,
    "drills_es": 492,
    "detection_es": 18,
    "audio_sentences_es": 2000,
    "audio_detection_es": 36,
    "legacy_scenarios_es": 80,
    "legacy_scenario_items_es": 640,
}


def get_env(key: str) -> str | None:
    env_path = ROOT / ".env"
    if not env_path.exists():
        return None
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if line and not line.startswith("#") and "=" in line:
            current_key, value = line.split("=", 1)
            if current_key.strip() == key:
                return value.strip()
    return None


def create_supabase_client() -> Client:
    supabase_url = get_env("SUPABASE_URL")
    service_role = get_env("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_role:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
    return create_client(supabase_url, service_role)


def load_spanish_scenario_ids() -> list[str]:
    report = json.loads(SCENARIO_REPORT_PATH.read_text(encoding="utf-8"))
    return report["spanish_scenario_ids"]


def check_preferred_language_column(client: Client) -> dict[str, Any]:
    try:
        client.table("profiles").select("id,preferred_language").limit(1).execute()
        return {"available": True, "error": None}
    except Exception as exc:  # pragma: no cover - transport/library error shape varies
        return {"available": False, "error": str(exc)}


def verify_rollout() -> dict[str, Any]:
    client = create_supabase_client()
    scenario_ids = load_spanish_scenario_ids()

    counts = {
        "sentences_es": client.table("stimuli_catalog").select("id", count="exact").eq(
            "content_type", "sentence"
        ).eq("clinical_metadata->>content_language", "es").neq("erber_level", "detection").execute().count,
        "conversations_es": client.table("stimuli_catalog").select("id", count="exact").eq(
            "content_type", "conversation"
        ).eq("clinical_metadata->>content_language", "es").execute().count,
        "drills_es": client.table("stimuli_catalog").select("id", count="exact").eq(
            "content_type", "phoneme_drill"
        ).eq("clinical_metadata->>content_language", "es").execute().count,
        "detection_es": client.table("stimuli_catalog").select("id", count="exact").eq(
            "content_type", "sentence"
        ).eq("clinical_metadata->>content_language", "es").eq("erber_level", "detection").execute().count,
        "audio_sentences_es": client.table("audio_assets").select("id", count="exact").like(
            "storage_path", "spanish/sentences/%"
        ).execute().count,
        "audio_detection_es": client.table("audio_assets").select("id", count="exact").like(
            "storage_path", "spanish/detection/%"
        ).execute().count,
        "legacy_scenarios_es": client.table("scenarios").select("id", count="exact").in_(
            "id", scenario_ids
        ).execute().count,
        "legacy_scenario_items_es": client.table("scenario_items").select("id", count="exact").in_(
            "scenario_id", scenario_ids
        ).execute().count,
    }

    mismatches = {
        key: {"expected": expected, "actual": counts.get(key)}
        for key, expected in EXPECTED_COUNTS.items()
        if counts.get(key) != expected
    }
    preferred_language_column = check_preferred_language_column(client)
    blockers: list[str] = []
    if mismatches:
        blockers.append("Spanish rollout counts do not match expected live totals.")
    if not preferred_language_column["available"]:
        blockers.append("profiles.preferred_language is still missing in the live database.")

    result = {
        "expected_counts": EXPECTED_COUNTS,
        "actual_counts": counts,
        "mismatches": mismatches,
        "preferred_language_column": preferred_language_column,
        "blockers": blockers,
        "status": "ok" if not blockers else ("mismatch" if mismatches else "warning"),
    }

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


def main() -> None:
    result = verify_rollout()
    print(json.dumps(result, indent=2))
    if result["mismatches"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
