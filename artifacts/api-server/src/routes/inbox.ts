import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth-middleware";
import { sendInboxNotificationEmail } from "../lib/email";

const router = Router();

// GET /inbox/messages — authenticated user's inbox
router.get("/inbox/messages", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const result = await pool.query(
    `SELECT id, title, message, type, is_read, created_at
     FROM user_inbox
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId],
  );
  res.json(result.rows.map((m: any) => ({
    id: m.id,
    title: m.title,
    message: m.message,
    type: m.type,
    isRead: m.is_read,
    createdAt: m.created_at,
  })));
});

// GET /inbox/unread-count
router.get("/inbox/unread-count", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const result = await pool.query(
    `SELECT COUNT(*) AS count FROM user_inbox WHERE user_id = $1 AND is_read = false`,
    [userId],
  );
  res.json({ count: parseInt(result.rows[0].count, 10) });
});

// POST /inbox/messages/:id/read — mark a message as read
router.post("/inbox/messages/:id/read", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid message id" }); return; }
  await pool.query(
    `UPDATE user_inbox SET is_read = true WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  res.json({ success: true });
});

// POST /inbox/read-all — mark all as read
router.post("/inbox/read-all", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  await pool.query(`UPDATE user_inbox SET is_read = true WHERE user_id = $1`, [userId]);
  res.json({ success: true });
});

// POST /admin/inbox/send — admin sends message to one or all users
router.post("/admin/inbox/send", requireAdmin, async (req, res) => {
  const { userId, title, message, type = "announcement", sendEmail = false, targetNgOnly = false } = req.body;

  if (!title?.trim() || !message?.trim()) {
    res.status(400).json({ error: "Title and message are required" });
    return;
  }

  if (userId) {
    // Send to specific user
    await pool.query(
      `INSERT INTO user_inbox (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
      [userId, title.trim(), message.trim(), type],
    );
    if (sendEmail) {
      const userRow = await pool.query(
        `SELECT email, first_name FROM users WHERE id = $1`, [userId],
      );
      if (userRow.rows.length > 0) {
        sendInboxNotificationEmail(userRow.rows[0].email, userRow.rows[0].first_name, title.trim(), message.trim()).catch(() => {});
      }
    }
    res.json({ success: true, sent: 1 });
  } else {
    // Broadcast to all users (or NG only)
    const filter = targetNgOnly ? `WHERE country = 'NG'` : `WHERE 1=1`;
    const users = await pool.query(`SELECT id, email, first_name FROM users ${filter}`);
    for (const u of users.rows) {
      await pool.query(
        `INSERT INTO user_inbox (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
        [u.id, title.trim(), message.trim(), type],
      );
      if (sendEmail) {
        sendInboxNotificationEmail(u.email, u.first_name, title.trim(), message.trim()).catch(() => {});
      }
    }
    res.json({ success: true, sent: users.rows.length });
  }
});

// GET /admin/inbox/messages — admin views all inbox messages (recent)
router.get("/admin/inbox/messages", requireAdmin, async (req, res) => {
  const result = await pool.query(
    `SELECT ui.id, ui.user_id, ui.title, ui.message, ui.type, ui.is_read, ui.created_at,
            u.email, u.first_name, u.last_name
     FROM user_inbox ui
     JOIN users u ON u.id = ui.user_id
     ORDER BY ui.created_at DESC
     LIMIT 100`,
  );
  res.json(result.rows.map((m: any) => ({
    id: m.id,
    userId: m.user_id,
    title: m.title,
    message: m.message,
    type: m.type,
    isRead: m.is_read,
    createdAt: m.created_at,
    userEmail: m.email,
    userName: [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email,
  })));
});

export default router;
