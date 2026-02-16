#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/deployment/separate/runtime"
INSTALL_BASE="$RUNTIME_DIR/mongodb"
MONGO_VERSION="${MONGO_VERSION:-8.0.4}"
MONGO_ARCHIVE="mongodb-linux-x86_64-ubuntu2404-${MONGO_VERSION}.tgz"
MONGO_URL="${MONGO_URL:-https://fastdl.mongodb.org/linux/${MONGO_ARCHIVE}}"
MONGO_EXTRACT_DIR="$INSTALL_BASE/mongodb-linux-x86_64-ubuntu2404-${MONGO_VERSION}"
MONGO_CURRENT_LINK="$INSTALL_BASE/current"
MONGO_DBPATH="${MONGO_DBPATH:-$RUNTIME_DIR/mongodb-data}"
MONGO_LOGPATH="${MONGO_LOGPATH:-$RUNTIME_DIR/mongodb.log}"
MONGO_PORT="${MONGO_PORT:-27017}"

mkdir -p "$INSTALL_BASE" "$MONGO_DBPATH" "$RUNTIME_DIR"

if [[ ! -x "$MONGO_EXTRACT_DIR/bin/mongod" ]]; then
  echo "Downloading MongoDB ${MONGO_VERSION}..."
  curl -L "$MONGO_URL" -o "$INSTALL_BASE/$MONGO_ARCHIVE"
  echo "Extracting MongoDB..."
  tar -xzf "$INSTALL_BASE/$MONGO_ARCHIVE" -C "$INSTALL_BASE"
fi

ln -sfn "$MONGO_EXTRACT_DIR" "$MONGO_CURRENT_LINK"

PM2_CMD=""
if command -v pm2 >/dev/null 2>&1; then
  PM2_CMD="pm2"
else
  npm --prefix "$RUNTIME_DIR" install pm2 --no-save
  PM2_CMD="node $RUNTIME_DIR/node_modules/pm2/bin/pm2"
fi

MONGOD_BIN="$MONGO_CURRENT_LINK/bin/mongod"
if [[ ! -x "$MONGOD_BIN" ]]; then
  echo "mongod binary not found at $MONGOD_BIN"
  exit 1
fi

echo "Starting PM2 MongoDB process: wholexale2-mongodb"
$PM2_CMD delete wholexale2-mongodb >/dev/null 2>&1 || true
$PM2_CMD start "$MONGOD_BIN" --name wholexale2-mongodb -- \
  --bind_ip 127.0.0.1 \
  --port "$MONGO_PORT" \
  --dbpath "$MONGO_DBPATH" \
  --logpath "$MONGO_LOGPATH" \
  --logappend \
  --wiredTigerCacheSizeGB 0.25

$PM2_CMD save

echo "MongoDB PM2 process started."
echo "URI: mongodb://127.0.0.1:${MONGO_PORT}/wholexale_admin2"
