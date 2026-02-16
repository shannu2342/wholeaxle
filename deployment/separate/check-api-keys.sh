#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/deployment/separate/.env}"
API_FILE="$ROOT_DIR/src/config/api.js"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

source "$ENV_FILE"

ok() { printf "  [OK] %s\n" "$1"; }
warn() { printf "  [MISSING] %s\n" "$1"; }

is_set() {
  local value="${1:-}"
  [[ -n "$value" ]]
}

check_required() {
  local key="$1"
  local value="${!key:-}"
  if is_set "$value"; then
    ok "$key"
  else
    warn "$key"
  fi
}

echo "== Core Deploy Keys =="
check_required APP_DOMAIN
check_required APP_ROOT
check_required AUTH_DB
check_required BACKEND_PORT
check_required JWT_SECRET
check_required JWT_REFRESH_SECRET
check_required SESSION_SECRET
check_required VITE_API_URL

echo
echo "== Database Keys =="
if [[ "${AUTH_DB:-}" == "mysql" ]]; then
  check_required MYSQL_HOST
  check_required MYSQL_PORT
  check_required MYSQL_DATABASE
  check_required MYSQL_USER
  check_required MYSQL_PASSWORD
else
  check_required MONGODB_URI
fi

echo
echo "== External Integrations =="
if is_set "${DELHIVERY_API_TOKEN:-}" || is_set "${LOGISTICS_API_KEY:-}"; then
  ok "Delhivery (DELHIVERY_API_TOKEN or LOGISTICS_API_KEY)"
else
  warn "Delhivery (DELHIVERY_API_TOKEN or LOGISTICS_API_KEY)"
fi

if is_set "${TWILIO_ACCOUNT_SID:-}" && is_set "${TWILIO_AUTH_TOKEN:-}" && is_set "${TWILIO_PHONE_NUMBER:-}"; then
  ok "Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)"
else
  warn "Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)"
fi

if is_set "${EMAIL_USER:-}" && is_set "${EMAIL_PASS:-}"; then
  ok "SMTP (EMAIL_USER, EMAIL_PASS)"
else
  warn "SMTP (EMAIL_USER, EMAIL_PASS)"
fi

if is_set "${WEBHOOK_SECRET:-}"; then
  ok "WEBHOOK_SECRET"
else
  warn "WEBHOOK_SECRET"
fi

echo
echo "== Mobile API Wiring =="
if grep -q "^const PROD_API_URL = .*'http://91.99.219.154:18000';" "$API_FILE"; then
  warn "Mobile PROD API still default in src/config/api.js (run set-mobile-api.sh)"
else
  ok "Mobile PROD API is customized in src/config/api.js"
fi

if is_set "${GOOGLE_GEOCODING_API_KEY:-}"; then
  ok "GOOGLE_GEOCODING_API_KEY present in deployment env"
else
  warn "GOOGLE_GEOCODING_API_KEY not set in deployment env"
fi

if grep -q "^const GOOGLE_GEOCODING_API_KEY = .*'';" "$API_FILE"; then
  warn "Mobile geocoding key not injected in src/config/api.js"
else
  ok "Mobile geocoding key is configured in src/config/api.js"
fi

echo
echo "Check complete."
