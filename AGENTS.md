# AGENTS.md — GoldMailer (Base44 dev environment)

## Stack
- **pnpm workspace monorepo** (lockfile v9 → use `pnpm@9`). Packages live in `artifacts/*` and `lib/*`.
- **Frontend**: `artifacts/gold-mailer` — React 19 + Vite 7 + Tailwind 4 + wouter + TanStack Query.
- **Backend**: `artifacts/api-server` — Express 5, bundled to a single file with esbuild (`build.mjs`, uses `esbuild-plugin-pino`).
- **DB**: PostgreSQL. The API **auto-creates all tables/columns on boot** via inline SQL in `artifacts/api-server/src/app.ts` — no separate migration step is needed.
- Shared libs: `lib/db` (Drizzle + pg pool), `lib/api-zod`, `lib/api-client-react` (generated API client using relative `/api` paths).

## Running here
`docker compose -f docker-compose.base44.yml up -d` brings up:
- `db` — postgres:16-alpine (healthchecked).
- `setup` — one-shot `pnpm install` into the bind-mounted `node_modules` (shared by api + web).
- `api` — `pnpm --filter @workspace/api-server run dev` (esbuild bundle + run, port 8080 internal).
- `web` — Vite dev server on 5173, mapped to **host port 3000**. Vite proxies `/api` → `http://api:8080` (single origin; the API is not exposed publicly).

Frontend edits hot-reload via Vite HMR. **Backend edits do NOT auto-reload** — the project's dev script builds once and runs; restart the `api` service (`docker compose -f docker-compose.base44.yml restart api`) or `reload_preview` after backend changes.

## Environment / secrets
- **`DATABASE_URL`** — required at boot (throws otherwise). Set in compose to the local Postgres.
- **`DATABASE_SSL=false`** — set in compose. The `lib/db` pool forces SSL for non-localhost hosts (Replit managed-DB heuristic); the compose `db` host is non-localhost and has no SSL, so SSL must be explicitly disabled. This override is backward-compatible (unset = old behavior).
- `SESSION_SECRET` — has a built-in dev default; set to a real value in production.
- Optional external integrations (NOT required to boot; only used when their features are called):
  - `RESEND_API_KEY` (transactional email), `NOWPAYMENTS_API_KEY` / `NOWPAYMENTS_IPN_SECRET` (crypto payments), `ADMIN_EMAIL` / `ADMIN_PASSWORD` (admin login), `INFOBIP_*` (SMS), `OPENAI_API_KEY` (support chat).
  - `VITE_MONETAG_ZONE_*` — public frontend ad-zone ids.

## Quirks
- `vite.config.ts` reads `VITE_API_PROXY_TARGET` (defaults to `http://localhost:8080`) so the dev proxy can target the compose `api` service.
- In dev the API logs a harmless `Frontend build not found` warning — Vite serves the frontend in dev; the API only serves the built bundle in production.
- `allowedHosts: true` is already set in the Vite config; `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` is passed through for the preview origin.

## Verify it works
- `curl localhost:3000/api/health` → `{"status":"ok",...}`
- `curl localhost:3000/` → Vite-served React app (look for `/@vite/client`).
