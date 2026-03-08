#!/usr/bin/env python3
"""
Build a single Spanish launch-readiness report from current artifacts.

This script does not replace human listening review. It makes that remaining
gate explicit, measurable, and visible.
"""

from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / "reports"
TEMPLATE_PATH = ROOT / "content" / "spanish_templates_1x" / "phoneme_drills_es_launch_template.csv"
VALIDATION_PATH = REPORT_DIR / "spanish_rollout_verification.json"
AUDIO_AUDIT_PATH = REPORT_DIR / "spanish_drill_audio_audit.json"
INGEST_PLAN_PATH = REPORT_DIR / "spanish_ingest_plan.json"
QC_PACKET_PATH = REPORT_DIR / "spanish_listening_qc_packet.csv"
QC_SUMMARY_PATH = REPORT_DIR / "spanish_listening_qc_summary.json"
OUTPUT_PATH = REPORT_DIR / "spanish_launch_readiness.json"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def load_drill_statuses() -> dict[str, int]:
    with TEMPLATE_PATH.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    return dict(Counter(row["translation_status"].strip() for row in rows))


def qc_progress() -> dict[str, object]:
    if not QC_PACKET_PATH.exists():
        return {
            "packet_exists": False,
            "reviewed_rows": 0,
            "pass_rows": 0,
            "flag_rows": 0,
            "pending_rows": 0,
            "status": "missing",
        }

    with QC_PACKET_PATH.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))

    reviewed_rows = 0
    pass_rows = 0
    flag_rows = 0
    for row in rows:
        disposition = row.get("disposition", "").strip().lower()
        if disposition:
            reviewed_rows += 1
            if disposition.startswith("pass"):
                pass_rows += 1
            else:
                flag_rows += 1

    pending_rows = len(rows) - reviewed_rows
    return {
        "packet_exists": True,
        "summary_exists": QC_SUMMARY_PATH.exists(),
        "reviewed_rows": reviewed_rows,
        "pass_rows": pass_rows,
        "flag_rows": flag_rows,
        "pending_rows": pending_rows,
        "total_rows": len(rows),
        "status": (
            "complete_pass"
            if len(rows) and reviewed_rows == len(rows) and flag_rows == 0
            else "complete_with_flags"
            if reviewed_rows == len(rows) and flag_rows > 0
            else "pending_review"
        ),
    }


def build_report() -> dict[str, object]:
    rollout = load_json(VALIDATION_PATH)
    audio_audit = load_json(AUDIO_AUDIT_PATH)
    ingest_plan = load_json(INGEST_PLAN_PATH)
    drill_statuses = load_drill_statuses()
    review = qc_progress()

    automated_gates = {
        "rollout_verification": rollout.get("status") == "ok",
        "drill_audio_audit": audio_audit.get("status") == "ok",
        "drill_template_fully_approved": drill_statuses == {"approved_for_launch": 500},
        "supabase_drill_count": ingest_plan["stimuli_counts"]["drills"] == 500,
    }

    blockers: list[str] = []
    if not automated_gates["rollout_verification"]:
        blockers.append("Live Spanish rollout verification is not green.")
    if not automated_gates["drill_audio_audit"]:
        blockers.append("Spanish drill audio audit is not green.")
    if not automated_gates["drill_template_fully_approved"]:
        blockers.append("Spanish drill template is not fully approved_for_launch.")
    if not automated_gates["supabase_drill_count"]:
        blockers.append("Supabase drill count does not match the expected 500 rows.")

    manual_gate = {
        "human_listening_qc": review["status"],
        "required_for_broad_launch": True,
    }
    if review["status"] != "complete_pass":
        blockers.append("Human bilingual listening QC is not yet complete and clean.")

    report = {
        "automated_gates": automated_gates,
        "manual_gate": manual_gate,
        "drill_status_counts": drill_statuses,
        "qc_progress": review,
        "live_counts": rollout.get("actual_counts", {}),
        "storage_audit": {
            "expected_file_count": audio_audit.get("expected_file_count"),
            "existing_file_count": audio_audit.get("existing_file_count"),
            "sampled_file_count": audio_audit.get("sampled_file_count"),
            "sampled_duration_flags": len(audio_audit.get("sampled_duration_flags", [])),
        },
        "status": "ready_pending_human_qc" if len(blockers) == 1 and blockers[0].startswith("Human bilingual") else "blocked" if blockers else "launch_ready",
        "blockers": blockers,
    }
    return report


def main() -> None:
    report = build_report()
    OUTPUT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
