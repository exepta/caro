#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_NAME="caro-playwright-tests"

echo "🚀 Building Playwright test image: $IMAGE_NAME"
docker build \
  -f "$ROOT_DIR/infra/docker/playwright/Dockerfile" \
  -t "$IMAGE_NAME" \
  "$ROOT_DIR"

echo "▶️ Running Playwright tests..."
docker run --rm \
  -v "$ROOT_DIR":/work \
  -w /work/apps/web \
  "$IMAGE_NAME" \
  pnpm playwright test -c playwright.config.ts

echo "✔️ Tests finished."