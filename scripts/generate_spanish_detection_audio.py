#!/usr/bin/env python3
"""
Generate and upload Spanish detection audio.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import tempfile
from pathlib import Path

import pandas as pd
import requests
from supabase import create_client


ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "content" / "spanish_templates_1x" / "detection_es_launch_template.csv"
REPORT_PATH = ROOT / "reports" / "spanish_detection_generation_report.json"
TARGET_LUFS = -20.0

VOICES = {
    "sergio": "SHkfxEDcLXK31yPii5xM",
    "roma": "6Mo5ciGH5nWiQacn5FYk",
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


def normalize_audio(input_path: Path, output_path: Path) -> None:
    subprocess.run([
        "ffmpeg", "-y", "-v", "error",
        "-i", str(input_path),
        "-af", f"loudnorm=I={TARGET_LUFS}:TP=-1.5:LRA=11",
        "-ar", "44100",
        "-b:a", "192k",
        str(output_path),
    ], check=True)


def generate_speech(text: str, voice_id: str, api_key: str) -> bytes:
    response = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
        },
        json={
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.45,
                "similarity_boost": 0.8,
                "style": 0.0,
            },
        },
        timeout=60,
    )
    response.raise_for_status()
    return response.content


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Spanish detection audio")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    api_key = get_env("ELEVENLABS_API_KEY")
    supabase_url = get_env("SUPABASE_URL")
    service_role = get_env("SUPABASE_SERVICE_ROLE_KEY")
    if not api_key or not supabase_url or not service_role:
        raise RuntimeError("Missing ELEVENLABS_API_KEY, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY")

    df = pd.read_csv(CSV_PATH)
    jobs = [
        {
            "id": str(row["id"]).strip(),
            "text": str(row["stimulus_text_es"]).strip(),
            "voice": voice_name,
            "voice_id": voice_id,
            "storage_path": f"spanish/detection/{voice_name}/{str(row['id']).strip()}.mp3",
        }
        for _, row in df.iterrows()
        for voice_name, voice_id in VOICES.items()
    ]

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps({
        "job_count": len(jobs),
        "rows": len(df),
        "voices": list(VOICES.keys()),
        "apply": args.apply,
    }, indent=2), encoding="utf-8")

    print(json.dumps({
        "job_count": len(jobs),
        "rows": len(df),
        "report": str(REPORT_PATH),
        "apply": args.apply,
    }, indent=2))

    if not args.apply:
        return

    client = create_client(supabase_url, service_role)
    completed = 0

    with tempfile.TemporaryDirectory(prefix="spanish-detection-") as temp_dir:
        temp_root = Path(temp_dir)
        for job in jobs:
            raw_path = temp_root / f"{job['id']}-{job['voice']}-raw.mp3"
            normalized_path = temp_root / f"{job['id']}-{job['voice']}.mp3"
            raw_path.write_bytes(generate_speech(job["text"], job["voice_id"], api_key))
            normalize_audio(raw_path, normalized_path)
            client.storage.from_("audio").upload(
                job["storage_path"],
                normalized_path.read_bytes(),
                {"content-type": "audio/mpeg", "upsert": "true"},
            )
            completed += 1

    print(json.dumps({"completed": completed}, indent=2))


if __name__ == "__main__":
    main()
