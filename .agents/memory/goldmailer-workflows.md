---
name: Gold Mailer workflows
description: Which Replit workflows reliably run for the GoldMailer project.
---

## Rule
Always use `API Server` (port 8080) for the backend and `artifacts/gold-mailer: web` for the frontend preview. Never try to restart `Gold Mailer` (port 26040) or `artifacts/api-server: API Server` — they will fail.

**Why:** `Gold Mailer` on port 26040 always crashes with EADDRINUSE because `artifacts/gold-mailer: web` already owns that port. `artifacts/api-server: API Server` fails because port 8080 is already taken by `API Server`.

**How to apply:** When verifying the app is running, check these two:
- `API Server` — backend at port 8080
- `artifacts/gold-mailer: web` — frontend Vite at port 26040 (accessed as the preview)

Restart only those two when code changes require a server restart.
