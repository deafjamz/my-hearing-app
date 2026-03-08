#!/usr/bin/env python3
"""
Generate Spanish launch audio from translated template CSVs.

Phases:
1) sentences + conversations
2) phoneme_drills
3) scenarios

Audio uploads to:
  audio/spanish/{phase}/...
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import tempfile
import time
import uuid
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pandas as pd
import requests
from supabase import Client, create_client


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MANIFEST = ROOT / "content" / "spanish_templates_1x" / "spanish_execution_manifest.json"
DEFAULT_TEMPLATES_DIR = ROOT / "content" / "spanish_templates_1x"
LOG_FILE = ROOT / "spanish_audio_generation.log"
PROGRESS_FILE = ROOT / "spanish_audio_progress.json"
RESULTS_FILE = ROOT / "reports" / "spanish_generation_results.json"

TARGET_LUFS = -20.0
MODEL_ID = "eleven_multilingual_v2"
MAX_RETRIES = 2
APPROVED_DRILL_STATUSES = {"clinically_reviewed", "approved_for_launch"}

SERVICE_ROLES = {
    "cashier", "pharmacist", "server", "teller", "driver", "receptionist",
    "stylist", "employee", "clerk", "staff", "baker", "librarian",
    "technician", "barista", "agent", "manager", "associate", "host",
}
CUSTOMER_ROLES = {
    "customer", "patient", "guest", "patron", "passenger", "caller",
    "client", "neighbor", "resident", "friend", "coworker",
}


def get_env(key: str) -> Optional[str]:
    if os.getenv(key):
        return os.getenv(key)
    for env_path in (ROOT / ".env", ROOT / ".env.local"):
        if env_path.exists():
            for line in env_path.read_text(encoding="utf-8").splitlines():
                if line.strip().startswith(f"{key}="):
                    return line.split("=", 1)[1].strip()
    return None


def log(message: str) -> None:
    print(message, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"{datetime.now().isoformat()} | {message}\n")


def slugify(value: str) -> str:
    text = re.sub(r"\s+", "_", value.strip().lower())
    text = re.sub(r"[^a-z0-9_áéíóúüñ-]", "", text)
    text = text.replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
    text = text.replace("ü", "u").replace("ñ", "n")
    text = re.sub(r"_+", "_", text)
    return text[:64] if text else "item"


def check_ffmpeg() -> None:
    try:
        subprocess.run(["ffmpeg", "-version"], check=True, capture_output=True)
        subprocess.run(["ffprobe", "-version"], check=True, capture_output=True)
    except Exception as exc:
        raise SystemExit(f"ffmpeg/ffprobe unavailable: {exc}")


def list_storage_files(supabase: Client, prefix: str) -> set[str]:
    files = set()
    offset = 0
    page_size = 1000
    while True:
        batch = supabase.storage.from_("audio").list(prefix, {"limit": page_size, "offset": offset}) or []
        for item in batch:
            name = item.get("name")
            if isinstance(name, str) and name.endswith(".mp3"):
                files.add(name[:-4])
        if len(batch) < page_size:
            break
        offset += page_size
    return files


def build_isolated_word_text(word: str) -> str:
    # Ellipsis padding gives the model prosodic context without adding spoken carrier content.
    return f"... {word} ..."


def normalize_audio(input_path: str, output_path: str, trim_silence: bool = False) -> bool:
    try:
        audio_filter = f"loudnorm=I={TARGET_LUFS}:TP=-1.5:LRA=11"
        if trim_silence:
            audio_filter = (
                "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-40dB:"
                "stop_periods=1:stop_silence=0.05:stop_threshold=-40dB,"
                f"{audio_filter}"
            )
        cmd = [
            "ffmpeg", "-y", "-v", "error",
            "-i", input_path,
            "-af", audio_filter,
            "-ar", "44100",
            "-b:a", "192k",
            output_path,
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        return os.path.exists(output_path)
    except Exception:
        return False


def get_duration(path: str) -> float:
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            path,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return float(result.stdout.strip())
    except Exception:
        return 0.0


def generate_tts(api_key: str, voice_id: str, text: str) -> Optional[bytes]:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload = {
        "text": text,
        "model_id": MODEL_ID,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0},
    }
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=90)
        if response.status_code == 200:
            return response.content
        return None
    except Exception:
        return None


def upload_audio(supabase: Client, local_path: str, storage_path: str) -> bool:
    try:
        with open(local_path, "rb") as f:
            data = f.read()
        supabase.storage.from_("audio").upload(
            storage_path,
            data,
            {"content-type": "audio/mpeg", "upsert": "true"},
        )
        return True
    except Exception:
        return False


def load_progress() -> Dict[str, List[str]]:
    if PROGRESS_FILE.exists():
        return json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))
    return {"completed": []}


def save_progress(progress: Dict[str, List[str]]) -> None:
    PROGRESS_FILE.write_text(json.dumps(progress, indent=2), encoding="utf-8")


@dataclass
class VoiceChoice:
    key: str
    voice_id: str
    name: str


def load_voices(manifest_path: Path) -> Tuple[VoiceChoice, VoiceChoice]:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    male = manifest["selected_voices"]["male"]
    female = manifest["selected_voices"]["female"]
    male_choice = VoiceChoice(key=slugify(male["name"]), voice_id=male["voice_id"], name=male["name"])
    female_choice = VoiceChoice(key=slugify(female["name"]), voice_id=female["voice_id"], name=female["name"])
    return male_choice, female_choice


def speaker_voice(speaker: str, male: VoiceChoice, female: VoiceChoice) -> VoiceChoice:
    s = speaker.lower().strip()
    s_root = re.sub(r"\s+[ab]$", "", s)
    for role in SERVICE_ROLES:
        if role in s_root:
            return female
    for role in CUSTOMER_ROLES:
        if role in s_root:
            return male
    return female


def phase_sentences(df: pd.DataFrame, male: VoiceChoice, female: VoiceChoice) -> List[Tuple[str, str, str, bool]]:
    jobs = []
    for _, row in df.iterrows():
        text = str(row.get("sentence_text_es", "")).strip()
        sid = str(row.get("source_row_id", "")).strip()
        if not text or not sid:
            continue
        jobs.append((f"spanish/sentences/{male.key}/sentence_{sid}.mp3", text, male.voice_id, False))
        jobs.append((f"spanish/sentences/{female.key}/sentence_{sid}.mp3", text, female.voice_id, False))
    return jobs


def phase_conversations(df: pd.DataFrame, male: VoiceChoice, female: VoiceChoice) -> List[Tuple[str, str, str, bool]]:
    jobs = []
    for _, row in df.iterrows():
        cid = str(row.get("id", "")).strip()
        if not cid:
            continue
        prompt = str(row.get("prompt_text_es", "")).strip()
        response = str(row.get("response_text_es", "")).strip()
        if prompt:
            jobs.append((f"spanish/conversations/{male.key}/{cid}_prompt.mp3", prompt, male.voice_id, False))
            jobs.append((f"spanish/conversations/{female.key}/{cid}_prompt.mp3", prompt, female.voice_id, False))
        if response:
            jobs.append((f"spanish/conversations/{male.key}/{cid}_response.mp3", response, male.voice_id, False))
            jobs.append((f"spanish/conversations/{female.key}/{cid}_response.mp3", response, female.voice_id, False))
    return jobs


def phase_drills(
    df: pd.DataFrame,
    male: VoiceChoice,
    female: VoiceChoice,
    include_low_confidence: bool,
) -> List[Tuple[str, str, str, bool]]:
    jobs = []
    for _, row in df.iterrows():
        status = str(row.get("translation_status", "")).strip()
        if not include_low_confidence and status not in APPROVED_DRILL_STATUSES:
            continue
        did = str(row.get("id", "")).strip()
        pack = str(row.get("drill_pack_id", "")).strip()
        if not did or not pack:
            continue
        w1 = str(row.get("word_1_es", "")).strip()
        w2 = str(row.get("word_2_es", "")).strip()
        if w1:
            slug = slugify(w1)
            text = build_isolated_word_text(w1)
            jobs.append((f"spanish/drills/{male.key}/{pack}/{did}_{slug}.mp3", text, male.voice_id, False))
            jobs.append((f"spanish/drills/{female.key}/{pack}/{did}_{slug}.mp3", text, female.voice_id, False))
        if w2:
            slug = slugify(w2)
            text = build_isolated_word_text(w2)
            jobs.append((f"spanish/drills/{male.key}/{pack}/{did}_{slug}.mp3", text, male.voice_id, False))
            jobs.append((f"spanish/drills/{female.key}/{pack}/{did}_{slug}.mp3", text, female.voice_id, False))
    return jobs


def phase_scenarios(df: pd.DataFrame, male: VoiceChoice, female: VoiceChoice) -> List[Tuple[str, str, str, bool]]:
    jobs = []
    combo = f"{male.key}_{female.key}"
    for _, row in df.iterrows():
        item_id = str(row.get("id", "")).strip()
        speaker = str(row.get("speaker", "")).strip()
        text = str(row.get("text_es", "")).strip()
        if not item_id or not text:
            continue
        voice = speaker_voice(speaker, male=male, female=female)
        jobs.append((f"spanish/scenarios/{combo}/{item_id}.mp3", text, voice.voice_id, False))
    return jobs


def run_jobs(
    supabase: Client,
    api_key: str,
    jobs: List[Tuple[str, str, str, bool]],
    phase_name: str,
    pilot: bool,
    limit: Optional[int],
) -> Dict[str, int]:
    if pilot:
        jobs = jobs[:40]

    progress = load_progress()
    completed = set(progress.get("completed", []))
    pending = []
    for job in jobs:
        if len(job) == 4:
            storage_path, text, voice_id, trim_silence = job
        else:
            storage_path, text, voice_id = job
            trim_silence = False
        key = f"{phase_name}|{storage_path}"
        if key in completed:
            continue
        pending.append((storage_path, text, voice_id, trim_silence, key))

    if limit is not None:
        pending = pending[:limit]

    log(f"[{phase_name}] jobs total={len(jobs)} pending={len(pending)}")
    success = 0
    failed = 0
    skipped_short = 0

    for idx, pending_job in enumerate(pending, start=1):
        if len(pending_job) == 5:
            storage_path, text, voice_id, trim_silence, key = pending_job
        else:
            storage_path, text, voice_id, key = pending_job
            trim_silence = False
        text = text.strip()
        if not text:
            skipped_short += 1
            completed.add(key)
            continue

        ok = False
        for attempt in range(MAX_RETRIES + 1):
            audio = generate_tts(api_key, voice_id, text)
            if not audio:
                if attempt < MAX_RETRIES:
                    time.sleep(1.0)
                continue

            with tempfile.NamedTemporaryFile(suffix=f"_{uuid.uuid4()}.mp3", delete=False) as raw:
                raw.write(audio)
                raw_path = raw.name
            final_path = f"{raw_path}.final.mp3"
            try:
                if not normalize_audio(raw_path, final_path, trim_silence=trim_silence):
                    continue
                duration = get_duration(final_path)
                if duration < 0.2:
                    continue
                if upload_audio(supabase, final_path, storage_path):
                    ok = True
                    break
            finally:
                if os.path.exists(raw_path):
                    os.remove(raw_path)
                if os.path.exists(final_path):
                    os.remove(final_path)

        if ok:
            success += 1
            completed.add(key)
            progress["completed"] = sorted(completed)
            save_progress(progress)
            if idx % 25 == 0:
                log(f"[{phase_name}] {idx}/{len(pending)} success={success} failed={failed}")
        else:
            failed += 1
            log(f"[{phase_name}] FAIL {storage_path}")
        time.sleep(0.25)

    return {
        "jobs_total": len(jobs),
        "jobs_pending": len(pending),
        "success": success,
        "failed": failed,
        "skipped_short": skipped_short,
    }


def estimate_chars(jobs: List[Tuple[str, str, str, bool]]) -> int:
    return sum(len(text) for _, text, _, _ in jobs)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Spanish launch audio")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--templates-dir", type=Path, default=DEFAULT_TEMPLATES_DIR)
    parser.add_argument("--phase", choices=["sentences", "conversations", "drills", "scenarios", "all"], default="all")
    parser.add_argument("--pilot", action="store_true")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--include-low-confidence-drills", action="store_true")
    args = parser.parse_args()

    check_ffmpeg()

    manifest_path = args.manifest if args.manifest.is_absolute() else (ROOT / args.manifest)
    templates_dir = args.templates_dir if args.templates_dir.is_absolute() else (ROOT / args.templates_dir)
    if not manifest_path.exists():
        raise FileNotFoundError(manifest_path)

    api_key = get_env("ELEVENLABS_API_KEY")
    supabase_url = get_env("SUPABASE_URL")
    supabase_key = get_env("SUPABASE_SERVICE_ROLE_KEY")
    if not (api_key and supabase_url and supabase_key):
        raise SystemExit("Missing ELEVENLABS_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")

    male, female = load_voices(manifest_path)
    supabase = create_client(supabase_url, supabase_key)

    phase_order = ["sentences", "conversations", "drills", "scenarios"] if args.phase == "all" else [args.phase]
    results: Dict[str, Dict[str, int]] = {}

    log("=" * 70)
    log("SPANISH AUDIO GENERATION")
    log(f"Voices: male={male.name} ({male.voice_id}) | female={female.name} ({female.voice_id})")
    log(f"Phase order: {phase_order}")
    log("=" * 70)

    for phase in phase_order:
        if phase == "sentences":
            df = pd.read_csv(templates_dir / "sentences_es_launch_template.csv")
            jobs = phase_sentences(df, male=male, female=female)
        elif phase == "conversations":
            df = pd.read_csv(templates_dir / "conversations_es_launch_template.csv")
            jobs = phase_conversations(df, male=male, female=female)
        elif phase == "drills":
            df = pd.read_csv(templates_dir / "phoneme_drills_es_launch_template.csv")
            jobs = phase_drills(
                df,
                male=male,
                female=female,
                include_low_confidence=args.include_low_confidence_drills,
            )
        elif phase == "scenarios":
            df = pd.read_csv(templates_dir / "scenario_items_es_launch_template.csv")
            jobs = phase_scenarios(df, male=male, female=female)
        else:
            continue

        chars = estimate_chars(jobs)
        log(f"[{phase}] estimated chars={chars} files={len(jobs)}")
        results[phase] = run_jobs(
            supabase=supabase,
            api_key=api_key,
            jobs=jobs,
            phase_name=phase,
            pilot=args.pilot,
            limit=args.limit,
        )

    RESULTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "timestamp": datetime.now().isoformat(),
        "phase": args.phase,
        "pilot": args.pilot,
        "limit": args.limit,
        "include_low_confidence_drills": args.include_low_confidence_drills,
        "male_voice": {"name": male.name, "voice_id": male.voice_id},
        "female_voice": {"name": female.name, "voice_id": female.voice_id},
        "results": results,
    }
    RESULTS_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    log("Generation run complete")
    for phase, stats in results.items():
        log(f"  {phase}: {stats}")
    log(f"Results file: {RESULTS_FILE}")


if __name__ == "__main__":
    main()
