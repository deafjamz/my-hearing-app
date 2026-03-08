#!/usr/bin/env python3
"""
Build a deterministic Spanish listening-QC packet for launch review.

Outputs:
- reports/spanish_listening_qc_packet.csv
- reports/spanish_listening_qc_summary.json

The packet is intentionally review-ready rather than exhaustive. It samples the
current launch corpus across Erber-relevant activity types so a bilingual
reviewer can evaluate intelligibility, naturalness, regional neutrality, and
task validity before public launch.
"""

from __future__ import annotations

import csv
import json
import os
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content" / "spanish_templates_1x"
REPORT_DIR = ROOT / "reports"
PACKET_PATH = REPORT_DIR / "spanish_listening_qc_packet.csv"
SUMMARY_PATH = REPORT_DIR / "spanish_listening_qc_summary.json"
MANIFEST_PATH = CONTENT_DIR / "spanish_execution_manifest.json"
SCENARIOS_CSV = CONTENT_DIR / "scenarios_es_launch_template.csv"
SCENARIO_ITEMS_CSV = CONTENT_DIR / "scenario_items_es_launch_template.csv"


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


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def audio_url(storage_path: str, supabase_url: str | None) -> str:
    if not supabase_url:
        return ""
    return f"{supabase_url}/storage/v1/object/public/audio/{storage_path}"


def slugify_audio_token(value: str) -> str:
    token = value.strip().lower()
    replacements = {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "ü": "u",
        "ñ": "n",
    }
    for source, target in replacements.items():
        token = token.replace(source, target)
    cleaned = []
    last_underscore = False
    for char in token:
        if char.isalnum():
            cleaned.append(char)
            last_underscore = False
        else:
            if not last_underscore:
                cleaned.append("_")
                last_underscore = True
    result = "".join(cleaned).strip("_")
    return result or "item"


def voice_keys() -> dict[str, str]:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {
        "male": manifest["selected_voices"]["male"]["name"].strip().lower().replace(" ", "_"),
        "female": manifest["selected_voices"]["female"]["name"].strip().lower().replace(" ", "_"),
        "combo": (
            f"{manifest['selected_voices']['male']['name'].strip().lower().replace(' ', '_')}_"
            f"{manifest['selected_voices']['female']['name'].strip().lower().replace(' ', '_')}"
        ),
    }


def choose_stratified(rows: list[dict[str, str]], strata_key: str, per_group: int) -> list[dict[str, str]]:
    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        grouped[row[strata_key]].append(row)
    for key in grouped:
        grouped[key] = sorted(grouped[key], key=lambda row: json.dumps(row, sort_keys=True))

    chosen: list[dict[str, str]] = []
    for group_key in sorted(grouped):
        chosen.extend(grouped[group_key][:per_group])
    return chosen


def build_detection_rows(supabase_url: str | None, voices: dict[str, str]) -> list[dict[str, str]]:
    rows = sorted(read_csv(CONTENT_DIR / "detection_es_launch_template.csv"), key=lambda row: row["id"])
    packet: list[dict[str, str]] = []
    for row in rows:
        stimulus_id = row["id"].strip()
        packet.append({
            "review_id": f"detection:{stimulus_id}",
            "phase": "detection",
            "content_id": stimulus_id,
            "sample_group": row["block_type"].strip(),
            "difficulty": row["difficulty"].strip(),
            "tier": row["tier"].strip(),
            "category": "",
            "scenario": "",
            "speaker": "",
            "voice_scope": "both",
            "text_primary": row["stimulus_text_es"].strip(),
            "text_secondary": "",
            "keyword": "",
            "foil_acoustic": "",
            "foil_semantic": "",
            "foil_plausible": "",
            "pack_id": "",
            "contrast_type": "",
            "position": "",
            "storage_path_1": f"spanish/detection/{voices['male']}/{stimulus_id}.mp3",
            "audio_url_1": audio_url(f"spanish/detection/{voices['male']}/{stimulus_id}.mp3", supabase_url),
            "storage_path_2": f"spanish/detection/{voices['female']}/{stimulus_id}.mp3",
            "audio_url_2": audio_url(f"spanish/detection/{voices['female']}/{stimulus_id}.mp3", supabase_url),
            "storage_path_3": "",
            "audio_url_3": "",
            "storage_path_4": "",
            "audio_url_4": "",
            "clinical_focus": row["acoustic_focus"].strip(),
            "review_questions": "Is the cue audible, natural, and free of carrier contamination in both voices?",
            "recommended_action": "pass_or_flag",
            "reviewer_notes": "",
            "disposition": "",
        })
    return packet


