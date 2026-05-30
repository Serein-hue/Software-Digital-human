#!/bin/bash
# Build frontend and deploy to GitHub Pages
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "=== Building frontend ==="
cd "$FRONTEND_DIR"

# Type check
echo "[1/3] TypeScript check..."
npx tsc --noEmit

# Build
echo "[2/3] Vite build..."
npx vite build

# Commit & push
echo "[3/3] Git push..."
cd "$PROJECT_DIR"
git add frontend/src/ docs/app/ official-materials/ rag-knowledge/ skills/
git commit -m "chore: build & deploy $(date +%Y-%m-%d_%H:%M)" || echo "Nothing to commit"
git push origin main

echo "=== Done. Live at https://serein-hue.github.io/Software-Digital-human/app/ ==="
