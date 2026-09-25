import { Router } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { pool } from "@workspace/db";
import { requireAdmin, requireAuth } from "../lib/auth-middleware";

const router = Router();
const COMMISSION_RATE = 0.2;
const MIN_PAYOUT = 5;

export const MARKETPLACE_TASK_TYPES = [
  "YouTube Watch & Subscribe",
  "Facebook Follow/Like/Share",
  "Instagram Follow/Like/Comment",
  "TikTok Follow/Like/View",
  "Twitter/X Follow/Like/Retweet",
  "Telegram Channel Join",
  "Discord Server Join",
  "Website Visit & Click",
  "Google Search & Click",
  "App Install & Review",
  "Sign Up on Website",
  "Comment on Blog/Post",
  "Like/Dislike Post",
  "Watch Ad Video",
  "Referral/Invite Friends",
  "Survey/Questionnaire",
  "Review on Google/Trustpilot",
  "Reddit Upvote/Join",
  "LinkedIn Follow/Connect",
  "WhatsApp Group Join",
  "Test Website/App",
  "Other (Custom)",
] as const;

const taskTypeSet = new Set<string>(MARKETPLACE_TASK_TYPES);

function publicTask(row: any) {
  return {
    id: row.id,
    title: row.title,
    taskType: row.task_type,
    description: row.description,
    proofType: row.proof_type,
    workersNeeded: Number(row.workers_needed),
    workersCompleted: Number(row.workers_completed),
    payPerTask: Number(row.pay_per_task),
    totalCost: Number(row.total_cost),
    status: row.status,
    createdAt: row.created_at,
    creatorName: row.creator_name ?? "Verified advertiser",
  };
}

function getNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

router.get("/marketplace/wallets", requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT balance, advertising_wallet, payout_address, is_admin FROM users WHERE id = $1 LIMIT 1`,
    [req.session.userId],
  );
  if (!result.rows[0]) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    earningWallet: Number(result.rows[0].balance),
    advertisingWallet: Number(result.rows[0].advertising_wallet),
    adminWallet: req.session.isAdmin ? Number((await pool.query(`SELECT balance FROM admin_balances WHERE id = 1`)).rows[0]?.balance ?? 0) : null,
    payoutAddress: result.rows[0].payout_address,
  });
});

router.get("/marketplace/tasks", requireAuth, async (req, res) => {
  const search = String(req.query.search ?? "").trim();
  const type = String(req.query.type ?? "").trim();
  const values: unknown[] = [];
  const clauses = [`t.status = 'approved'`, `t.workers_completed < t.workers_needed`];
  if (search) {
    values.push(`%${search}%`);
    clauses.push(`(t.title ILIKE $${values.length} OR t.description ILIKE $${values.length})`);
  }
  if (type && taskTypeSet.has(type)) {
    values.push(type);
    clauses.push(`t.task_type = $${values.length}`);
  }
  const result = await pool.query(
    `SELECT t.*, COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), 'Verified advertiser') AS creator_name
     FROM marketplace_tasks t
     JOIN users u ON u.id = t.creator_id
     WHERE ${clauses.join(" AND ")}
     ORDER BY t.created_at DESC`,
    values,
  );
  res.json(result.rows.map(publicTask));
});

router.get("/marketplace/tasks/:id", requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT t.*, COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), 'Verified advertiser') AS creator_name
     FROM marketplace_tasks t JOIN users u ON u.id = t.creator_id
     WHERE t.id = $1 LIMIT 1`,
    [Number(req.params.id)],
  );
  if (!result.rows[0]) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(publicTask(result.rows[0]));
});

