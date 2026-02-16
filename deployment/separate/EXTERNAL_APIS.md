# External API Inventory

This file lists external integrations found in the current codebase and their status.

## Active Outbound Integrations

1. Delhivery Logistics API
- Purpose: waybill allocation, shipment creation, pickup request, tracking, serviceability.
- Required key: `DELHIVERY_API_TOKEN` (or fallback `LOGISTICS_API_KEY`).
- Optional overrides:
  `DELHIVERY_BASE_URL`, `DELHIVERY_TIMEOUT_MS`, `DELHIVERY_AUTH_HEADER`,
  `DELHIVERY_AUTH_PREFIX`, `DELHIVERY_REQUEST_FORMAT`,
  `DELHIVERY_CREATE_SHIPMENT_PATH`, `DELHIVERY_PICKUP_REQUEST_PATH`,
  `DELHIVERY_TRACKING_PATH`, `DELHIVERY_WAYBILL_PATH`,
  `DELHIVERY_SERVICEABILITY_PATH`, `DELHIVERY_PICKUP_LOCATION`.
- Default base URL: `https://track.delhivery.com`.
- Code: `backend/services/delhivery.js`, `backend/routes/logistics.js`, `backend/routes/returns.js`.

2. Twilio SMS API
- Purpose: OTP/transactional/promotional SMS and status callbacks.
- Required keys: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.
- Optional key: `BASE_URL` (used to compose status callback URL).
- Code: `backend/services/sms.js`.

3. SMTP Provider via Nodemailer
- Purpose: email verification/password reset and notification emails.
- Required keys: `EMAIL_USER`, `EMAIL_PASS`.
- Recommended keys: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_FROM`.
- Code: `backend/services/email.js`, `backend/routes/auth.js`, `backend/routes/auth.mysql.js`.

4. Google Maps Geocoding API (Mobile App)
- Purpose: reverse geocoding / forward geocoding in mobile location flows.
- Required key: Google Maps Geocoding API key.
- Current status: key is not env-driven; code currently initializes with `null`.
- Code: `src/services/GeoLocationService.js`, `src/store/slices/locationSlice.js`.

5. Legacy Category Preference API (Mobile App)
- Purpose: sync category preference to a remote API.
- Endpoint: `https://api.wholexale.com/v1/user/category-preference`.
- Auth: bearer token from mobile storage.
- Current status: marked TODO/legacy in code.
- Code: `src/services/CategoryStorageService.js`.

## Inbound Provider Webhook Surfaces

1. Payment webhook receiver
- Route: `POST /api/webhooks/payment`.
- Secret: `WEBHOOK_SECRET`.

2. Logistics webhook receiver
- Route: `POST /api/webhooks/logistics`.
- Secret: `WEBHOOK_SECRET`.

3. AI service webhook receiver
- Route: `POST /api/webhooks/ai-service`.
- Secret: `WEBHOOK_SECRET`.

4. SMS status webhook receiver
- Route: `POST /api/webhooks/sms-status`.
- Secret: none enforced in current route.

Code: `backend/routes/webhooks.js`.

## Platform Services (External Infra Dependencies)

1. MongoDB
- Key: `MONGODB_URI`.
- Code: `backend/config/database.js`.

2. MySQL (auth mode)
- Keys: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`.
- Code: `backend/config/mysql.js`, `backend/services/authUserService.js`.

3. Redis
- Key: `REDIS_URL`.
- Code: `backend/config/database.js`.

4. PostgreSQL (optional)
- Key: `POSTGRES_URI`.
- Code: `backend/config/database.js`.

## Config Placeholders Not Wired to Active Runtime Logic

1. AWS S3 keys
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`.
- Status: upload route still returns mock URLs.
- Code: `backend/routes/upload.js`.

2. Cloudinary keys
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Status: dependency present, runtime not wired.

3. Generic payment key
- `PAYMENT_GATEWAY_API_KEY`.
- Status: finance route is placeholder for gateway integration.
- Code: `backend/routes/finance.js`, `backend/models/Finance.js`.

4. VAPID/Web push keys
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
- Status: placeholder only.

5. Sentry key
- `SENTRY_DSN`.
- Status: no backend bootstrap wiring.

6. AI external service keys
- `OPENAI_API_KEY`, `AI_SERVICE_URL`.
- Status: AI route currently stubbed.
- Code: `backend/routes/ai.js`.

7. Weather key
- `WEATHER_API_KEY`.
- Status: placeholder only.

## Current Deployment `.env` Gap Checklist

Based on `deployment/separate/.env` at audit time:

1. Missing for Delhivery integration
- `DELHIVERY_API_TOKEN` or `LOGISTICS_API_KEY`.

2. Missing for Twilio integration
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.

3. Missing for SMTP integration
- `EMAIL_USER`, `EMAIL_PASS` (and typically `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_FROM`).

4. Missing for signed webhooks
- `WEBHOOK_SECRET`.

5. Missing for Google Geocoding in mobile
- Google Maps API key assignment in `src/services/GeoLocationService.js`.

## Notes

1. Keep secrets only in server-side env files, never in client bundles.
2. Delhivery endpoint behavior can be tuned entirely via `DELHIVERY_*` variables.