def build_sentence_rows(supabase_url: str | None, voices: dict[str, str]) -> list[dict[str, str]]:
    rows = [
        row for row in read_csv(CONTENT_DIR / "sentences_es_launch_template.csv")
        if row["translation_status"].strip() in {"rewritten", "clinically_reviewed", "approved_for_launch", "machine_translated"}
    ]
    chosen: list[dict[str, str]] = []
    by_difficulty = defaultdict(list)
    for row in rows:
        by_difficulty[row["difficulty"].strip()].append(row)
    for difficulty in sorted(by_difficulty):
        scenario_groups = defaultdict(list)
        for row in sorted(by_difficulty[difficulty], key=lambda item: (item["scenario"], item["source_row_id"])):
            scenario_groups[row["scenario"].strip()].append(row)
        picked = 0
        round_index = 0
        scenario_keys = sorted(scenario_groups)
        while picked < 5 and scenario_keys:
            made_progress = False
            for scenario in scenario_keys:
                bucket = scenario_groups[scenario]
                if round_index < len(bucket):
                    chosen.append(bucket[round_index])
                    picked += 1
                    made_progress = True
                    if picked == 5:
                        break
            if not made_progress:
                break
            round_index += 1

    packet: list[dict[str, str]] = []
    for row in chosen:
        stimulus_id = row["source_row_id"].strip()
        storage_m = f"spanish/sentences/{voices['male']}/sentence_{stimulus_id}.mp3"
        storage_f = f"spanish/sentences/{voices['female']}/sentence_{stimulus_id}.mp3"
        packet.append({
            "review_id": f"sentence:{stimulus_id}",
            "phase": "sentence",
            "content_id": stimulus_id,
            "sample_group": row["scenario"].strip(),
            "difficulty": row["difficulty"].strip(),
            "tier": "",
            "category": row["scenario"].strip(),
            "scenario": row["scenario"].strip(),
            "speaker": "",
            "voice_scope": "both",
            "text_primary": row["sentence_text_es"].strip(),
            "text_secondary": row["question_text_es"].strip(),
            "keyword": row["correct_answer_es"].strip(),
            "foil_acoustic": row["acoustic_foil_es"].strip(),
            "foil_semantic": row["semantic_foil_es"].strip(),
            "foil_plausible": "",
            "pack_id": "",
            "contrast_type": row["target_phoneme"].strip(),
            "position": "",
            "storage_path_1": storage_m,
            "audio_url_1": audio_url(storage_m, supabase_url),
            "storage_path_2": storage_f,
            "audio_url_2": audio_url(storage_f, supabase_url),
            "storage_path_3": "",
            "audio_url_3": "",
            "storage_path_4": "",
            "audio_url_4": "",
            "clinical_focus": "Erber identification/comprehension with acoustically and semantically plausible Spanish foils",
            "review_questions": "Are the sentence, prompt, and foil relationships natural and clinically credible in Spanish?",
            "recommended_action": "pass_or_flag",
            "reviewer_notes": "",
            "disposition": "",
        })
    return packet


