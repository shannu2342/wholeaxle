# Mobile Setup + API Key Wiring Checklist

Use this checklist to complete mobile app configuration against the separate deployment stack.

## 1) Lock Runtime to Node 20

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install 20
nvm alias default 20
nvm use 20
node -v
```

Expected: `v20.x.x`.

## 2) Confirm Backend/Admin Are Running

```bash
cd /home/appuser/wholeaxle
bash deployment/separate/deploy-separate.sh
bash deployment/separate/smoke-test.sh
```

## 3) Pick Mobile API Mode

1. Production domain mode (recommended):
`https://admin2.wholexale.com`

2. SSH tunnel mode (no domain access):
Backend: `http://127.0.0.1:28000`
Admin preview: `http://127.0.0.1:28080`

## 4) Wire Mobile API URL + Geocoding Key

```bash
cd /home/appuser/wholeaxle
bash deployment/separate/set-mobile-api.sh <mobile-api-base-url> <google-geocoding-api-key>
```

Examples:

```bash
# Production
bash deployment/separate/set-mobile-api.sh https://admin2.wholexale.com "YOUR_GOOGLE_KEY"

# Tunnel mode
bash deployment/separate/set-mobile-api.sh http://127.0.0.1:28000 "YOUR_GOOGLE_KEY"
```

If you want to update only API URL, omit the second argument.

## 5) Validate Keys and Wiring

```bash
cd /home/appuser/wholeaxle
bash deployment/separate/check-api-keys.sh
```

This validates:
- Core deploy env keys
- DB keys
- Delhivery/Twilio/SMTP/Webhook key presence
- Mobile API URL and geocoding key wiring in `src/config/api.js`

## 6) Build/Run Mobile App

```bash
cd /home/appuser/wholeaxle
npm ci
npm run android
# or
npm run ios
```

## 7) Minimum External Keys for Production

1. Required for core app auth/deploy:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `SESSION_SECRET`
- DB keys (`MYSQL_*` or `MONGODB_URI`)

2. Required for logistics:
- `DELHIVERY_API_TOKEN` (or `LOGISTICS_API_KEY`)

3. Required for SMS:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

4. Required for email:
- `EMAIL_USER`
- `EMAIL_PASS`
- recommended: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_FROM`

5. Required for signed webhooks:
- `WEBHOOK_SECRET`

6. Required for mobile reverse geocoding:
- Google Geocoding API key (wired via `set-mobile-api.sh`)

## 8) Final Quick Verification

```bash
curl -sS http://127.0.0.1:18000/health
```

Then test login + location permission flow on device/emulator.