router.post("/marketplace/tasks", requireAuth, async (req, res) => {
  const { title, taskType, description, proofType, workersNeeded } = req.body ?? {};
  const workers = getNumber(workersNeeded);
  const pricing = await pool.query(`SELECT key, value FROM settings WHERE key IN ('task_price', 'task_prices')`);
  const pricingMap = Object.fromEntries(pricing.rows.map((row: any) => [row.key, row.value]));
  let priceByType: Record<string, number> = {};
  try { priceByType = JSON.parse(pricingMap.task_prices ?? "{}"); } catch { priceByType = {}; }
  const pay = getNumber(priceByType[taskType] ?? pricingMap.task_price ?? "0.70");
  if (!title?.trim() || !description?.trim() || !taskTypeSet.has(taskType) || !["screenshot", "link", "text"].includes(proofType)) {
    res.status(400).json({ error: "Title, task type, description, and proof type are required" });
    return;
  }
  if (!Number.isInteger(workers) || workers < 1 || workers > 100000 || !Number.isFinite(pay) || pay < 0.01) {
    res.status(400).json({ error: "Workers value is invalid" });
    return;
  }
  const totalCost = Number((workers * pay).toFixed(2));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const wallet = req.session.isAdmin
      ? await client.query(`SELECT balance AS advertising_wallet FROM admin_balances WHERE id = 1 FOR UPDATE`)
      : await client.query(`SELECT advertising_wallet FROM users WHERE id = $1 FOR UPDATE`, [req.session.userId]);
    if (!wallet.rows[0] || Number(wallet.rows[0].advertising_wallet) < totalCost) {
      await client.query("ROLLBACK");
      res.status(402).json({ error: "Advertising Wallet balance is too low", required: totalCost });
      return;
    }
    if (req.session.isAdmin) {
      await client.query(`UPDATE admin_balances SET balance = balance - $1, updated_at = now() WHERE id = 1`, [totalCost]);
      await client.query(`INSERT INTO admin_wallet_transactions (type, amount, description) VALUES ('task_spend', $1, $2)`, [totalCost, `Funding task: ${title.trim()}`]);
    } else {
      await client.query(`UPDATE users SET advertising_wallet = advertising_wallet - $1 WHERE id = $2`, [totalCost, req.session.userId]);
    }
    const created = await client.query(
      `INSERT INTO marketplace_tasks
       (creator_id, title, task_type, description, proof_type, workers_needed, pay_per_task, total_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.session.userId, title.trim(), taskType, description.trim(), proofType, workers, pay, totalCost],
    );
    await client.query("COMMIT");
    res.status(201).json(publicTask(created.rows[0]));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

router.get("/marketplace/submissions", requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT s.*, t.title, t.task_type
     FROM marketplace_submissions s JOIN marketplace_tasks t ON t.id = s.task_id
     WHERE s.worker_id = $1 ORDER BY s.created_at DESC`,
    [req.session.userId],
  );
  res.json(result.rows.map((row: any) => ({
    id: row.id, taskId: row.task_id, title: row.title, taskType: row.task_type,
    proofText: row.proof_text, proofUrl: row.proof_url, status: row.status,
    amount: Number(row.amount), createdAt: row.created_at, reviewedAt: row.reviewed_at,
  })));
});

router.post("/marketplace/tasks/:id/submit", requireAuth, async (req, res) => {
  const taskId = Number(req.params.id);
  const proofText = String(req.body?.proofText ?? "").trim();
  const proofUrl = req.body?.proofUrl ? String(req.body.proofUrl).trim() : null;
  if (proofText.length < 10) {
    res.status(400).json({ error: "Please provide at least 10 characters of proof" });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const task = await client.query(
      `SELECT * FROM marketplace_tasks WHERE id = $1 AND status = 'approved' AND workers_completed < workers_needed FOR UPDATE`,
      [taskId],
    );
    if (!task.rows[0]) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Task is no longer available" });
      return;
    }
    if (task.rows[0].creator_id === req.session.userId) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: "You cannot submit your own task" });
      return;
    }
    const existing = await client.query(
      `SELECT id FROM marketplace_submissions WHERE task_id = $1 AND worker_id = $2 LIMIT 1`,
      [taskId, req.session.userId],
    );
    if (existing.rows[0]) {
      await client.query("ROLLBACK");
      res.status(409).json({ error: "You already submitted this task" });
      return;
    }
    const created = await client.query(
      `INSERT INTO marketplace_submissions (task_id, worker_id, proof_text, proof_url, amount)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [taskId, req.session.userId, proofText, proofUrl, task.rows[0].pay_per_task],
    );
    await client.query("COMMIT");
    res.status(201).json({ id: created.rows[0].id, status: "pending" });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

router.post("/payments/nowpayments/deposit", requireAuth, async (req, res) => {
  const amount = getNumber(req.body?.amount);
  const currency = String(req.body?.currency ?? "usd").toLowerCase();
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "NowPayments is not configured yet" });
    return;
  }
  if (!Number.isFinite(amount) || amount < 5) {
    res.status(400).json({ error: "Deposit must be at least $5" });
    return;
  }
  const invoiceResponse = await fetch("https://api.nowpayments.io/v1/invoice", {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      price_amount: Number(amount.toFixed(2)),
      price_currency: "usd",
      order_id: `advertising-${req.session.userId}-${Date.now()}`,
      order_description: "GoldMailerTasks Advertising Wallet deposit",
      ipn_callback_url: `${req.protocol}://${req.get("host")}/api/webhooks/nowpayments`,
      success_url: `${req.protocol}://${req.get("host")}/deposit?status=success`,
      cancel_url: `${req.protocol}://${req.get("host")}/deposit?status=cancelled`,
      ...(currency !== "usd" ? { pay_currency: currency } : {}),
    }),
  });
  const invoice = await invoiceResponse.json() as any;
  if (!invoiceResponse.ok || !invoice.id) {
    res.status(502).json({ error: invoice.message || "Could not create payment invoice" });
    return;
  }
  await pool.query(
    `INSERT INTO marketplace_deposits (user_id, invoice_id, amount, currency) VALUES ($1, $2, $3, $4)`,
    [req.session.userId, String(invoice.id), amount, currency],
  );
  res.json({ invoiceId: invoice.id, invoiceUrl: invoice.invoice_url, amount, currency });
});

