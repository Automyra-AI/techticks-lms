#!/usr/bin/env bash
#
# Applies both pending migrations to the live Turso database:
#   1. submissions — adds updated_at, removes duplicate rows, adds the unique index
#   2. roadmap     — replaces the old roadmap with the 11-week, 53-topic outline
#
# Reads TURSO_DATABASE_URL / TURSO_AUTH_TOKEN straight out of .env.local, whether
# those lines are commented out or not, so nothing needs editing first.
#
# Usage, from the project root:
#     bash scripts/update-production.sh
#
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "✗ .env.local not found. Run this from the project root." >&2
  exit 1
fi

# Pull the two Turso values into a temp env file, removing any leading "# ".
ENV_FILE="$(mktemp)"
trap 'rm -f "$ENV_FILE"' EXIT
sed -n 's/^[[:space:]]*#\?[[:space:]]*\(TURSO_[A-Z_]*\)=\(.*\)$/\1=\2/p' .env.local \
  | sed 's/["'\'']//g' > "$ENV_FILE"

if ! grep -q TURSO_DATABASE_URL "$ENV_FILE"; then
  echo "✗ No TURSO_DATABASE_URL found in .env.local" >&2
  exit 1
fi

echo "==> Target: $(sed -n 's/TURSO_DATABASE_URL=//p' "$ENV_FILE")"
echo

echo "==> 1/2  Submissions: column, duplicate cleanup, unique index"
node --env-file="$ENV_FILE" scripts/migrate-submissions-unique.mjs
echo

echo "==> 2/2  Roadmap: applying the 11-week outline"
npx tsx --env-file="$ENV_FILE" scripts/refresh-roadmap.mjs
echo

echo "==> Verifying"
node --env-file="$ENV_FILE" scripts/verify-production.mjs

echo
echo "Done. Hard-refresh the site (Ctrl+Shift+R)."
