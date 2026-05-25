import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth } from "../lib/auth-middleware";
import { requireAdmin } from "../lib/auth-middleware";

const router = Router();

// GET /support/messages — authenticated user's chat history
router.get("/support/messages", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const result = await pool.query(
    `SELECT id, user_id, message, sender, is_read, created_at
     FROM support_messages
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId],
  );
  res.json(result.rows.map((m: any) => ({
    id: m.id,
    userId: m.user_id,
    message: m.message,
    sender: m.sender,
    isRead: m.is_read,
    createdAt: m.created_at,
  })));
});

// POST /support/messages — user sends a message
router.post("/support/messages", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const { message } = req.body;
  if (!message?.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }
  const result = await pool.query(
    `INSERT INTO support_messages (user_id, message, sender)
     VALUES ($1, $2, 'user')
     RETURNING id, user_id, message, sender, is_read, created_at`,
    [userId, message.trim()],
  );
  const m = result.rows[0];
  res.json({ id: m.id, userId: m.user_id, message: m.message, sender: m.sender, isRead: m.is_read, createdAt: m.created_at });
});

// GET /admin/support/chats — admin gets all user conversations
router.get("/admin/support/chats", requireAdmin, async (req, res) => {
  const result = await pool.query(`
    SELECT DISTINCT ON (sm.user_id)
      sm.user_id,
      u.email,
      u.first_name,
      u.last_name,
      sm.message AS last_message,
      sm.sender  AS last_sender,
      sm.created_at AS last_message_at,
      (SELECT COUNT(*) FROM support_messages
       WHERE user_id = sm.user_id AND sender = 'user' AND is_read = false) AS unread_count
    FROM support_messages sm
    JOIN users u ON u.id = sm.user_id
    ORDER BY sm.user_id, sm.created_at DESC
  `);
  res.json(result.rows.map((r: any) => ({
    userId: r.user_id,
    email: r.email,
    firstName: r.first_name,
    lastName: r.last_name,
    lastMessage: r.last_message,
    lastSender: r.last_sender,
    lastMessageAt: r.last_message_at,
    unreadCount: Number(r.unread_count),
  })));
});

// GET /admin/support/chats/:userId — admin views a user's conversation (marks messages read)
router.get("/admin/support/chats/:userId", requireAdmin, async (req, res) => {
  const userId = parseInt(String(req.params.userId));
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }
  await pool.query(
    `UPDATE support_messages SET is_read = true WHERE user_id = $1 AND sender = 'user'`,
    [userId],
  );
  const result = await pool.query(
    `SELECT id, user_id, message, sender, is_read, created_at
     FROM support_messages
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId],
  );
  res.json(result.rows.map((m: any) => ({
    id: m.id,
    userId: m.user_id,
    message: m.message,
    sender: m.sender,
    isRead: m.is_read,
    createdAt: m.created_at,
  })));
});

// POST /admin/support/chats/:userId/reply — admin replies to a user
router.post("/admin/support/chats/:userId/reply", requireAdmin, async (req, res) => {
  const userId = parseInt(String(req.params.userId));
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }
  const { message } = req.body;
  if (!message?.trim()) { res.status(400).json({ error: "Message is required" }); return; }
  const result = await pool.query(
    `INSERT INTO support_messages (user_id, message, sender, is_read)
     VALUES ($1, $2, 'admin', true)
     RETURNING id, user_id, message, sender, is_read, created_at`,
    [userId, message.trim()],
  );
  const m = result.rows[0];
  res.json({ id: m.id, userId: m.user_id, message: m.message, sender: m.sender, isRead: m.is_read, createdAt: m.created_at });
});

export default router;
