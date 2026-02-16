#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deployment/separate"
RUNTIME_DIR="$DEPLOY_DIR/runtime"
ENV_FILE="$DEPLOY_DIR/.env"
ADMIN_DIST_DIR="$RUNTIME_DIR/admin-dist"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  echo "Copy $DEPLOY_DIR/.env.example to $ENV_FILE and fill values."
  exit 1
fi

source "$ENV_FILE"
ADMIN_MODE="${ADMIN_MODE:-static}"
FRONTEND_URL="${FRONTEND_URL:-https://$APP_DOMAIN}"

mkdir -p "$RUNTIME_DIR"

required_vars=(
  APP_DOMAIN
  APP_ROOT
  AUTH_DB
  BACKEND_PORT
  JWT_SECRET
  JWT_REFRESH_SECRET
  SESSION_SECRET
  VITE_API_URL
)

for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "Required variable is missing in $ENV_FILE: $var"
    exit 1
  fi
done

if [[ "$AUTH_DB" == "mysql" ]]; then
  mysql_required=(MYSQL_HOST MYSQL_PORT MYSQL_DATABASE MYSQL_USER MYSQL_PASSWORD)
  for var in "${mysql_required[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      echo "Required variable is missing in $ENV_FILE for AUTH_DB=mysql: $var"
      exit 1
    fi
  done
else
  if [[ -z "${MONGODB_URI:-}" ]]; then
    echo "Required variable is missing in $ENV_FILE for AUTH_DB=mongo: MONGODB_URI"
    exit 1
  fi
fi

PM2_CMD=""
if command -v pm2 >/dev/null 2>&1; then
  PM2_CMD="pm2"
else
  echo "Global pm2 not found. Installing local pm2 runtime..."
  npm --prefix "$RUNTIME_DIR" install pm2 --no-save
  PM2_CMD="node $RUNTIME_DIR/node_modules/pm2/bin/pm2"
fi

NODE_MAJOR="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "Warning: Node $(node -v) detected. Node 20+ is recommended for this repo."
fi

echo "Installing backend dependencies..."
npm --prefix "$ROOT_DIR/backend" ci

echo "Installing admin-web dependencies..."
npm --prefix "$ROOT_DIR/admin-web" ci

echo "Building admin-web with VITE_API_URL=$VITE_API_URL"
(
  cd "$ROOT_DIR/admin-web"
  VITE_API_URL="$VITE_API_URL" \
  VITE_DEMO_LOGIN="${VITE_DEMO_LOGIN:-false}" \
  npm run build
)

rm -rf "$ADMIN_DIST_DIR"
mkdir -p "$ADMIN_DIST_DIR"
cp -r "$ROOT_DIR/admin-web/dist/." "$ADMIN_DIST_DIR/"

BACKEND_ENV_FILE="$RUNTIME_DIR/backend.env"
cat > "$BACKEND_ENV_FILE" <<EOF
NODE_ENV=${NODE_ENV:-production}
AUTH_DB=$AUTH_DB
PORT=$BACKEND_PORT
FRONTEND_URL=$FRONTEND_URL
BASE_URL=${BASE_URL:-$FRONTEND_URL}
MONGODB_URI=${MONGODB_URI:-}
MYSQL_HOST=${MYSQL_HOST:-}
MYSQL_PORT=${MYSQL_PORT:-}
MYSQL_DATABASE=${MYSQL_DATABASE:-}
MYSQL_USER=${MYSQL_USER:-}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-}
POSTGRES_URI=${POSTGRES_URI:-}
REDIS_URL=${REDIS_URL:-redis://127.0.0.1:6379}
EMAIL_HOST=${EMAIL_HOST:-}
EMAIL_PORT=${EMAIL_PORT:-}
EMAIL_USER=${EMAIL_USER:-}
EMAIL_PASS=${EMAIL_PASS:-}
EMAIL_FROM=${EMAIL_FROM:-}
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID:-}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN:-}
TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER:-}
WEBHOOK_SECRET=${WEBHOOK_SECRET:-}
LOGISTICS_API_KEY=${LOGISTICS_API_KEY:-}
DELHIVERY_API_TOKEN=${DELHIVERY_API_TOKEN:-}
DELHIVERY_BASE_URL=${DELHIVERY_BASE_URL:-}
DELHIVERY_TIMEOUT_MS=${DELHIVERY_TIMEOUT_MS:-}
DELHIVERY_AUTH_HEADER=${DELHIVERY_AUTH_HEADER:-}
DELHIVERY_AUTH_PREFIX=${DELHIVERY_AUTH_PREFIX:-}
DELHIVERY_REQUEST_FORMAT=${DELHIVERY_REQUEST_FORMAT:-}
DELHIVERY_CREATE_SHIPMENT_PATH=${DELHIVERY_CREATE_SHIPMENT_PATH:-}
DELHIVERY_PICKUP_REQUEST_PATH=${DELHIVERY_PICKUP_REQUEST_PATH:-}
DELHIVERY_TRACKING_PATH=${DELHIVERY_TRACKING_PATH:-}
DELHIVERY_WAYBILL_PATH=${DELHIVERY_WAYBILL_PATH:-}
DELHIVERY_SERVICEABILITY_PATH=${DELHIVERY_SERVICEABILITY_PATH:-}
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRES_IN=30d
SESSION_SECRET=$SESSION_SECRET
RATE_LIMIT_WINDOW_MS=${RATE_LIMIT_WINDOW_MS:-900000}
RATE_LIMIT_MAX_REQUESTS=${RATE_LIMIT_MAX_REQUESTS:-100}
MONGO_SERVER_SELECTION_TIMEOUT_MS=${MONGO_SERVER_SELECTION_TIMEOUT_MS:-5000}
EOF