function sortObject(value: any): any {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((obj, key) => {
      obj[key] = sortObject(value[key]);
      return obj;
    }, {} as Record<string, any>);
  }
  return value;
}

function isValidIpnSignature(body: any, signature: string | undefined) {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha512", secret).update(JSON.stringify(sortObject(body))).digest("hex");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

router.post("/webhooks/nowpayments", async (req, res) => {
  if (!isValidIpnSignature(req.body, req.header("x-nowpayments-sig"))) {
    res.status(401).json({ error: "Invalid webhook signature" });
    return;
  }
  const paymentStatus = String(req.body?.payment_status ?? "");
  if (!["finished", "confirmed"].includes(paymentStatus)) {
    res.json({ received: true });
    return;
  }
  const invoiceId = String(req.body?.invoice_id ?? req.body?.order_id ?? "");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const deposit = await client.query(
      `SELECT * FROM marketplace_deposits WHERE invoice_id = $1 FOR UPDATE`,
      [invoiceId],
    );
    if (!deposit.rows[0] || deposit.rows[0].status === "confirmed") {
      await client.query("COMMIT");
      res.json({ received: true });
      return;
    }
    const total = Number(deposit.rows[0].amount);
    const adminCut = Number((total * COMMISSION_RATE).toFixed(2));
    const userGets = Number((total - adminCut).toFixed(2));
    await client.query(
      `UPDATE marketplace_deposits SET status = 'confirmed', payment_id = $1, confirmed_at = now() WHERE id = $2`,
      [req.body?.payment_id ? String(req.body.payment_id) : null, deposit.rows[0].id],
    );
    await client.query(`UPDATE users SET advertising_wallet = advertising_wallet + $1 WHERE id = $2`, [userGets, deposit.rows[0].user_id]);
    await client.query(
      `INSERT INTO admin_earnings (user_id, type, total_amount, admin_cut, user_gets) VALUES ($1, 'deposit', $2, $3, $4)`,
      [deposit.rows[0].user_id, total, adminCut, userGets],
    );
    await client.query(`UPDATE admin_balances SET balance = balance + $1, updated_at = now() WHERE id = 1`, [adminCut]);
    await client.query("COMMIT");
    res.json({ received: true });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

router.post("/marketplace/payouts", requireAuth, async (req, res) => {
  const amount = getNumber(req.body?.amount);
  const payCurrency = String(req.body?.payCurrency ?? "usdttrc20").toLowerCase();
  const payoutAddress = String(req.body?.payoutAddress ?? "").trim();
  if (!Number.isFinite(amount) || amount < MIN_PAYOUT || !payoutAddress) {
    res.status(400).json({ error: `Payouts require at least $${MIN_PAYOUT} and a crypto address` });
    return;
  }
  const total = Number(amount.toFixed(2));
  const userGets = Number((total * (1 - COMMISSION_RATE)).toFixed(2));
  const adminCut = Number((total - userGets).toFixed(2));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const user = await client.query(`SELECT balance FROM users WHERE id = $1 FOR UPDATE`, [req.session.userId]);
    if (!user.rows[0] || Number(user.rows[0].balance) < total) {
      await client.query("ROLLBACK");
      res.status(402).json({ error: "Insufficient Earning Wallet balance" });
      return;
    }
    await client.query(`UPDATE users SET balance = balance - $1, payout_address = $2 WHERE id = $3`, [total, payoutAddress, req.session.userId]);
    const payout = await client.query(
      `INSERT INTO marketplace_payouts (user_id, amount, user_amount, admin_cut, pay_currency, payout_address)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [req.session.userId, total, userGets, adminCut, payCurrency, payoutAddress],
    );
    await client.query(
      `INSERT INTO admin_earnings (user_id, type, total_amount, admin_cut, user_gets) VALUES ($1, 'payout', $2, $3, $4)`,
      [req.session.userId, total, adminCut, userGets],
    );
    await client.query(`UPDATE admin_balances SET balance = balance + $1, updated_at = now() WHERE id = 1`, [adminCut]);
    await client.query("COMMIT");
    res.status(201).json({ payoutId: payout.rows[0].id, total, userGets, adminCut, status: "pending" });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

router.get("/marketplace/preferences", requireAuth, async (req, res) => {
  const result = await pool.query(`SELECT daily_update, new_task_alert FROM email_preferences WHERE user_id = $1`, [req.session.userId]);
  res.json(result.rows[0] ?? { daily_update: true, new_task_alert: true });
});

router.put("/marketplace/preferences", requireAuth, async (req, res) => {
  const daily = req.body?.dailyUpdate !== false;
  const alerts = req.body?.newTaskAlert !== false;
  await pool.query(
    `INSERT INTO email_preferences (user_id, daily_update, new_task_alert) VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET daily_update = EXCLUDED.daily_update, new_task_alert = EXCLUDED.new_task_alert, updated_at = now()`,
    [req.session.userId, daily, alerts],
  );
  res.json({ dailyUpdate: daily, newTaskAlert: alerts });
});

router.get("/admin/marketplace/tasks", requireAdmin, async (_req, res) => {
  const result = await pool.query(
    `SELECT t.*, u.email AS creator_email FROM marketplace_tasks t JOIN users u ON u.id = t.creator_id ORDER BY t.created_at DESC`,
  );
  res.json(result.rows.map((row: any) => ({ ...publicTask(row), creatorEmail: row.creator_email })));
});

router.post("/admin/marketplace/tasks/:id/:decision", requireAdmin, async (req, res) => {
  const decision = req.params.decision === "approve" ? "approved" : req.params.decision === "reject" ? "rejected" : null;
  if (!decision) {
    res.status(400).json({ error: "Invalid decision" });
    return;
  }
  const result = await pool.query(`UPDATE marketplace_tasks SET status = $1 WHERE id = $2 RETURNING *`, [decision, Number(req.params.id)]);
  if (!result.rows[0]) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(publicTask(result.rows[0]));
});

router.get("/admin/marketplace/submissions", requireAdmin, async (_req, res) => {
  const result = await pool.query(
    `SELECT s.*, t.title, t.task_type, u.email AS worker_email
     FROM marketplace_submissions s JOIN marketplace_tasks t ON t.id = s.task_id
     JOIN users u ON u.id = s.worker_id ORDER BY s.created_at DESC`,
  );
  res.json(result.rows.map((row: any) => ({
    id: row.id, taskId: row.task_id, title: row.title, taskType: row.task_type,
    workerEmail: row.worker_email, proofText: row.proof_text, proofUrl: row.proof_url,
    status: row.status, amount: Number(row.amount), createdAt: row.created_at,
  })));
});

router.post("/admin/marketplace/submissions/:id/:decision", requireAdmin, async (req, res) => {
  const decision = req.params.decision === "approve" ? "approved" : req.params.decision === "reject" ? "rejected" : null;
  if (!decision) {
    res.status(400).json({ error: "Invalid decision" });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const submission = await client.query(
      `SELECT s.*, t.workers_completed, t.workers_needed FROM marketplace_submissions s
       JOIN marketplace_tasks t ON t.id = s.task_id WHERE s.id = $1 FOR UPDATE`,
      [Number(req.params.id)],
    );
    if (!submission.rows[0] || submission.rows[0].status !== "pending") {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Pending submission not found" });
      return;
    }
    const row = submission.rows[0];
    await client.query(`UPDATE marketplace_submissions SET status = $1, reviewed_at = now() WHERE id = $2`, [decision, row.id]);
    if (decision === "approved") {
      await client.query(`UPDATE users SET balance = balance + $1 WHERE id = $2`, [row.amount, row.worker_id]);
      await client.query(
        `UPDATE marketplace_tasks SET workers_completed = workers_completed + 1,
         status = CASE WHEN workers_completed + 1 >= workers_needed THEN 'completed' ELSE status END
         WHERE id = $1`,
        [row.task_id],
      );
    }
    await client.query("COMMIT");
    res.json({ id: row.id, status: decision });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

router.get("/admin/marketplace/summary", requireAdmin, async (_req, res) => {
  const [stats, balance] = await Promise.all([
    pool.query(`SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM marketplace_tasks WHERE status = 'pending') AS pending_tasks,
      (SELECT COUNT(*) FROM marketplace_submissions WHERE status = 'pending') AS pending_submissions,
      (SELECT COALESCE(SUM(total_amount), 0) FROM admin_earnings) AS total_volume,
      (SELECT COALESCE(SUM(admin_cut), 0) FROM admin_earnings) AS total_commission`),
    pool.query(`SELECT balance FROM admin_balances WHERE id = 1`),
  ]);
  res.json({ ...stats.rows[0], adminBalance: Number(balance.rows[0]?.balance ?? 0) });
});

router.get("/admin/marketplace/payouts", requireAdmin, async (_req, res) => {
  const result = await pool.query(
    `SELECT p.*, u.email FROM marketplace_payouts p JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC`,
  );
  res.json(result.rows.map((row: any) => ({ ...row, amount: Number(row.amount), userAmount: Number(row.user_amount), adminCut: Number(row.admin_cut) })));
});

router.post("/admin/marketplace/payouts/:id/approve", requireAdmin, async (req, res) => {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "NowPayments is not configured yet" });
    return;
  }
  const payout = await pool.query(`SELECT * FROM marketplace_payouts WHERE id = $1 AND status = 'pending' LIMIT 1`, [Number(req.params.id)]);
  if (!payout.rows[0]) {
    res.status(404).json({ error: "Pending payout not found" });
    return;
  }
  const row = payout.rows[0];
  const apiResponse = await fetch("https://api.nowpayments.io/v1/payout", {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      ipn_callback_url: `${req.protocol}://${req.get("host")}/api/webhooks/nowpayments`,
      withdrawals: [{ address: row.payout_address, currency: row.pay_currency, amount: Number(row.user_amount) }],
    }),
  });
  const result = await apiResponse.json() as any;
  if (!apiResponse.ok) {
    res.status(502).json({ error: result.message || "NowPayments payout failed" });
    return;
  }
  await pool.query(`UPDATE marketplace_payouts SET status = 'processing', payout_id = $1, processed_at = now() WHERE id = $2`, [result.id ?? result.batch_withdrawal_id ?? null, row.id]);
  res.json({ success: true, payoutId: result.id ?? result.batch_withdrawal_id ?? null });
});

// POST /admin/marketplace/payouts/:id/reject — admin rejects a pending payout.
// The withheld user balance is refunded so the worker can request again later.
router.post("/admin/marketplace/payouts/:id/reject", requireAdmin, async (req, res) => {
  const payout = await pool.query(
    `SELECT * FROM marketplace_payouts WHERE id = $1 AND status = 'pending' LIMIT 1`,
    [Number(req.params.id)],
  );
  if (!payout.rows[0]) {
    res.status(404).json({ error: "Pending payout not found" });
    return;
  }
  const row = payout.rows[0];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE marketplace_payouts SET status = 'rejected', processed_at = now() WHERE id = $1`,
      [row.id],
    );
    // Refund the total (user amount + admin cut) back to the user's balance.
    await client.query(
      `UPDATE users SET balance = balance + $1 WHERE id = $2`,
      [Number(row.amount), row.user_id],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  res.json({ success: true });
});

export default router;