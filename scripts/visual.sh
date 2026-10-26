#!/usr/bin/env bash
# Runs the gallery screenshot tests (e2e/gallery-visual.spec.ts) in the official Playwright image, where the
# baselines were made: the same fonts and rendering as CI on any host. Arguments go to `playwright test`, e.g.
# `npm run test:visual -- --update-snapshots` (what `npm run test:visual:update` does) or `-g "List"`.
# Uses docker, or podman when docker is missing; CONTAINER_ENGINE=podman picks one.
set -euo pipefail

version=$(node -p "require('@playwright/test/package.json').version")
image="mcr.microsoft.com/playwright:v${version}-noble"
engine=${CONTAINER_ENGINE:-$(command -v docker >/dev/null && echo docker || echo podman)}

# Two workers: more starve the dev server in a container (screenshots time out waiting for a stable frame).
# node_modules lives in a named volume: the host's (macOS) native binaries of Vite, esbuild and Tailwind do not run
# on Linux. `npm ci` keeps it in step with package-lock.json.
exec "$engine" run --rm --init --ipc=host \
  -v "$PWD":/work -v crud-ui-blueprint-node-modules:/work/node_modules -w /work \
  -e VISUAL=1 -e CI=1 \
  "$image" \
  bash -c 'npm ci --no-audit --no-fund --loglevel=error && npx playwright test --project=visual --workers=2 "$@"' bash "$@"
