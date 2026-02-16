#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: bash deployment/separate/set-mobile-api.sh <api-base-url> [google-geocoding-api-key]"
  exit 1
fi

API_URL="$1"
GOOGLE_KEY="${2:-}"
FILE="src/config/api.js"

if [[ ! -f "$FILE" ]]; then
  echo "File not found: $FILE"
  exit 1
fi

ESCAPED_API_URL="$(printf '%s' "$API_URL" | sed -e "s/[\\/&]/\\\\&/g")"
perl -0777 -i -pe "s/^const PROD_API_URL = .*$/const PROD_API_URL = global.__API_BASE_URL || '${ESCAPED_API_URL}';/m" "$FILE"
echo "Updated PROD_API_URL in $FILE to $API_URL"

if [[ -n "$GOOGLE_KEY" ]]; then
  ESCAPED_GOOGLE_KEY="$(printf '%s' "$GOOGLE_KEY" | sed -e "s/[\\/&]/\\\\&/g")"
  perl -0777 -i -pe "s/^const GOOGLE_GEOCODING_API_KEY = .*$/const GOOGLE_GEOCODING_API_KEY = global.__GOOGLE_GEOCODING_API_KEY || '${ESCAPED_GOOGLE_KEY}';/m" "$FILE"
  echo "Updated GOOGLE_GEOCODING_API_KEY in $FILE"
fi