def build_conversation_rows(supabase_url: str | None, voices: dict[str, str]) -> list[dict[str, str]]:
    rows = read_csv(CONTENT_DIR / "conversations_es_launch_template.csv")
    chosen = choose_stratified(rows, "difficulty", 2)
    packet: list[dict[str, str]] = []
    for row in chosen:
        content_id = row["id"].strip()
        packet.append({
            "review_id": f"conversation:{content_id}",
            "phase": "conversation",
            "content_id": content_id,
            "sample_group": row["category"].strip(),
            "difficulty": row["difficulty"].strip(),
            "tier": row["tier"].strip(),
            "category": row["category"].strip(),
            "scenario": "",
            "speaker": "",
            "voice_scope": "both_prompt_and_response",
            "text_primary": row["prompt_text_es"].strip(),
            "text_secondary": row["response_text_es"].strip(),
            "keyword": row["target_keyword_es"].strip(),
            "foil_acoustic": row["acoustic_foil_es"].strip(),
            "foil_semantic": row["semantic_foil_es"].strip(),
            "foil_plausible": row["plausible_foil_es"].strip(),
            "pack_id": "",
            "contrast_type": row["target_phoneme"].strip(),
            "position": "",
            "storage_path_1": f"spanish/conversations/{voices['male']}/{content_id}_prompt.mp3",
            "audio_url_1": audio_url(f"spanish/conversations/{voices['male']}/{content_id}_prompt.mp3", supabase_url),
            "storage_path_2": f"spanish/conversations/{voices['male']}/{content_id}_response.mp3",
            "audio_url_2": audio_url(f"spanish/conversations/{voices['male']}/{content_id}_response.mp3", supabase_url),
            "storage_path_3": f"spanish/conversations/{voices['female']}/{content_id}_prompt.mp3",
            "audio_url_3": audio_url(f"spanish/conversations/{voices['female']}/{content_id}_prompt.mp3", supabase_url),
            "storage_path_4": f"spanish/conversations/{voices['female']}/{content_id}_response.mp3",
            "audio_url_4": audio_url(f"spanish/conversations/{voices['female']}/{content_id}_response.mp3", supabase_url),
            "clinical_focus": "Erber comprehension in short turn-taking Spanish",
            "review_questions": "Do prompt, response, and foil options remain natural, distinct, and clinically useful across both voices?",
            "recommended_action": "pass_or_flag",
            "reviewer_notes": "",
            "disposition": "",
        })
    return packet


def build_drill_rows(supabase_url: str | None, voices: dict[str, str]) -> list[dict[str, str]]:
    rows = [
        row for row in read_csv(CONTENT_DIR / "phoneme_drills_es_launch_template.csv")
        if row["translation_status"].strip() == "approved_for_launch"
    ]
    by_pack: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        by_pack[row["drill_pack_id"].strip()].append(row)

    packet: list[dict[str, str]] = []
    for pack_id in sorted(by_pack):
        row = sorted(by_pack[pack_id], key=lambda item: item["id"])[0]
        word_1 = row["word_1_es"].strip()
        word_2 = row["word_2_es"].strip()
        drill_id = row["id"].strip()
        packet.append({
            "review_id": f"drill:{pack_id}:{drill_id}",
            "phase": "drill",
            "content_id": drill_id,
            "sample_group": pack_id,
            "difficulty": row["difficulty"].strip(),
            "tier": row["tier"].strip(),
            "category": "",
            "scenario": "",
            "speaker": "",
            "voice_scope": "both_words_both_voices",
            "text_primary": word_1,
            "text_secondary": word_2,
            "keyword": "",
            "foil_acoustic": "",
            "foil_semantic": "",
            "foil_plausible": "",
            "pack_id": pack_id,
            "contrast_type": row["contrast_type"].strip(),
            "position": row["position"].strip(),
            "storage_path_1": f"spanish/drills/{voices['male']}/{pack_id}/{drill_id}_{slugify_audio_token(word_1)}.mp3",
            "audio_url_1": audio_url(f"spanish/drills/{voices['male']}/{pack_id}/{drill_id}_{slugify_audio_token(word_1)}.mp3", supabase_url),
            "storage_path_2": f"spanish/drills/{voices['male']}/{pack_id}/{drill_id}_{slugify_audio_token(word_2)}.mp3",
            "audio_url_2": audio_url(f"spanish/drills/{voices['male']}/{pack_id}/{drill_id}_{slugify_audio_token(word_2)}.mp3", supabase_url),
            "storage_path_3": f"spanish/drills/{voices['female']}/{pack_id}/{drill_id}_{slugify_audio_token(word_1)}.mp3",
            "audio_url_3": audio_url(f"spanish/drills/{voices['female']}/{pack_id}/{drill_id}_{slugify_audio_token(word_1)}.mp3", supabase_url),
            "storage_path_4": f"spanish/drills/{voices['female']}/{pack_id}/{drill_id}_{slugify_audio_token(word_2)}.mp3",
            "audio_url_4": audio_url(f"spanish/drills/{voices['female']}/{pack_id}/{drill_id}_{slugify_audio_token(word_2)}.mp3", supabase_url),
            "clinical_focus": row["clinical_note_es"].strip() or "Erber discrimination/identification with Spanish-native contrast logic",
            "review_questions": "Are both drill words natural, distinct, and appropriate for the stated Spanish contrast and position?",
            "recommended_action": "pass_or_flag_pack",
            "reviewer_notes": "",
            "disposition": "",
        })
    return packet


