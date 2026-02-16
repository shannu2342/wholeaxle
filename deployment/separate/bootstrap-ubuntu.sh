#!/usr/bin/env bash
set -euo pipefail

# Bootstrap script for Ubuntu servers to host this app separately.
# It does NOT touch existing Laravel project files.

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash deployment/separate/bootstrap-ubuntu.sh"
  exit 1
fi

echo "Installing Node.js 20, PM2, Nginx, MySQL, Certbot..."

apt-get update
apt-get install -y curl gnupg ca-certificates lsb-release software-properties-common

# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2

# Nginx + Certbot
apt-get install -y nginx certbot python3-certbot-nginx

# MySQL
apt-get install -y mysql-server

systemctl enable --now mysql
systemctl enable --now nginx

echo "Bootstrap complete."
echo "Next:"
echo "1) Configure deployment/separate/.env"
echo "2) Run MySQL setup SQL from deployment/separate/mysql-setup.sql"
echo "3) Run: bash deployment/separate/deploy-separate.sh"
echo "4) Install Nginx vhost from deployment/separate/nginx-admin2.conf"
echo "5) Run Certbot for SSL"
