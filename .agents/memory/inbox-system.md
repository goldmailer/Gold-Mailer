---
name: Inbox System
description: User inbox table, routes, and frontend page for in-app messaging
---

## Structure
- **DB table**: `user_inbox` created in `artifacts/api-server/src/app.ts` startup SQL (id, user_id FK, title, message, type, is_read, created_at)
- **Backend routes**: `artifacts/api-server/src/routes/inbox.ts` — registered in index.ts
  - GET /inbox/messages — user's messages (last 50)
  - GET /inbox/unread-count — unread count for badge
  - POST /inbox/messages/:id/read — mark one read
  - POST /inbox/read-all — mark all read
  - POST /admin/inbox/send — admin sends to user/all/NG-only (with optional email)
  - GET /admin/inbox/messages — admin view of recent messages
- **Frontend**: `artifacts/gold-mailer/src/pages/Inbox.tsx` at route `/inbox`
- **Sidebar badge**: `Sidebar.tsx` polls `/api/inbox/unread-count` every 60s and shows badge on Bell icon

## Message types
`announcement`, `kyc`, `reward`, `staking`, `info` — each has a distinct icon/color in the UI

**Why:** User requested an inbox/notifications system with daily messages to Nigerian users.
