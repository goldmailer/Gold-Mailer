# GoldMailer

A staking and investment platform built with React + Express.

## Tech Stack

- **Frontend** — React 19, Vite, Tailwind CSS, TanStack Query
- **Backend** — Node.js, Express 5, Drizzle ORM
- **Database** — PostgreSQL

## Environment Variables

Create a `.env` file (or set these in your host's dashboard):

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | Server port (defaults to `3000`) |
| `SESSION_SECRET` | No | Secret for session signing (defaults to a built-in key — set this in production) |
| `RESEND_API_KEY` | No | API key for sending emails via [Resend](https://resend.com) |

## Getting Started

### Prerequisites

- Node.js >= 20
- [pnpm](https://pnpm.io) >= 9 — install with `npm install -g pnpm`
- PostgreSQL database

### Install dependencies

```bash
pnpm install
```

### Push database schema

```bash
pnpm --filter @workspace/db exec drizzle-kit push
```

### Build

```bash
npm run build
```

This compiles the React frontend into `artifacts/gold-mailer/dist/public` and bundles the Express server into `artifacts/api-server/dist/`.

### Start

```bash
npm start
```

The server starts on `PORT` (default `3000`). It serves both the REST API at `/api/*` and the React app at `/`.

---

## Development

Run the API server and frontend dev server in separate terminals:

```bash
# Terminal 1 — API server (hot-reloads on change)
npm run dev:api

# Terminal 2 — Frontend (Vite HMR)
npm run dev:web
```

---

## Deployment

### Render / Railway / Fly.io

1. Set the **build command** to `pnpm install && npm run build`
2. Set the **start command** to `npm start`
3. Add the environment variables above

### Docker

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
```

### Heroku

```bash
heroku create your-app-name
heroku config:set DATABASE_URL=<your-postgres-url>
heroku config:set SESSION_SECRET=<random-secret>
heroku config:set RESEND_API_KEY=<your-resend-key>
git push heroku main
```

Add a `Procfile` if needed:
```
web: npm start
```
