#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deployment/separate"
ENV_FILE="$DEPLOY_DIR/.env"
OUT_FILE="$DEPLOY_DIR/runtime/nginx-admin2.conf"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

source "$ENV_FILE"

APP_ROOT="${APP_ROOT:-$ROOT_DIR}"
APP_DOMAIN="${APP_DOMAIN:-admin2.example.com}"
BACKEND_PORT="${BACKEND_PORT:-18000}"

mkdir -p "$DEPLOY_DIR/runtime"

cat > "$OUT_FILE" <<EOF
server {
    listen 80;
    server_name ${APP_DOMAIN};
    client_max_body_size 25m;

    root ${APP_ROOT}/deployment/separate/runtime/admin-dist;
    index index.html;

    # Convenience alias if user types /admin2
    location = /admin2 { return 302 /admin/login; }
    location = /admin2/ { return 302 /admin/login; }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT}/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }
}
EOF

echo "Rendered Nginx config: $OUT_FILE"

