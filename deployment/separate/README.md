# Separate Hosting (No Laravel Changes)

This setup deploys this repo as a fully separate stack with:
- Backend process: `wholexale2-backend`
- Admin web served as static files from Nginx (recommended)
- Dedicated MongoDB URI for this app only
- Separate Nginx vhost (example: `admin2.example.com`)

It does not modify your existing Laravel project.

## 1) Configure Variables

```bash
cp deployment/separate/.env.example deployment/separate/.env
```

Edit `deployment/separate/.env` and set:
- `APP_DOMAIN` (recommended separate subdomain, e.g. `admin2.example.com`)
- `APP_ROOT` (absolute path of this repo on server)
- `AUTH_DB` (`mysql` recommended for Phase 1 auth migration)
- If `AUTH_DB=mysql`: set `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
- If `AUTH_DB=mongo`: set `MONGODB_URI`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`
- `VITE_API_URL` (normally `https://admin2.example.com/api`)
- `VITE_DEMO_LOGIN=false` (recommended for real auth; disables demo shortcut login)
- `ADMIN_MODE=static` (recommended)
- Optional external integrations:
  - SMTP: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
  - Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
  - Webhooks: `WEBHOOK_SECRET`, `BASE_URL`
  - Delhivery: `DELHIVERY_API_TOKEN` (or fallback `LOGISTICS_API_KEY`) and optional `DELHIVERY_*` path/base overrides
- If you have no domain access and will use SSH tunnel, set:
  - `ADMIN_MODE=preview`
  - `FRONTEND_URL=http://127.0.0.1:28080`
  - `VITE_API_URL=http://127.0.0.1:28000/api`

## 2) (Optional) Bootstrap Server Packages

```bash
sudo bash deployment/separate/bootstrap-ubuntu.sh
```

If you do not have sudo/root package access for MongoDB, use the user-space runtime installer:

```bash
bash deployment/separate/setup-user-mongodb.sh
```

## 3) Initialize MySQL User/Database

```bash
sudo mysql < deployment/separate/mysql-setup.sql
```

If you changed DB/user/password in `.env`, update `deployment/separate/mysql-setup.sql` first.

## 4) Deploy App

```bash
chmod +x deployment/separate/deploy-separate.sh
bash deployment/separate/deploy-separate.sh
pm2 status
```

## 4.1) Seed Admin Login (Required for real admin auth)

```bash
set -a
source deployment/separate/runtime/backend.env
source deployment/separate/.env
set +a
npm --prefix backend run seed:admin
```

Seeded admin credentials come from `.env`:
- Email: `ADMIN_SEED_EMAIL`
- Password: `ADMIN_SEED_PASSWORD` (set a strong value)

Auto-seeding during deploy is disabled by default.
To enable it explicitly:
- `ADMIN_SEED_ON_DEPLOY=true`
- `ADMIN_SEED_EMAIL=...`
- `ADMIN_SEED_PASSWORD=...`

To rotate password during deploy seeding, also set:
- `ADMIN_SEED_RESET_PASSWORD=true`

If `ADMIN_SEED_RESET_PASSWORD=false` (default), existing admin password is kept unchanged.

The deploy script builds admin web to:
- `deployment/separate/runtime/admin-dist`
- If global `pm2` is missing, it auto-installs a local runtime PM2 under `deployment/separate/runtime/`.
- It also waits for backend `/health` and fails early if backend did not boot.
- It renders `deployment/separate/runtime/nginx-admin2.conf` from `.env`.
- In `ADMIN_MODE=preview`, it keeps `wholexale2-adminweb` running via PM2 (for tunnel mode).

## 5) Add Nginx Site (Separate Vhost)

1. Use rendered file `deployment/separate/runtime/nginx-admin2.conf` (or fallback template `deployment/separate/nginx-admin2.conf`).
2. Replace domain and ports if needed.
3. Enable the file and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 6) Optional SSL

```bash
sudo certbot --nginx -d admin2.example.com
```

## 7) Health Checks

```bash
curl http://127.0.0.1:18000/health
curl -I http://admin2.example.com/admin/login
bash deployment/separate/smoke-test.sh
```

Optional: validate seeded admin login in smoke test

```bash
export ADMIN_SEED_ASSERT_LOGIN=true
bash deployment/separate/smoke-test.sh
```

## 8) Logistics API (Delhivery)

When Delhivery keys are configured, backend exposes:
- `GET /api/logistics/providers`
- `POST /api/logistics/delhivery/waybills`
- `POST /api/logistics/delhivery/shipments`
- `POST /api/logistics/delhivery/pickups`
- `GET /api/logistics/delhivery/track`
- `GET /api/logistics/delhivery/serviceability`

Return pickup endpoint also supports provider flow:
- `POST /api/returns/:id/pickup` with `courierPartner=delhivery`
- Optional payload fields: `providerShipmentPayload`, `providerPickupPayload`, `allocateWaybill`, `createShipmentWithProvider`, `schedulePickupWithProvider`

## Current Scope (MySQL Phase 1)

- `AUTH_DB=mysql` migrates auth/user identity flows to MySQL.
- Non-auth marketplace modules still use existing Mongo models and should be migrated module-by-module in later phases.

## External Integrations Inventory

For a complete and current external API/service list (implemented vs placeholder),
see `deployment/separate/EXTERNAL_APIS.md`.

## Mobile App Connection

Set mobile production API URL before APK/IPA release:

```bash
bash deployment/separate/set-mobile-api.sh https://admin2.example.com
```

Then rebuild Android/iOS app.
