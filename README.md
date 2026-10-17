# TillSync web

The web dashboard for TillSync: the same payments, team and device views as the mobile app, on a bigger screen.
Next.js (App Router) + Mantine 9, talking straight to Firebase (Auth + Firestore). There is no separate backend:
the Firestore security rules are the boundary, exactly as in the mobile app.

Totals are counted from M-Pesa messages read on the Till phone. They are never presented as verified revenue.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in the Firebase web app values
npm run dev                  # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`, `..._APP_ID` | Firebase web app config (Project settings → Your apps) |
| `NEXT_PUBLIC_USE_EMULATORS` | `true` to use the local Auth (9099) and Firestore (8080) emulators |

## Test without touching production

Start the emulators and seed them from the `firebase` folder, then run with `NEXT_PUBLIC_USE_EMULATORS=true npm run dev`.
Seeded accounts (password `demo1234`): `owner@demo.test`, `attendant@demo.test`, `supervisor@demo.test`, `nobody@demo.test`.

## What is in it

- Sign in with email/password or Google, password reset, create account
- Onboarding: create a business, or join one by sharing your account ID with the owner
- Home: today's total, comparison with yesterday at the same time, 7-day chart, latest payments (live)
- Payments: search, Today / 7 / 30 days, amount filters, CSV export (owner), payment details with the original message for those allowed
- Team (owner): add attendants or the Till phone by account ID, per-person permissions, remove access
- Devices: Till phone health (reporting / quiet / not reporting) with advice
- Account: profile, rename business, account ID, sign out
- Hide-amounts toggle, responsive down to phone width

## Scripts

`npm run dev`, `npm run build`, `npm run start`, `npm run lint`.

## Deploy

All pages are client-rendered, so it deploys anywhere Next.js does (Vercel, Firebase App Hosting, a Node host).
Set the four `NEXT_PUBLIC_FIREBASE_*` variables, keep `NEXT_PUBLIC_USE_EMULATORS=false`, and add the site's domain to
Firebase Auth → Settings → Authorized domains (needed for Google sign-in).
