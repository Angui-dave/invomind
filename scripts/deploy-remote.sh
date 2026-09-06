#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${FRONT_PATH:-}" || -z "${BACK_PATH:-}" ]]; then
  echo "FRONT_PATH and BACK_PATH must be set." >&2
  exit 1
fi

if [[ ! -d "$BACK_PATH" ]]; then
  echo "Backend path does not exist: $BACK_PATH" >&2
  exit 1
fi

if [[ ! -f "$BACK_PATH/.env" ]]; then
  echo "Missing $BACK_PATH/.env — create it on the server before deploying." >&2
  exit 1
fi

if [[ ! -d "$FRONT_PATH" ]]; then
  echo "Frontend path does not exist: $FRONT_PATH" >&2
  exit 1
fi

if [[ ! -f "$FRONT_PATH/.env" ]]; then
  echo "Missing $FRONT_PATH/.env — create it on the server before deploying." >&2
  exit 1
fi

echo "==> Backend: composer install"
(
  cd "$BACK_PATH"
  composer install --no-dev --optimize-autoloader --no-interaction --no-progress
  php artisan migrate --force
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
)

echo "==> Frontend: install and build"
(
  cd "$FRONT_PATH"
  # Next.js compile needs TypeScript/Tailwind (devDependencies).
  npm ci
  npm run build
)

if [[ -n "${BACK_RESTART_CMD:-}" ]]; then
  echo "==> Backend restart"
  bash -lc "$BACK_RESTART_CMD"
fi

if [[ -n "${FRONT_RESTART_CMD:-}" ]]; then
  echo "==> Frontend restart"
  bash -lc "$FRONT_RESTART_CMD"
fi

echo "==> Deploy finished"
