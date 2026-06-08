import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth } from "../lib/auth-middleware";
import { requireAdmin } from "../lib/auth-middleware";

const router = Router();

const AI_SYSTEM_PROMPT = `You are a helpful support assistant for GoldMailer, an investment and staking platform. Be concise and friendly.

ABOUT GOLDMAILER:
- Staking/investment platform for Nigerian users (also US, UK, CA)
- Users stake money for 7 days and earn profits
- Minimum stake: $3, Maximum: $100
- Profit for $3 stake: $8 after 7 days
- Daily rewards: $0.10 per active stake, claimable once per day

REGISTRATION & ACCOUNTS:
- Register with email and password
- Email verification via OTP code sent to email
- Profile setup requires name, country, and phone (required for Nigerian accounts)
- Nigerian users must complete KYC to unlock full features and claim $20 bonus

KYC VERIFICATION (Nigerian accounts only):
- Upload a government ID: NIN, Voters Card, or International Passport
- The name on the ID must match your account name exactly
- $20 bonus is credited once KYC is approved by admin

EARNING METHODS:
1. Staking: Invest $3–$100 for 7 days, earn profit at maturity
2. Daily Rewards: Claim $0.10 daily for each active stake
3. Referrals: Earn bonus for every friend you refer
4. Tasks/Surveys: Complete tasks on partner websites, earn $0.70 per approved task

TRANSACTIONS:
- Deposits: Submit your transaction ID for admin verification
- Withdrawals: Processed within 24–48 hours after admin approval
- All transactions require admin approval

SUPPORT:
- Email: 1xemailsupportbox@gmail.com

Keep answers short (2-3 sentences max). If unsure, direct to email support.`;

async function generateAiReply(conversationHistory: Array<{role: string; content: string}>, userMessage: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const messages = [
      { role: "system", content: AI_SYSTEM_PROMPT },
      ...conversationHistory.slice(-10),
      { role: "user", content: userMessage },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

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

  // Fire-and-forget AI reply
  setImmediate(async () => {
    try {
      // Only reply if no recent admin message in last 30 minutes
      const recentAdmin = await pool.query(
        `SELECT id FROM support_messages
         WHERE user_id = $1 AND sender = 'admin'
         AND created_at > NOW() - INTERVAL '30 minutes'
         ORDER BY created_at DESC LIMIT 1`,
        [userId],
      );
      if (recentAdmin.rows.length > 0) return; // Admin recently replied, skip AI

      // Get conversation history for context
      const history = await pool.query(
        `SELECT message, sender FROM support_messages
         WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
        [userId],
      );
      const conversationHistory = history.rows.reverse().map((r: any) => ({
        role: r.sender === "user" ? "user" : "assistant",
        content: r.message,
      }));

      const aiReply = await generateAiReply(conversationHistory, message.trim());
      if (!aiReply) return;

      await pool.query(
        `INSERT INTO support_messages (user_id, message, sender, is_read)
         VALUES ($1, $2, 'admin', true)`,
        [userId, aiReply],
      );
    } catch { /* silently ignore AI errors */ }
  });
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