echo "Starting backend process: wholexale2-backend"
set -a
source "$BACKEND_ENV_FILE"
set +a
$PM2_CMD delete wholexale2-backend >/dev/null 2>&1 || true
$PM2_CMD start "$ROOT_DIR/backend/server.js" --name wholexale2-backend --time

echo "Waiting for backend health on port $BACKEND_PORT..."
BACKEND_HEALTH_WAIT_SECONDS="${BACKEND_HEALTH_WAIT_SECONDS:-30}"
healthy="false"
for _ in $(seq 1 "$BACKEND_HEALTH_WAIT_SECONDS"); do
  if curl -fsS "http://127.0.0.1:$BACKEND_PORT/health" >/dev/null 2>&1; then
    healthy="true"
    break
  fi
  sleep 1
done

if [[ "$healthy" != "true" ]]; then
  echo "Backend failed health check. Recent PM2 logs:"
  $PM2_CMD logs wholexale2-backend --lines 40 --nostream || true
  exit 1
fi

if [[ -n "${ADMIN_SEED_EMAIL:-}" && -n "${ADMIN_SEED_PASSWORD:-}" ]]; then
  echo "Seeding admin account: $ADMIN_SEED_EMAIL ($AUTH_DB)"
  ADMIN_SEED_EMAIL="$ADMIN_SEED_EMAIL" \
  ADMIN_SEED_PASSWORD="$ADMIN_SEED_PASSWORD" \
  ADMIN_SEED_ROLE="${ADMIN_SEED_ROLE:-admin}" \
  ADMIN_SEED_FIRST_NAME="${ADMIN_SEED_FIRST_NAME:-Admin}" \
  ADMIN_SEED_LAST_NAME="${ADMIN_SEED_LAST_NAME:-Demo}" \
  ADMIN_SEED_PHONE="${ADMIN_SEED_PHONE:-9000000003}" \
  AUTH_DB="$AUTH_DB" \
  MONGODB_URI="${MONGODB_URI:-}" \
  MYSQL_HOST="${MYSQL_HOST:-}" \
  MYSQL_PORT="${MYSQL_PORT:-}" \
  MYSQL_DATABASE="${MYSQL_DATABASE:-}" \
  MYSQL_USER="${MYSQL_USER:-}" \
  MYSQL_PASSWORD="${MYSQL_PASSWORD:-}" \
  npm --prefix "$ROOT_DIR/backend" run seed:admin
fi

if [[ "$ADMIN_MODE" == "preview" ]]; then
  if [[ -z "${ADMIN_PORT:-}" ]]; then
    echo "ADMIN_PORT is required when ADMIN_MODE=preview"
    exit 1
  fi
  echo "Starting admin preview process: wholexale2-adminweb on port $ADMIN_PORT"
  $PM2_CMD delete wholexale2-adminweb >/dev/null 2>&1 || true
  $PM2_CMD start npm --name wholexale2-adminweb --cwd "$ROOT_DIR/admin-web" -- run preview -- --host 0.0.0.0 --port "$ADMIN_PORT"
else
  echo "ADMIN_MODE=static: admin built files prepared at $ADMIN_DIST_DIR"
  $PM2_CMD delete wholexale2-adminweb >/dev/null 2>&1 || true
fi

$PM2_CMD save

echo "Rendering Nginx config from .env..."
bash "$DEPLOY_DIR/render-nginx.sh"

echo "Deployment complete."
echo "Backend health:  http://127.0.0.1:$BACKEND_PORT/health"
if [[ "$ADMIN_MODE" == "preview" ]]; then
  echo "Admin preview:   http://127.0.0.1:$ADMIN_PORT/admin/login"
else
  echo "Admin static:    $ADMIN_DIST_DIR"
fi
echo "Next: apply Nginx template: $DEPLOY_DIR/nginx-admin2.conf"
