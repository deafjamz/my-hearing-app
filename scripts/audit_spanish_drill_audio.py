#!/usr/bin/env python3
"""
Audit regenerated Spanish drill audio against the current template.

Checks:
- every expected drill file exists in Supabase Storage
- a deterministic per-pack sample can be downloaded
- sampled files have plausible durations for isolated-word drill playback

Writes a machine-readable report to reports/spanish_drill_audio_audit.json.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import tempfile
from pathlib import Path

import pandas as pd
from supabase import Client, create_client

from ingest_spanish_launch_content import slugify_audio_token


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TEMPLATE = ROOT / "content" / "spanish_templates_1x" / "phoneme_drills_es_launch_template.csv"
DEFAULT_MANIFEST = ROOT / "content" / "spanish_templates_1x" / "spanish_execution_manifest.json"
DEFAULT_REPORT = ROOT / "reports" / "spanish_drill_audio_audit.json"
APPROVED_STATUSES = {"clinically_reviewed", "approved_for_launch"}
MIN_DURATION_S = 0.20
MAX_DURATION_S = 1.60


def get_env(key: str) -> str | None:
    if os.getenv(key):
        return os.getenv(key)
    for env_path in (ROOT / ".env", ROOT / ".env.local"):
        if not env_path.exists():
            continue
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
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    return create_client(supabase_url, service_role)


def load_voice_keys(manifest_path: Path) -> dict[str, str]:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    return {
        "male": manifest["selected_voices"]["male"]["name"].strip().lower().replace(" ", "_"),
        "female": manifest["selected_voices"]["female"]["name"].strip().lower().replace(" ", "_"),
    }


def list_storage_files(client: Client, prefix: str) -> set[str]:
    files: set[str] = set()
    offset = 0
    limit = 1000
    while True:
        batch = client.storage.from_("audio").list(prefix, {"limit": limit, "offset": offset}) or []
        for item in batch:
            name = item.get("name")
            if isinstance(name, str) and name.endswith(".mp3"):
                files.add(f"{prefix}/{name}")
        if len(batch) < limit:
            break
        offset += limit
    return files


def get_duration_seconds(path: str) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            path,
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(result.stdout.strip())


def build_expected_paths(template_path: Path, voice_keys: dict[str, str]) -> tuple[list[str], dict[str, list[str]]]:
    df = pd.read_csv(template_path)
    approved_df = df[df["translation_status"].fillna("").isin(APPROVED_STATUSES)].copy()
    expected_paths: list[str] = []
    by_pack: dict[str, list[str]] = {}

    for _, row in approved_df.iterrows():
        drill_id = str(row["id"]).strip()
        pack_id = str(row["drill_pack_id"]).strip()
        for voice_key in voice_keys.values():
            for word in (str(row["word_1_es"]).strip(), str(row["word_2_es"]).strip()):
                path = f"spanish/drills/{voice_key}/{pack_id}/{drill_id}_{slugify_audio_token(word)}.mp3"
                expected_paths.append(path)
                by_pack.setdefault(f"{voice_key}/{pack_id}", []).append(path)

    return expected_paths, by_pack


def sample_paths_by_pack(by_pack: dict[str, list[str]], per_pack: int) -> list[str]:
    samples: list[str] = []
    for _, paths in sorted(by_pack.items()):
        ordered = sorted(paths)
        if not ordered:
            continue
        picks = ordered[:per_pack]
        if per_pack > 1 and len(ordered) > 1:
            tail_pick = ordered[-1]
            if tail_pick not in picks:
                picks.append(tail_pick)
        samples.extend(picks[:per_pack])
    return samples


def audit_audio(template_path: Path, manifest_path: Path, report_path: Path, per_pack_sample: int) -> dict:
    client = create_supabase_client()
    voice_keys = load_voice_keys(manifest_path)
    expected_paths, by_pack = build_expected_paths(template_path, voice_keys)

    existing_paths: set[str] = set()
    for pack_prefix in sorted(by_pack):
        existing_paths |= list_storage_files(client, f"spanish/drills/{pack_prefix}")

    expected_set = set(expected_paths)
    missing_paths = sorted(expected_set - existing_paths)

    sampled_paths = sample_paths_by_pack(by_pack, per_pack_sample)
    sampled_results: list[dict] = []
    duration_flags: list[dict] = []

    for storage_path in sampled_paths:
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as handle:
            tmp_path = handle.name
        try:
            payload = client.storage.from_("audio").download(storage_path)
            Path(tmp_path).write_bytes(payload)
            duration = get_duration_seconds(tmp_path)
            flagged = duration < MIN_DURATION_S or duration > MAX_DURATION_S
            item = {
                "storage_path": storage_path,
                "duration_s": round(duration, 3),
                "flagged": flagged,
            }
            sampled_results.append(item)
            if flagged:
                duration_flags.append(item)
        finally:
            try:
                os.remove(tmp_path)
            except FileNotFoundError:
                pass

    report = {
        "expected_file_count": len(expected_paths),
        "existing_file_count": len(existing_paths & expected_set),
        "missing_file_count": len(missing_paths),
        "missing_paths": missing_paths[:100],
        "sampled_file_count": len(sampled_results),
        "sampled_duration_flags": duration_flags,
        "sampled_results": sampled_results,
        "duration_thresholds": {
            "min_seconds": MIN_DURATION_S,
            "max_seconds": MAX_DURATION_S,
        },
        "status": "ok" if not missing_paths and not duration_flags else "fail",
    }

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit Spanish drill audio coverage and sample durations")
    parser.add_argument("--template", type=Path, default=DEFAULT_TEMPLATE)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--per-pack-sample", type=int, default=1)
    args = parser.parse_args()

    template_path = args.template if args.template.is_absolute() else (ROOT / args.template)
    manifest_path = args.manifest if args.manifest.is_absolute() else (ROOT / args.manifest)
    report_path = args.report if args.report.is_absolute() else (ROOT / args.report)

    report = audit_audio(template_path, manifest_path, report_path, args.per_pack_sample)
    print(json.dumps(report, indent=2))
    if report["status"] != "ok":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
