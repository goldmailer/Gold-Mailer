---
name: Notification system
description: How the GoldMailer frontend notification system works — frontend-only polling, no backend table.
---

## Architecture
Pure frontend polling approach — no backend changes needed.

- Hook: `artifacts/gold-mailer/src/hooks/useNotifications.ts`
- Component: `artifacts/gold-mailer/src/components/NotificationBell.tsx`
- Mounted in: `App.tsx` via `<NotificationPollerMount />` inside the AuthProvider tree

## How it works
1. On first mount: initializes `localStorage` with current KYC status + transaction statuses (no toasts fired)
2. Every 20 seconds: polls `/api/me` and `/api/transactions?limit=20`
3. Compares current state with stored state in `localStorage`
4. If KYC changed (pending → approved/declined) or transaction changed (pending → approved/declined): fires a toast + stores notification in `localStorage`
5. `NotificationBell` in Sidebar reads from `localStorage` every 5s and shows unread badge

**Why:** Avoids adding a notifications DB table; state survives page refreshes; works with existing auth session cookies.
