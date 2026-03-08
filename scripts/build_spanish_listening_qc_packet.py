#!/usr/bin/env python3
"""
Build a deterministic Spanish listening-QC packet for launch review.

Outputs:
- reports/spanish_listening_qc_packet.csv
- reports/spanish_listening_qc_summary.json
- reports/spanish_listening_qc_packet.html

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
HTML_PATH = REPORT_DIR / "spanish_listening_qc_packet.html"
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
    HTML_PATH.write_text(build_html(packet, summary), encoding="utf-8")


def build_audio_cell(label: str, url: str) -> str:
    if not url:
        return ""
    return (
        f'<div class="audio-item"><div class="audio-label">{label}</div>'
        f'<audio controls preload="none" src="{url}"></audio></div>'
    )


def html_escape(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def build_html(packet: list[dict[str, str]], summary: dict[str, object]) -> str:
    rows_html: list[str] = []
    for row in packet:
        audio_blocks = "".join([
            build_audio_cell("Audio 1", row["audio_url_1"]),
            build_audio_cell("Audio 2", row["audio_url_2"]),
            build_audio_cell("Audio 3", row["audio_url_3"]),
            build_audio_cell("Audio 4", row["audio_url_4"]),
        ])
        rows_html.append(
            "<tr>"
            f'<td>{html_escape(row["phase"])}</td>'
            f'<td>{html_escape(row["review_id"])}</td>'
            f'<td>{html_escape(row["sample_group"])}</td>'
            f'<td>{html_escape(row["difficulty"])}</td>'
            f'<td><div class="text-primary">{html_escape(row["text_primary"])}</div>'
            f'<div class="text-secondary">{html_escape(row["text_secondary"])}</div></td>'
            f'<td>{html_escape(row["clinical_focus"])}</td>'
            f'<td>{html_escape(row["review_questions"])}</td>'
            f'<td class="audio-cell">{audio_blocks}</td>'
            "</tr>"
        )

    summary_lines = "".join(
        f'<span class="pill">{html_escape(phase)}: {count}</span>'
        for phase, count in summary["phase_counts"].items()
    )

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Spanish Listening QC Packet</title>
  <style>
    :root {{
      --bg: #f5f1e8;
      --paper: #fffdf8;
      --ink: #1e1d1a;
      --muted: #6b665a;
      --line: #d8cfbf;
      --accent: #0d6e6e;
      --accent-soft: #d8ece8;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: Georgia, "Iowan Old Style", "Palatino Linotype", serif;
      background:
        radial-gradient(circle at top left, #efe2c6 0, transparent 28%),
        linear-gradient(180deg, #f7f2e8 0%, #efe7d8 100%);
      color: var(--ink);
    }}
    .wrap {{
      max-width: 1400px;
      margin: 0 auto;
      padding: 32px 24px 64px;
    }}
    .hero {{
      background: rgba(255, 253, 248, 0.88);
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 18px 40px rgba(63, 46, 21, 0.08);
      margin-bottom: 24px;
    }}
    h1 {{
      margin: 0 0 12px;
      font-size: 36px;
      line-height: 1.05;
    }}
    p {{
      margin: 0 0 12px;
      color: var(--muted);
      max-width: 900px;
    }}
    .pill-row {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }}
    .pill {{
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 700;
    }}
    .table-shell {{
      background: rgba(255, 253, 248, 0.92);
      border: 1px solid var(--line);
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 18px 40px rgba(63, 46, 21, 0.08);
    }}
    .toolbar {{
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 16px 18px;
      border-bottom: 1px solid var(--line);
      background: #f7f1e6;
    }}
    .toolbar input {{
      width: 280px;
      max-width: 100%;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 10px 14px;
      background: white;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }}
    th, td {{
      vertical-align: top;
      padding: 14px;
      border-bottom: 1px solid #eee3d0;
    }}
    th {{
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
      background: #fbf7ef;
      text-align: left;
    }}
    tr.hidden {{
      display: none;
    }}
    .text-primary {{
      font-weight: 700;
      margin-bottom: 4px;
    }}
    .text-secondary {{
      color: var(--muted);
      font-size: 14px;
    }}
    .audio-cell {{
      min-width: 320px;
    }}
    .audio-item {{
      margin-bottom: 10px;
    }}
    .audio-label {{
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin-bottom: 4px;
    }}
    audio {{
      width: 100%;
      height: 32px;
    }}
    @media (max-width: 900px) {{
      .wrap {{ padding: 18px 12px 40px; }}
      h1 {{ font-size: 28px; }}
      .table-shell {{ overflow-x: auto; }}
      table {{ min-width: 1200px; }}
    }}
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <h1>Spanish Listening QC Packet</h1>
      <p>
        Launch status is operationally strong and clinically pending. Automated gates are already green.
        This packet is the human bilingual review surface for the remaining launch decision.
      </p>
      <p>
        Rows: {summary["row_count"]}. Voices: Sergio and Roma. Review protocol: <code>docs/SPANISH_LISTENING_QC_PROTOCOL.md</code>
      </p>
      <div class="pill-row">{summary_lines}</div>
    </section>
    <section class="table-shell">
      <div class="toolbar">
        <label for="filter">Filter</label>
        <input id="filter" type="text" placeholder="phase, id, text, pack, category">
      </div>
      <table>
        <thead>
          <tr>
            <th>Phase</th>
            <th>Review ID</th>
            <th>Group</th>
            <th>Difficulty</th>
            <th>Text</th>
            <th>Clinical Focus</th>
            <th>Review Question</th>
            <th>Audio</th>
          </tr>
        </thead>
        <tbody id="packet-body">
          {''.join(rows_html)}
        </tbody>
      </table>
    </section>
  </div>
  <script>
    const filter = document.getElementById('filter');
    const rows = Array.from(document.querySelectorAll('#packet-body tr'));
    filter.addEventListener('input', () => {{
      const needle = filter.value.trim().toLowerCase();
      rows.forEach((row) => {{
        const match = row.textContent.toLowerCase().includes(needle);
        row.classList.toggle('hidden', Boolean(needle) && !match);
      }});
    }});
  </script>
</body>
</html>"""


def main() -> None:
    packet, summary = build_packet()
    write_packet(packet, summary)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
