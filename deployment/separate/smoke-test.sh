#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deployment/separate"
ENV_FILE="$DEPLOY_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

source "$ENV_FILE"

BACKEND_PORT="${BACKEND_PORT:-18000}"
APP_ROOT="${APP_ROOT:-$ROOT_DIR}"
ADMIN_MODE="${ADMIN_MODE:-static}"
ADMIN_PORT="${ADMIN_PORT:-18080}"

echo "Checking admin static build..."
test -f "$APP_ROOT/deployment/separate/runtime/admin-dist/index.html"

if [[ "$ADMIN_MODE" == "preview" ]]; then
  echo "Checking admin preview endpoint..."
  preview_ok="false"
  for _ in $(seq 1 20); do
    if curl -fsS "http://127.0.0.1:${ADMIN_PORT}/admin/login" >/dev/null 2>&1; then
      preview_ok="true"
      break
    fi
    sleep 1
  done
  if [[ "$preview_ok" != "true" ]]; then
    echo "Admin preview health check failed on port ${ADMIN_PORT}"
    exit 1
  fi
fi

echo "Checking backend health..."
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null

echo "Checking backend login endpoint (POST should return 400/401, not 404)..."
status_code="$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://127.0.0.1:${BACKEND_PORT}/api/auth/login" -H 'Content-Type: application/json' -d '{}')"
if [[ "$status_code" == "404" || "$status_code" == "500" ]]; then
  echo "Unexpected status from /api/auth/login: $status_code"
  exit 1
fi

echo "Checking public categories endpoint (should not 500)..."
categories_status="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${BACKEND_PORT}/api/categories")"
if [[ "$categories_status" == "500" ]]; then
  echo "Unexpected status from /api/categories: $categories_status"
  exit 1
fi

if [[ "${ADMIN_SEED_ASSERT_LOGIN:-false}" == "true" ]]; then
  if [[ -z "${ADMIN_SEED_EMAIL:-}" || -z "${ADMIN_SEED_PASSWORD:-}" ]]; then
    echo "ADMIN_SEED_ASSERT_LOGIN=true requires ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD in $ENV_FILE"
    exit 1
  fi

  echo "Checking seeded admin auth flow..."
  login_payload="{\"email\":\"${ADMIN_SEED_EMAIL}\",\"password\":\"${ADMIN_SEED_PASSWORD}\"}"
  login_response="$(curl -sS -X POST "http://127.0.0.1:${BACKEND_PORT}/api/auth/login" -H 'Content-Type: application/json' -d "$login_payload")"
  admin_token="$(printf '%s' "$login_response" | node -e "const fs=require('fs');try{const d=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(d.token||'')}catch{process.stdout.write('')}")"
  if [[ -z "$admin_token" ]]; then
    echo "Seeded admin login did not return token"
    exit 1
  fi

  admin_status="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${BACKEND_PORT}/api/admin/partitions" -H "Authorization: Bearer ${admin_token}")"
  if [[ "$admin_status" != "200" ]]; then
    echo "Unexpected status from /api/admin/partitions with seeded admin: $admin_status"
    exit 1
  fi

  logistics_status="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${BACKEND_PORT}/api/logistics/providers" -H "Authorization: Bearer ${admin_token}")"
  if [[ "$logistics_status" != "200" ]]; then
    echo "Unexpected status from /api/logistics/providers with seeded admin: $logistics_status"
    exit 1
  fi
fi

echo "Smoke test passed."
