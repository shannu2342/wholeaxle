#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: bash deployment/separate/set-mobile-api.sh https://admin2.example.com"
  exit 1
fi

API_URL="$1"
FILE="src/config/api.js"

if [[ ! -f "$FILE" ]]; then
  echo "File not found: $FILE"
  exit 1
fi

ESCAPED_API_URL="$(printf '%s' "$API_URL" | sed -e "s/[\\/&]/\\\\&/g")"
perl -0777 -i -pe "s/^const PROD_API_URL = .*$/const PROD_API_URL = global.__API_BASE_URL || '${ESCAPED_API_URL}';/m" "$FILE"
echo "Updated PROD_API_URL in $FILE to $API_URL"
