# Wholexale External APIs and Required Keys

This is the current integration inventory from code (backend + deployment env templates), with status and required keys.

## 1) Delhivery Logistics API (Active)
- Purpose:
  - Shipment creation, pickup requests, tracking, serviceability, waybill allocation.
- Code:
  - `backend/services/delhivery.js`
  - `backend/routes/logistics.js`
  - `backend/routes/returns.js`
- Required env:
  - `DELHIVERY_API_TOKEN` (or fallback `LOGISTICS_API_KEY`)
  - `DELHIVERY_BASE_URL`
  - `DELHIVERY_AUTH_HEADER`
  - `DELHIVERY_AUTH_PREFIX`
  - `DELHIVERY_REQUEST_FORMAT`
  - `DELHIVERY_CREATE_SHIPMENT_PATH`
  - `DELHIVERY_PICKUP_REQUEST_PATH`
  - `DELHIVERY_TRACKING_PATH`
  - `DELHIVERY_WAYBILL_PATH`
  - `DELHIVERY_SERVICEABILITY_PATH`
  - `DELHIVERY_TIMEOUT_MS`
- If missing:
  - `/api/logistics/delhivery/*` and Delhivery-backed returns operations fail with provider-not-configured errors.

## 2) Twilio SMS API (Active/Optional)
- Purpose:
  - OTP and notification SMS.
- Code:
  - `backend/services/sms.js`
- Required env:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`
  - `BASE_URL` (for delivery status callback URLs)
- If missing:
  - SMS operations are skipped and return provider-not-configured responses.

## 3) SMTP Email Provider (Active/Optional)
- Purpose:
  - Email verification, password reset, offer/payment notifications.
- Code:
  - `backend/services/email.js`
- Required env:
  - `EMAIL_HOST`
  - `EMAIL_PORT`
  - `EMAIL_USER`
  - `EMAIL_PASS`
  - `EMAIL_FROM` (recommended)
- If missing:
  - Email sends fail at runtime.

## 4) Web Push VAPID (Configured in env template, likely optional)
- Purpose:
  - Browser push notifications.
- Code reference:
  - Keys are present in `backend/.env.example`.
- Required env:
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `VAPID_SUBJECT`
- If missing:
  - Web push setup cannot work when push logic is enabled.

## 5) File Storage Providers (Declared, not fully wired in current upload route)
- Purpose:
  - S3/Cloudinary media storage (future/partial).
- Code/reference:
  - Keys are in `backend/.env.example`.
  - Current upload route is mocked in `backend/routes/upload.js`.
- Env:
  - AWS:
    - `AWS_ACCESS_KEY_ID`
    - `AWS_SECRET_ACCESS_KEY`
    - `AWS_REGION`
    - `AWS_S3_BUCKET`
  - Cloudinary:
    - `CLOUDINARY_CLOUD_NAME`
    - `CLOUDINARY_API_KEY`
    - `CLOUDINARY_API_SECRET`
- Status:
  - Not currently a hard runtime dependency for existing mocked upload endpoints.

## 6) OpenAI / AI Service (Declared, AI endpoints currently stubbed)
- Purpose:
  - AI generation pipeline (future/partial).
- Code/reference:
  - Env in `backend/.env.example`: `OPENAI_API_KEY`, `AI_SERVICE_URL`
  - Current routes are stubs in `backend/routes/ai.js`.
- Status:
  - Not required for current stub behavior.

## 7) Generic Payment Gateway Key (Declared, no concrete gateway wiring yet)
- Purpose:
  - Future payment integration.
- Env:
  - `PAYMENT_GATEWAY_API_KEY`
- Status:
  - Placeholder; no hard binding to Razorpay/Stripe/Cashfree code yet.

## 8) Misc Declared External Keys (Placeholders)
- `WEATHER_API_KEY`
- Status:
  - Declared in env template, no active runtime integration found.

---

## Minimum Production External Setup (Current Code Reality)
To run current logistics + comms features end-to-end:
1. Delhivery keys (`DELHIVERY_*` + token)
2. Twilio keys (`TWILIO_*`)
3. SMTP email keys (`EMAIL_*`)
4. Optional but recommended for push: `VAPID_*`

Everything else above is currently placeholder/future unless corresponding implementation is added.
