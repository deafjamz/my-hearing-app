#!/usr/bin/env python3
"""
Ingest Spanish scenarios into the legacy scenarios/scenario_items tables.

This matches the currently deployed ScenarioPlayer path so Spanish scenarios can
ship without waiting for a broader scenario architecture migration.
"""

from __future__ import annotations

import argparse
import json
import uuid
from pathlib import Path

import pandas as pd
from supabase import create_client


ROOT = Path(__file__).resolve().parents[1]
SCENARIOS_CSV = ROOT / "content" / "spanish_templates_1x" / "scenarios_es_launch_template.csv"
ITEMS_CSV = ROOT / "content" / "spanish_templates_1x" / "scenario_items_es_launch_template.csv"
REPORT_PATH = ROOT / "reports" / "spanish_scenarios_ingest_plan.json"


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


def scenario_uuid(source_id: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"soundsteps.es.scenario.{source_id}"))


def item_uuid(source_id: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"soundsteps.es.item.{source_id}"))


def public_audio_url(storage_path: str, supabase_url: str) -> str:
    return f"{supabase_url}/storage/v1/object/public/audio/{storage_path}"


def build_plan(supabase_url: str) -> dict:
    scenarios_df = pd.read_csv(SCENARIOS_CSV)
    items_df = pd.read_csv(ITEMS_CSV)

    scenario_records: list[dict] = []
    item_records: list[dict] = []
    spanish_ids: list[str] = []

    for _, row in scenarios_df.iterrows():
        source_id = str(row["scenario_id"]).strip()
        current_id = scenario_uuid(source_id)
        spanish_ids.append(current_id)
        scenario_records.append({
            "id": current_id,
            "title": row["title_es"],
            "description": row["description_es"],
            "difficulty": int(row["difficulty"]),
            "tier": row["tier"],
            "ambience_path": None,
        })

    scenario_lookup = {
        str(row["scenario_id"]).strip(): scenario_uuid(str(row["scenario_id"]).strip())
        for _, row in scenarios_df.iterrows()
    }

    for _, row in items_df.iterrows():
        source_item_id = str(row["source_row_id"]).strip()
        scenario_source_id = str(row["scenario_id"]).strip()
        storage_path = f"spanish/scenarios/sergio_roma/{source_item_id}.mp3"
        item_records.append({
            "id": item_uuid(source_item_id),
            "scenario_id": scenario_lookup[scenario_source_id],
            "speaker": row["speaker"],
            "text": row["text_es"],
            "audio_path": public_audio_url(storage_path, supabase_url),
            "order": int(row["order"]),
        })

    return {
        "scenario_records": scenario_records,
        "item_records": item_records,
        "spanish_scenario_ids": spanish_ids,
    }


def write_report(plan: dict) -> None:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps({
        "scenario_count": len(plan["scenario_records"]),
        "item_count": len(plan["item_records"]),
        "spanish_scenario_ids": plan["spanish_scenario_ids"],
    }, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest Spanish scenarios into legacy tables")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    supabase_url = get_env("SUPABASE_URL")
    service_role = get_env("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_role:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

    plan = build_plan(supabase_url)
    write_report(plan)

    print(json.dumps({
        "scenario_count": len(plan["scenario_records"]),
        "item_count": len(plan["item_records"]),
        "report": str(REPORT_PATH),
        "apply": args.apply,
    }, indent=2))

    if not args.apply:
        return

    client = create_client(supabase_url, service_role)
    client.table("scenarios").upsert(plan["scenario_records"]).execute()

    batch_size = 100
    items = plan["item_records"]
    for index in range(0, len(items), batch_size):
        client.table("scenario_items").upsert(items[index:index + batch_size]).execute()

    print("Spanish legacy scenario ingest complete")


if __name__ == "__main__":
    main()
