#!/usr/bin/env python3
"""
Batch logo generation via DALL-E 3 (OpenAI API).

Usage:
  export OPENAI_API_KEY=sk-...
  python3 generate_dalle.py                  # All 50 prompts
  python3 generate_dalle.py --batch batch1   # Single batch
  python3 generate_dalle.py --id 1A          # Single prompt
  python3 generate_dalle.py --batch batch1 --variants 4  # 4 per prompt

Outputs to: outputs/<batch>/<id>_<name>_v<n>.png
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

def get_openai_client(api_key):
    """Lazy import OpenAI to allow --dry-run without the package."""
    try:
        from openai import OpenAI
    except ImportError:
        print("Install openai: pip install openai")
        sys.exit(1)
    return OpenAI(api_key=api_key)

SCRIPT_DIR = Path(__file__).parent
PROMPTS_FILE = SCRIPT_DIR / "prompts" / "all_prompts.json"
OUTPUT_DIR = SCRIPT_DIR / "outputs"

# Prefix for all DALL-E prompts to avoid unwanted text
DALLE_PREFIX = "Generate a logo design. Do not include any text in the image unless the prompt explicitly includes text in quotes. "

# Quality/size settings
SIZE = "1024x1024"
QUALITY = "hd"  # "standard" or "hd"
STYLE = "natural"  # "vivid" or "natural"


def load_prompts():
    with open(PROMPTS_FILE) as f:
        return json.load(f)


def get_all_prompts(data, batch_filter=None, id_filter=None):
    """Flatten all batches into a list of (batch_name, prompt_obj) tuples."""
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


def generate_one(client, prompt_text, output_path):
    """Generate one image and save to output_path. Returns True on success."""
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=DALLE_PREFIX + prompt_text,
            size=SIZE,
            quality=QUALITY,
            style=STYLE,
            n=1,
        )
        image_url = response.data[0].url
        revised_prompt = response.data[0].revised_prompt

        # Download image
        import urllib.request
        urllib.request.urlretrieve(image_url, str(output_path))

        # Save revised prompt for reference
        meta_path = output_path.with_suffix(".txt")
        with open(meta_path, "w") as f:
            f.write(f"Original: {prompt_text}\n\nRevised: {revised_prompt}\n")

        return True
    except Exception as e:
        print(f"  ERROR: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Batch DALL-E 3 logo generation")
    parser.add_argument("--batch", help="Filter to one batch (e.g., batch1, batch2)")
    parser.add_argument("--id", help="Filter to one prompt ID (e.g., 1A, 2B)")
    parser.add_argument("--variants", type=int, default=2, help="Variants per prompt (default: 2)")
    parser.add_argument("--dry-run", action="store_true", help="Print prompts without generating")
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key and not args.dry_run:
        print("Set OPENAI_API_KEY environment variable")
        print("  export OPENAI_API_KEY=sk-...")
        sys.exit(1)

    data = load_prompts()
    prompts = get_all_prompts(data, args.batch, args.id)

    if not prompts:
        print("No matching prompts found.")
        sys.exit(1)

    total = len(prompts) * args.variants
    print(f"{'[DRY RUN] ' if args.dry_run else ''}Generating {total} images ({len(prompts)} prompts x {args.variants} variants)")
    print(f"Estimated cost: ~${total * 0.08:.2f} (DALL-E 3 HD @ $0.080/image)\n")

    if args.dry_run:
        for batch_name, p in prompts:
            print(f"[{p['id']}] {p['name']}")
            print(f"  {p['prompt'][:120]}...")
            print()
        return

    client = get_openai_client(api_key)
    success = 0
    failed = 0

    for i, (batch_name, p) in enumerate(prompts):
        # Determine output subdir from batch name
        batch_num = batch_name.split("_")[0]  # "batch1_core_form" -> "batch1"
        out_dir = OUTPUT_DIR / batch_num
        out_dir.mkdir(parents=True, exist_ok=True)

        name_slug = sanitize_name(p["name"])

        for v in range(1, args.variants + 1):
            output_path = out_dir / f"{p['id']}_{name_slug}_v{v}.png"

            if output_path.exists():
                print(f"[{i+1}/{len(prompts)}] {p['id']} v{v} — SKIP (exists)")
                success += 1
                continue

            print(f"[{i+1}/{len(prompts)}] {p['id']} {p['name']} v{v}...", end=" ", flush=True)
            if generate_one(client, p["prompt"], output_path):
                print("OK")
                success += 1
            else:
                failed += 1

            # Rate limit: DALL-E 3 allows ~7 images/min on most tiers
            time.sleep(9)

    print(f"\nDone. {success} succeeded, {failed} failed.")
    print(f"Results in: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