def build_scenario_rows(supabase_url: str | None, voices: dict[str, str]) -> list[dict[str, str]]:
    scenarios = {row["scenario_id"].strip(): row for row in read_csv(SCENARIOS_CSV)}
    items = read_csv(SCENARIO_ITEMS_CSV)
    chosen_items: list[dict[str, str]] = []

    scenarios_by_difficulty: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in scenarios.values():
        scenarios_by_difficulty[row["difficulty"].strip()].append(row)

    selected_scenarios: list[str] = []
    for difficulty in sorted(scenarios_by_difficulty):
        buckets = defaultdict(list)
        for row in sorted(scenarios_by_difficulty[difficulty], key=lambda item: (item["category"], item["scenario_id"])):
            buckets[row["category"].strip()].append(row)
        picked = 0
        round_index = 0
        categories = sorted(buckets)
        while picked < 2 and categories:
            made_progress = False
            for category in categories:
                bucket = buckets[category]
                if round_index < len(bucket):
                    selected_scenarios.append(bucket[round_index]["scenario_id"].strip())
                    picked += 1
                    made_progress = True
                    if picked == 2:
                        break
            if not made_progress:
                break
            round_index += 1

    items_by_scenario: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in items:
        items_by_scenario[row["scenario_id"].strip()].append(row)

    for scenario_id in selected_scenarios:
        ordered = sorted(items_by_scenario[scenario_id], key=lambda row: int(row["order"]))
        if ordered:
            chosen_items.append(ordered[0])
        if len(ordered) > 2:
            chosen_items.append(ordered[len(ordered) // 2])

    packet: list[dict[str, str]] = []
    for row in chosen_items:
        content_id = row["id"].strip()
        scenario = scenarios[row["scenario_id"].strip()]
        storage_path = f"spanish/scenarios/{voices['combo']}/{content_id}.mp3"
        packet.append({
            "review_id": f"scenario:{content_id}",
            "phase": "scenario",
            "content_id": content_id,
            "sample_group": scenario["category"].strip(),
            "difficulty": scenario["difficulty"].strip(),
            "tier": scenario["tier"].strip(),
            "category": scenario["category"].strip(),
            "scenario": scenario["title_es"].strip(),
            "speaker": row["speaker"].strip(),
            "voice_scope": "assigned_speaker_voice",
            "text_primary": row["text_es"].strip(),
            "text_secondary": "",
            "keyword": "",
            "foil_acoustic": "",
            "foil_semantic": "",
            "foil_plausible": "",
            "pack_id": "",
            "contrast_type": "",
            "position": "",
            "storage_path_1": storage_path,
            "audio_url_1": audio_url(storage_path, supabase_url),
            "storage_path_2": "",
            "audio_url_2": "",
            "storage_path_3": "",
            "audio_url_3": "",
            "storage_path_4": "",
            "audio_url_4": "",
            "clinical_focus": "Connected Spanish speech for real-world listening transfer",
            "review_questions": "Is the utterance natural, intelligible, and appropriate for the scenario and speaker role?",
            "recommended_action": "pass_or_flag",
            "reviewer_notes": "",
            "disposition": "",
        })
    return packet


def build_packet() -> tuple[list[dict[str, str]], dict[str, object]]:
    supabase_url = get_env("SUPABASE_URL")
    voices = voice_keys()

    packet: list[dict[str, str]] = []
    packet.extend(build_detection_rows(supabase_url, voices))
    packet.extend(build_sentence_rows(supabase_url, voices))
    packet.extend(build_conversation_rows(supabase_url, voices))
    packet.extend(build_drill_rows(supabase_url, voices))
    packet.extend(build_scenario_rows(supabase_url, voices))

    counts = Counter(row["phase"] for row in packet)
    summary = {
        "packet_path": str(PACKET_PATH),
        "row_count": len(packet),
        "phase_counts": dict(counts),
        "voices": voices,
        "status": "ready_for_human_review",
    }
    return packet, summary


def write_packet(packet: list[dict[str, str]], summary: dict[str, object]) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    fieldnames = list(packet[0].keys())
    with PACKET_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(packet)
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")


def main() -> None:
    packet, summary = build_packet()
    write_packet(packet, summary)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
