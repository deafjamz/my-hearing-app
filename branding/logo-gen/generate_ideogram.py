#!/usr/bin/env python3
"""
Batch logo generation via Ideogram API (best for letterforms/typography).

Usage:
  export IDEOGRAM_API_KEY=...
  python3 generate_ideogram.py                  # All 50 prompts
  python3 generate_ideogram.py --batch batch1   # Single batch
  python3 generate_ideogram.py --id 1A          # Single prompt

Get API key: https://ideogram.ai/manage-api
Pricing: ~$0.08/image (standard), ~$0.04/image (turbo)

Outputs to: outputs/<batch>/<id>_<name>_ideogram_v<n>.png
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    print("Install requests: pip install requests")
    sys.exit(1)

SCRIPT_DIR = Path(__file__).parent
PROMPTS_FILE = SCRIPT_DIR / "prompts" / "all_prompts.json"
OUTPUT_DIR = SCRIPT_DIR / "outputs"

API_URL = "https://api.ideogram.ai/generate"


def load_prompts():
    with open(PROMPTS_FILE) as f:
        return json.load(f)


def get_all_prompts(data, batch_filter=None, id_filter=None):
    results = []
    for batch_name, prompts in data["batches"].items():
        if batch_filter and batch_filter not in batch_name:
            continue
        for p in prompts:
            if id_filter and p["id"] != id_filter:
                continue
            results.append((batch_name, p))
    return results


def sanitize_name(name):
    return name.lower().replace(" ", "_").replace("/", "_").replace("&", "and")


def generate_one(api_key, prompt_text, output_path):
    """Generate one image via Ideogram API."""
    try:
        headers = {
            "Api-Key": api_key,
            "Content-Type": "application/json",
        }
        payload = {
            "image_request": {
                "prompt": prompt_text,
                "aspect_ratio": "ASPECT_1_1",
                "model": "V_2A",  # Latest model
                "magic_prompt_option": "AUTO",
                "style_type": "DESIGN",  # Best for logos
            }
        }

        response = requests.post(API_URL, headers=headers, json=payload, timeout=120)
        response.raise_for_status()
        result = response.json()

        if not result.get("data"):
            print(f"  No data in response")
            return False

        # Download first image
        image_url = result["data"][0]["url"]
        img_response = requests.get(image_url, timeout=60)
        img_response.raise_for_status()

        with open(output_path, "wb") as f:
            f.write(img_response.content)

        # Save metadata
        meta_path = output_path.with_suffix(".txt")
        with open(meta_path, "w") as f:
            f.write(f"Original: {prompt_text}\n")
            f.write(f"Model: V_2A\n")
            f.write(f"Style: DESIGN\n")
            if result["data"][0].get("prompt"):
                f.write(f"Revised: {result['data'][0]['prompt']}\n")

        return True
    except Exception as e:
        print(f"  ERROR: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Batch Ideogram logo generation")
    parser.add_argument("--batch", help="Filter to one batch (e.g., batch1, batch2)")
    parser.add_argument("--id", help="Filter to one prompt ID (e.g., 1A, 2B)")
    parser.add_argument("--variants", type=int, default=2, help="Variants per prompt (default: 2)")
    parser.add_argument("--dry-run", action="store_true", help="Print prompts without generating")
    args = parser.parse_args()

    api_key = os.environ.get("IDEOGRAM_API_KEY")
    if not api_key and not args.dry_run:
        print("Set IDEOGRAM_API_KEY environment variable")
        print("  Get key: https://ideogram.ai/manage-api")
        sys.exit(1)

    data = load_prompts()
    prompts = get_all_prompts(data, args.batch, args.id)

    if not prompts:
        print("No matching prompts found.")
        sys.exit(1)

    total = len(prompts) * args.variants
    print(f"{'[DRY RUN] ' if args.dry_run else ''}Generating {total} images ({len(prompts)} prompts x {args.variants} variants)")
    print(f"Estimated cost: ~${total * 0.08:.2f}\n")

    if args.dry_run:
        for batch_name, p in prompts:
            print(f"[{p['id']}] {p['name']}")
            print(f"  {p['prompt'][:120]}...")
            print()
        return

    success = 0
    failed = 0

    for i, (batch_name, p) in enumerate(prompts):
        batch_num = batch_name.split("_")[0]
        out_dir = OUTPUT_DIR / batch_num
        out_dir.mkdir(parents=True, exist_ok=True)

        name_slug = sanitize_name(p["name"])

        for v in range(1, args.variants + 1):
            output_path = out_dir / f"{p['id']}_{name_slug}_ideogram_v{v}.png"

            if output_path.exists():
                print(f"[{i+1}/{len(prompts)}] {p['id']} v{v} — SKIP (exists)")
                success += 1
                continue

            print(f"[{i+1}/{len(prompts)}] {p['id']} {p['name']} v{v}...", end=" ", flush=True)
            if generate_one(api_key, p["prompt"], output_path):
                print("OK")
                success += 1
            else:
                failed += 1

            time.sleep(3)  # Rate limit

    print(f"\nDone. {success} succeeded, {failed} failed.")
    print(f"Results in: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
