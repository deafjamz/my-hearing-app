#!/bin/bash
# SoundSteps Logo Generation Runner
# Usage: ./run.sh [dalle|ideogram|gallery|dry-run]

set -e
cd "$(dirname "$0")"

case "${1:-help}" in
  dalle)
    echo "=== DALL-E 3 Generation ==="
    echo 'Cost: ~$0.08/image HD, ~$0.04/image standard'
    echo ""
    if [ -z "$OPENAI_API_KEY" ]; then
      echo "Set OPENAI_API_KEY first:"
      echo "  export OPENAI_API_KEY=sk-..."
      exit 1
    fi
    shift
    python3 generate_dalle.py "$@"
    ;;

  ideogram)
    echo "=== Ideogram Generation ==="
    echo 'Cost: ~$0.08/image'
    echo ""
    if [ -z "$IDEOGRAM_API_KEY" ]; then
      echo "Set IDEOGRAM_API_KEY first:"
      echo "  export IDEOGRAM_API_KEY=..."
      echo "  Get key: https://ideogram.ai/manage-api"
      exit 1
    fi
    shift
    python3 generate_ideogram.py "$@"
    ;;

  gallery)
    echo "=== Opening Review Gallery ==="
    echo "http://localhost:8080/gallery/"
    echo "Press Ctrl+C to stop"
    python3 -m http.server 8080 --directory .
    ;;

  dry-run)
    echo "=== Dry Run (all prompts) ==="
    python3 generate_ideogram.py --dry-run
    ;;

  count)
    echo "=== Generated Images ==="
    find outputs -name "*.png" 2>/dev/null | wc -l | xargs echo "Total images:"
    for d in outputs/batch*; do
      [ -d "$d" ] && echo "  $(basename $d): $(find "$d" -name "*.png" | wc -l | xargs) images"
    done
    ;;

  help|*)
    echo "SoundSteps Logo Generation"
    echo ""
    echo "Usage:"
    echo "  ./run.sh dalle [--batch batch1] [--variants 2]    Generate via DALL-E 3"
    echo "  ./run.sh ideogram [--batch batch1] [--variants 2]  Generate via Ideogram"
    echo "  ./run.sh gallery                                   Open review gallery"
    echo "  ./run.sh dry-run                                   Preview all prompts"
    echo "  ./run.sh count                                     Count generated images"
    echo ""
    echo "Quick start:"
    echo "  export OPENAI_API_KEY=sk-..."
    echo '  ./run.sh dalle --batch batch1 --variants 2    # ~20 images, ~$1.60'
    echo "  ./run.sh gallery                               # Review at localhost:8080"
    echo ""
    echo "Full run (all 50 prompts x 2 variants = 100 images):"
    echo '  ./run.sh dalle --variants 2                    # ~$8.00, ~15 min'
    ;;
esac
