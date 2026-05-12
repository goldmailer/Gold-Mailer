# Gold Mailer

A full-stack Nigerian staking platform where users deposit funds, stake them for 7 days, and earn guaranteed profit — plus daily ₦100 rewards per active stake.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/gold-mailer run dev` — run the frontend (Vite, proxied at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `RESEND_API_KEY`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4, wouter (routing), react-hook-form + zod
- UI: shadcn/ui components, lucide-react icons
- API: Express 5 + express-session + connect-pg-simple (session cookies, NOT JWT)
- DB: PostgreSQL + Drizzle ORM
- Email: Resend (noreply@mail.goldmailer.xyz)
- API codegen: Orval (from OpenAPI spec in lib/api-spec/openapi.yaml)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — all Drizzle table definitions (users, otp_codes, cards, stakes, transactions, settings)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks + Zod schemas
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/api-server/src/lib/` — session, auth middleware, email helpers
- `artifacts/gold-mailer/src/pages/` — all frontend pages
- `artifacts/gold-mailer/src/contexts/AuthContext.tsx` — session state management
- `artifacts/gold-mailer/src/components/Sidebar.tsx` — navigation sidebar

## Architecture decisions

- Sessions via express-session + connect-pg-simple (table: user_sessions auto-created). Frontend uses credentials: include — handled by custom-fetch in api-client-react.
- Dark mode by default — applied via `document.documentElement.classList.add("dark")` in main.tsx.
- Admin panel is hidden — accessible only via tapping "GOLDMAILER" footer logo 10 times → PIN "2006" → /admin route.
- Signup bonus (₦3,000) credited on first card add via Drizzle `sql` template literal (avoids raw SQL injection).
- Profit formula: `Math.floor((amount / 2700) * 8000)` — proportional scaling from base rate.
- Daily rewards: ₦100/day per active stake, claimed individually, resets at midnight.
- Admin session flag (isAdmin) set at login — admin routes protected by requireAdmin middleware.

## Product

- Landing page with staking stats and feature highlights
- Register (email + password) → verify email (6-digit OTP via Resend) → setup profile → add card → dashboard
- Dashboard: balance, active stakes, total profit, daily reward claims
- Virtual cards page: glossy card UI with masked number, "View Details" modal shows full card data
- Stake: min ₦2,700, max ₦100,000, 7-day lock, profit preview scales as you type
- Deposit: copy admin bank account → enter transaction ID → submit for approval
- Withdraw: enter bank details → submit for admin approval
- Transactions: history with pending/approved/declined status badges
- Settings: change email and password
- Admin panel (PIN: 2006): manage users, approve/decline transactions, set deposit account

## User preferences

- Dark mode by default (gold #F5C518 accent, near-black background)
- No emojis in the UI
- All amounts in Nigerian Naira with ₦ symbol and commas (e.g. ₦2,700)
- Emails sent from noreply@goldmailer.xyz

## Gotchas

- The `db.execute` raw SQL must use Drizzle's `sql` template tag from `drizzle-orm` — NOT raw template strings.
- Session secret falls back to a hardcoded value if SESSION_SECRET not set — always set in production.
- After adding or changing routes, rebuild the API server and restart the workflow.
- Sessions use httpOnly cookies — browser must use credentials: include; curl testing needs -c/-b cookie flags.
- Admin access requires `isAdmin: true` in the users table — set manually in DB for admin accounts.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- OpenAPI spec at `lib/api-spec/openapi.yaml` is the source of truth for all API contracts
