# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # dev server at http://localhost:3000
npm run build        # production build
npm start            # production server at port 4000
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
```

No test runner is configured.

## Architecture

**NAIC 2026** is a Diabetic Retinopathy (DR) screening prototype. Next.js 16 + React 19 with App Router. All pages live under `app/[lang]/` for i18n routing.

### i18n

Eight locales: `en`, `zh-hans`, `zh-hant`, `ko`, `ru`, `ms`, `ja`, `de`. The locale is a dynamic route segment. `getDictionary()` in [app/[lang]/dictionaries.ts](app/[lang]/dictionaries.ts) loads JSON from `app/[lang]/dictionaries/`, deep-merges the target locale over English, and falls back to path-string keys for missing translations. Dictionaries are server-only (`'server-only'` import).

### Auth

`AuthContext` ([src/context/AuthContext.tsx](src/context/AuthContext.tsx)) wraps the app. On load it auto-signs users in anonymously via Firebase. Email/password and Google OAuth are available but require email verification — unverified non-anonymous users are rejected in the `onAuthStateChanged` listener. Firebase is initialised as a singleton in [src/lib/firebase.ts](src/lib/firebase.ts); Firestore DB name is `naic-site-db`.

### Image Analysis Flow

Two separate paths exist:

1. **Client → FastAPI** (`AnalysisService` in [src/services/AnalysisService.ts](src/services/AnalysisService.ts)): POSTs the image file directly to `NEXT_PUBLIC_API_URL/predict` (defaults to `http://127.0.0.1:8000/api/v1`). This is the real ML path.

2. **Client → Next.js API** (`POST /api/predict`): Accepts a `gcsKey`, simulates 2.5 s inference, returns random DR grade + probabilities. This is the demo/fallback path used when no FastAPI backend is running.

### Storage

- **Upload**: `POST /api/upload` ([app/api/upload/route.ts](app/api/upload/route.ts)) receives a file + `sessionId`, uploads to GCS under `sessions/{sessionId}/{uuid}.ext`, and returns a 24-hour signed URL.
- **GCS helpers**: [src/lib/gcs.ts](src/lib/gcs.ts) — lazily initialised singleton using `GCS_BUCKET_NAME` + `GCS_KEY_PATH` (service account JSON file, default `service-account.json` in project root).
- **Session persistence**: [src/services/StorageService.ts](src/services/StorageService.ts) stores GCS metadata (key + signed URL) in `localStorage` under `NAIC_SCREENING_SESSION`. No binary blobs.

### Key Types

`Scan` and `ScreeningResult` are defined in [src/types/index.ts](src/types/index.ts). `StorageService` has its own local `ScreeningResult` with `prediction: number` (0–4 DR grade); the global one in `src/types` has `prediction: string | number`.

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | FastAPI backend base URL (default: `http://127.0.0.1:8000/api/v1`) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase |
| `GCS_BUCKET_NAME` | GCS bucket name |
| `GCS_KEY_PATH` | Path to service account JSON (relative to project root) |

Set these in `.env.local`.
