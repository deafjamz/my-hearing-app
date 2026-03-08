#!/usr/bin/env python3
"""
Promote Spanish drill rows from clinically_reviewed to approved_for_launch
only after the automated drill audio audit passes.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TEMPLATE = ROOT / "content" / "spanish_templates_1x" / "phoneme_drills_es_launch_template.csv"
DEFAULT_AUDIT = ROOT / "reports" / "spanish_drill_audio_audit.json"


def load_audit(audit_path: Path) -> dict:
    data = json.loads(audit_path.read_text(encoding="utf-8"))
    if data.get("status") != "ok":
        raise SystemExit(f"Audio audit not clean: {audit_path}")
    return data


def promote_template(template_path: Path) -> int:
    with template_path.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
        fieldnames = rows[0].keys()

    promoted = 0
    for row in rows:
        if row.get("translation_status") == "clinically_reviewed":
            row["translation_status"] = "approved_for_launch"
            promoted += 1

    with template_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    return promoted


def main() -> None:
    parser = argparse.ArgumentParser(description="Promote Spanish drill rows to approved_for_launch")
    parser.add_argument("--template", type=Path, default=DEFAULT_TEMPLATE)
    parser.add_argument("--audit", type=Path, default=DEFAULT_AUDIT)
    args = parser.parse_args()

    template_path = args.template if args.template.is_absolute() else (ROOT / args.template)
    audit_path = args.audit if args.audit.is_absolute() else (ROOT / args.audit)

    load_audit(audit_path)
    promoted = promote_template(template_path)
    print(json.dumps({"promoted_rows": promoted, "template": str(template_path)}, indent=2))


if __name__ == "__main__":
    main()
