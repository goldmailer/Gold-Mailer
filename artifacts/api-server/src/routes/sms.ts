import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth-middleware";

const router = Router();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendSms(to: string, text: string): Promise<boolean> {
  const apiKey = process.env.INFOBIP_API_KEY;
  const baseUrl = process.env.INFOBIP_BASE_URL;
  const sender = process.env.INFOBIP_SENDER ?? "GoldMailer";
  if (!apiKey || !baseUrl) return false;
  try {
    const res = await fetch(`https://${baseUrl}/sms/2/text/advanced`, {
      method: "POST",
      headers: {
        "Authorization": `App ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            from: sender,
            destinations: [{ to }],
            text,
          },
        ],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// POST /sms/verify/request — send OTP to user's phone
router.post("/sms/verify/request", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const { phone } = req.body;
  if (!phone?.trim()) {
    res.status(400).json({ error: "Phone number is required" });
    return;
  }

  const cleaned = phone.trim();
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    `UPDATE phone_verifications SET used = true WHERE user_id = $1 AND used = false`,
    [userId],
  );
  await pool.query(
    `INSERT INTO phone_verifications (user_id, phone, code, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, cleaned, code, expiresAt],
  );

  const sent = await sendSms(cleaned, `Your GoldMailer verification code is: ${code}. It expires in 10 minutes.`);
  if (!sent) {
    res.status(503).json({ error: "SMS service unavailable. Please check your Twilio credentials." });
    return;
  }

  res.json({ success: true, message: "OTP sent to your phone." });
});

// POST /sms/verify/confirm — confirm OTP and mark phone as verified
router.post("/sms/verify/confirm", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const { code } = req.body;
  if (!code?.trim()) {
    res.status(400).json({ error: "Code is required" });
    return;
  }

  const result = await pool.query(
    `SELECT id, phone FROM phone_verifications
     WHERE user_id = $1 AND code = $2 AND used = false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [userId, code.trim()],
  );

  if (result.rows.length === 0) {
    res.status(400).json({ error: "Invalid or expired code. Please request a new one." });
    return;
  }

  const { id, phone } = result.rows[0];
  await pool.query(`UPDATE phone_verifications SET used = true WHERE id = $1`, [id]);
  await pool.query(
    `UPDATE users SET phone = $1, phone_verified = true WHERE id = $2`,
    [phone, userId],
  );

  res.json({ success: true, phone });
});

// GET /sms/status — check if user's phone is verified
router.get("/sms/status", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const result = await pool.query(
    `SELECT phone, phone_verified FROM users WHERE id = $1`,
    [userId],
  );
  const user = result.rows[0];
  res.json({
    phoneVerified: user?.phone_verified ?? false,
    phone: user?.phone ?? null,
  });
});

// GET /sms/messages — user gets their SMS conversation thread
router.get("/sms/messages", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const result = await pool.query(
    `SELECT id, direction, body, created_at
     FROM sms_messages
     WHERE user_id = $1
     ORDER BY created_at ASC
     LIMIT 200`,
    [userId],
  );
  res.json(result.rows.map((m: any) => ({
    id: m.id,
    direction: m.direction,
    body: m.body,
    createdAt: m.created_at,
  })));
});

// POST /sms/messages/reply — user sends a reply from dashboard
router.post("/sms/messages/reply", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const { body } = req.body;
  if (!body?.trim()) {
    res.status(400).json({ error: "Message body is required" });
    return;
  }

  const userRow = await pool.query(
    `SELECT phone, phone_verified FROM users WHERE id = $1`,
    [userId],
  );
  if (!userRow.rows[0]?.phone_verified) {
    res.status(403).json({ error: "Phone not verified. Please verify your phone first." });
    return;
  }

  await pool.query(
    `INSERT INTO sms_messages (user_id, direction, body) VALUES ($1, 'outbound', $2)`,
    [userId, body.trim()],
  );

  res.json({ success: true });
});

// POST /sms/webhook — Infobip incoming SMS webhook (no auth required)
router.post("/sms/webhook", async (req, res) => {
  const results = req.body?.results ?? [];
  const first = results[0] ?? {};
  const from = first.from ?? "";
  const body = first.text ?? first.cleanText ?? "";

  if (from && body) {
    const userResult = await pool.query(
      `SELECT id FROM users WHERE phone = $1 AND phone_verified = true`,
      [from],
    );
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      await pool.query(
        `INSERT INTO sms_messages (user_id, direction, body) VALUES ($1, 'inbound', $2)`,
        [userId, body],
      );
    }
  }

  res.json({ success: true });
});

// GET /admin/sms/conversations — admin views all users with SMS conversations
router.get("/admin/sms/conversations", requireAdmin, async (req, res) => {
  const result = await pool.query(`
    SELECT DISTINCT ON (sm.user_id)
      sm.user_id,
      u.email,
      u.first_name,
      u.last_name,
      u.phone,
      sm.body AS last_message,
      sm.direction AS last_direction,
      sm.created_at AS last_message_at,
      (SELECT COUNT(*) FROM sms_messages
       WHERE user_id = sm.user_id AND direction = 'outbound') AS unread_count
    FROM sms_messages sm
    JOIN users u ON u.id = sm.user_id
    ORDER BY sm.user_id, sm.created_at DESC
  `);
  res.json(result.rows.map((r: any) => ({
    userId: r.user_id,
    email: r.email,
    firstName: r.first_name,
    lastName: r.last_name,
    phone: r.phone,
    lastMessage: r.last_message,
    lastDirection: r.last_direction,
    lastMessageAt: r.last_message_at,
    unreadCount: Number(r.unread_count),
  })));
});

// GET /admin/sms/conversations/:userId — admin views a specific user's SMS thread
router.get("/admin/sms/conversations/:userId", requireAdmin, async (req, res) => {
  const userId = parseInt(String(req.params.userId));
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }
  const result = await pool.query(
    `SELECT id, direction, body, created_at
     FROM sms_messages
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId],
  );
  res.json(result.rows.map((m: any) => ({
    id: m.id,
    direction: m.direction,
    body: m.body,
    createdAt: m.created_at,
  })));
});

// POST /admin/sms/conversations/:userId/send — admin sends SMS to a user
router.post("/admin/sms/conversations/:userId/send", requireAdmin, async (req, res) => {
  const userId = parseInt(String(req.params.userId));
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }
  const { body } = req.body;
  if (!body?.trim()) { res.status(400).json({ error: "Message body is required" }); return; }

  const userRow = await pool.query(
    `SELECT phone, phone_verified FROM users WHERE id = $1`,
    [userId],
  );
  if (!userRow.rows[0]) { res.status(404).json({ error: "User not found" }); return; }
  if (!userRow.rows[0].phone_verified) {
    res.status(400).json({ error: "User has no verified phone number" });
    return;
  }

  await pool.query(
    `INSERT INTO sms_messages (user_id, direction, body) VALUES ($1, 'inbound', $2)`,
    [userId, body.trim()],
  );

  const sent = await sendSms(userRow.rows[0].phone, body.trim());
  res.json({ success: true, smsSent: sent });
});

export default router;
