# Revision Dashboard (Placements) — Free Stack

Dark, light-blue revision planner for **DSA + any subject** (DBMS/CN/OOPS/System Design/etc).

## Features
- Google sign-in (**NextAuth + Google OAuth**)
- Add revision items: **subject + link + tags + difficulty + next revision date/time + interval**
- Dashboard shows **due items** with **Revise** button (opens link + reschedules)
- Inline **revision notes**
- Calendar month view: **revision schedule + important dates**
- Free browser push: **Web Push (VAPID) + Service Worker**, stored in MongoDB
- Optional free scheduling: **GitHub Actions cron** calls an API endpoint

## Run locally
1) Install
```bash
npm install
```

2) Create `.env.local` from `.env.local.example` and fill values from Firebase console.
2) Create `.env.local` from `.env.local.example` and fill values (Google OAuth + MongoDB + VAPID).

3) Start dev server
```bash
npm run dev
```

## MongoDB Atlas setup (free)
1) Create an Atlas account → create a **FREE M0** cluster
2) Database Access → create a DB user
3) Network Access → allow your IP (or `0.0.0.0/0` for quick testing)
4) Connect → Drivers → copy the URI into `MONGODB_URI`

## Push notifications (free)
1) Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```
2) Put them into:
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
3) In the app: Dashboard → **Enable push**

## Email verification (free SMTP)
This app sends a verification email on signup and requires verification before login.

### Option A: Gmail SMTP (free)
1) Enable 2FA on your Google account.
2) Create an App Password (Google Account → Security → App Passwords).
3) Set these in `.env.local`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Revision App <your_email@gmail.com>"
```

### Option B: SendGrid free tier (SMTP)
1) Create a SendGrid account (free tier is enough for small/medium usage).
2) Create an API key and use it as SMTP password.
3) Set these in `.env.local`:
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM="Revision App <your_verified_sender_email>"
```

## Free scheduling (GitHub Actions)
Call:
`GET /api/cron/send-reminders?secret=CRON_SECRET`
from a scheduled GitHub Action (every 15 mins / 30 mins).

## Deploy
- **Frontend + API**: Vercel (set env vars)
- **DB**: MongoDB Atlas free tier

