---
name: Investment Plans
description: New 10-tier plan structure replacing the old freeform stake amount input.
---

## Plan Structure

**Nigeria (NG):** 10 tiers, entry ₦1,000 → ₦10,000 (step ₦1,000), weekly return = entry × 15.8 (Plan 1: ₦1,000 → ₦15,800, Plan 10: ₦10,000 → ₦158,000).

**Global (USD):** 10 tiers, entries: $10, $120, $230, $340, $450, $560, $670, $780, $890, $1,000, weekly return = entry × 15.

## Where it lives
- `artifacts/gold-mailer/src/lib/currency.ts` — `NG_PLANS` / `USD_PLANS` arrays, `getConfig()` returns plans per country
- `artifacts/api-server/src/lib/currency.ts` — same arrays + `calcProfit(amount, country)` helper
- `artifacts/api-server/src/routes/stakes.ts` — uses `calcProfit()` instead of old formula
- `artifacts/gold-mailer/src/pages/Stake.tsx` — plan card grid UI, no freeform amount input

**Why:** User specified 10-tier model with exact NG returns starting at ₦15,800; consistency kept with ~15× profit multiplier for all countries.
