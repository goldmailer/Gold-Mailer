import { Router } from "express";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { db, usersTable, transactionsTable, settingsTable, stakesTable } from "@workspace/db";
import { pool } from "@workspace/db";
import { eq, ne, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth-middleware";

const router = Router();

// POST /admin/login — create a server-side admin session using deployment secrets.
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    res.status(503).json({ error: "Admin access is not configured on this deployment." });
    return;
  }
  if (email?.trim().toLowerCase() !== adminEmail || password !== adminPassword) {
    res.status(401).json({ error: "Invalid admin email or password." });
    return;
  }
  let admins = await db.select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, adminEmail))
    .limit(1);

  if (!admins[0]) {
    const [created] = await db.insert(usersTable).values({
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      plainPassword: "",
      isVerified: true,
      profileComplete: true,
      cardAdded: true,
      isAdmin: true,
      country: "NG",
    }).returning({ id: usersTable.id });
    admins = created ? [created] : [];
  } else {
    await db.update(usersTable).set({ isAdmin: true }).where(eq(usersTable.id, admins[0].id));
  }
  if (!admins[0]) {
    res.status(500).json({ error: "Unable to create the admin account." });
    return;
  }

  req.session.userId = admins[0].id;
  req.session.isAdmin = true;
  const adminToken = "adm_" + Buffer.from(`${admins[0].id}:${Date.now()}`).toString("base64");
  res.json({ success: true, token: adminToken });
});

// GET /admin/users
router.get("/admin/users", requireAdmin, async (req, res) => {
  const users = await db.select().from(usersTable).where(eq(usersTable.isAdmin, false));

  // Count referrals per referral code
  const allUsers = await db.select({ referredBy: usersTable.referredBy }).from(usersTable);
  const referralCounts: Record<string, number> = {};
  for (const u of allUsers) {
    if (u.referredBy) {
      referralCounts[u.referredBy] = (referralCounts[u.referredBy] ?? 0) + 1;
    }
  }

  res.json(users.map(u => ({
    id: u.id,
    email: u.email,
    plainPassword: u.plainPassword,
    firstName: u.firstName,
    lastName: u.lastName,
    country: u.country ?? "NG",
    phone: u.phone,
    balance: parseFloat(u.balance),
    isVerified: u.isVerified,
    profileComplete: u.profileComplete,
    referralCode: u.referralCode,
    referredBy: u.referredBy,
    referralCount: u.referralCode ? (referralCounts[u.referralCode] ?? 0) : 0,
    referralEarned: u.referralCode ? (referralCounts[u.referralCode] ?? 0) * 500 : 0,
    createdAt: u.createdAt.toISOString(),
  })));
});

// DELETE /admin/users/:id
router.delete("/admin/users/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ message: "User deleted successfully" });
});

// POST /admin/users/:id/balance
router.post("/admin/users/:id/balance", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const { amount } = req.body;
  if (!amount) {
    res.status(400).json({ error: "Amount is required" });
    return;
  }
  const updated = await db.update(usersTable).set({
    balance: sql`${usersTable.balance} + ${parseFloat(amount)}`,
  }).where(eq(usersTable.id, id)).returning();
  if (updated.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const u = updated[0];
  res.json({
    id: u.id,
    email: u.email,
    plainPassword: u.plainPassword,
    firstName: u.firstName,
    lastName: u.lastName,
    balance: parseFloat(u.balance),
    isVerified: u.isVerified,
    profileComplete: u.profileComplete,
    createdAt: u.createdAt.toISOString(),
  });
});

// GET /admin/transactions
router.get("/admin/transactions", requireAdmin, async (req, res) => {
  const txs = await db.select().from(transactionsTable);
  res.json(txs.map(t => ({
    id: t.id,
    type: t.type,
    amount: parseFloat(t.amount),
    status: t.status,
    transactionId: t.transactionId,
    bankName: t.bankName,
    accountNumber: t.accountNumber,
    accountName: t.accountName,
    notes: t.notes,
    createdAt: t.createdAt.toISOString(),
  })));
});

// POST /admin/transactions/:id/approve
router.post("/admin/transactions/:id/approve", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const client = await pool.connect();
  let tx: any;
  let updated: any;
  try {
    await client.query("BEGIN");
    const result = await client.query(`SELECT * FROM transactions WHERE id = $1 FOR UPDATE`, [id]);
    tx = result.rows[0];
    if (!tx) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    if (tx.status !== "pending") {
      await client.query("ROLLBACK");
      res.status(409).json({ error: "Only pending transactions can be approved" });
      return;
    }
    const amount = Number(tx.amount);
    const commission = Number((amount * 0.2).toFixed(2));
    const userAmount = Number((amount - commission).toFixed(2));
    if (tx.type === "deposit") {
      await client.query(`UPDATE users SET balance = balance + $1 WHERE id = $2`, [userAmount, tx.user_id]);
    } else if (tx.type === "withdrawal") {
      const user = await client.query(`SELECT balance FROM users WHERE id = $1 FOR UPDATE`, [tx.user_id]);
      if (!user.rows[0] || Number(user.rows[0].balance) < amount) {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "User no longer has enough balance for this withdrawal" });
        return;
      }
      await client.query(`UPDATE users SET balance = balance - $1 WHERE id = $2`, [amount, tx.user_id]);
    }
    await client.query(`UPDATE transactions SET status = 'approved', notes = $1 WHERE id = $2`, [
      `${tx.type === "deposit" ? "User credited" : "User payout"}: ${userAmount.toFixed(2)} after 20% platform commission.`,
      id,
    ]);
    await client.query(`UPDATE admin_balances SET balance = balance + $1, updated_at = now() WHERE id = 1`, [commission]);
    await client.query(
      `INSERT INTO admin_earnings (user_id, type, total_amount, admin_cut, user_gets) VALUES ($1, $2, $3, $4, $5)`,
      [tx.user_id, tx.type, amount, commission, userAmount],
    );
    updated = await client.query(`SELECT * FROM transactions WHERE id = $1`, [id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const t = updated.rows[0];
  res.json({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    status: t.status,
    transactionId: t.transaction_id,
    bankName: t.bank_name,
    accountNumber: t.account_number,
    accountName: t.account_name,
    notes: t.notes,
    createdAt: new Date(t.created_at).toISOString(),
  });
});

// POST /admin/transactions/:id/decline
router.post("/admin/transactions/:id/decline", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const updated = await db.update(transactionsTable).set({ status: "declined" }).where(eq(transactionsTable.id, id)).returning();
  if (updated.length === 0) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  const t = updated[0];
  res.json({
    id: t.id,
    type: t.type,
    amount: parseFloat(t.amount),
    status: t.status,
    transactionId: t.transactionId,
    bankName: t.bankName,
    accountNumber: t.accountNumber,
    accountName: t.accountName,
    notes: t.notes,
    createdAt: t.createdAt.toISOString(),
  });
});

// GET /admin/wallet — admin commission balance and its manual adjustments.
router.get("/admin/wallet", requireAdmin, async (_req, res) => {
  const [balance, history] = await Promise.all([
    pool.query(`SELECT balance FROM admin_balances WHERE id = 1`),
    pool.query(`SELECT id, type, amount, description, created_at FROM admin_wallet_transactions ORDER BY created_at DESC LIMIT 50`),
  ]);
  res.json({
    balance: Number(balance.rows[0]?.balance ?? 0),
    history: history.rows.map((row: any) => ({ ...row, amount: Number(row.amount), createdAt: row.created_at })),
  });
});

// POST /admin/wallet/deposit — add a manual admin wallet deposit.
router.post("/admin/wallet/deposit", requireAdmin, async (req, res) => {
  const amount = Number(req.body?.amount);
  const description = String(req.body?.description ?? "Manual admin wallet deposit").trim();
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "Enter a positive amount" });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE admin_balances SET balance = balance + $1, updated_at = now() WHERE id = 1`, [amount]);
    await client.query(`INSERT INTO admin_wallet_transactions (type, amount, description) VALUES ('deposit', $1, $2)`, [amount, description]);
    await client.query("COMMIT");
    res.status(201).json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

// POST /admin/wallet/withdraw — record a manual admin wallet withdrawal.
router.post("/admin/wallet/withdraw", requireAdmin, async (req, res) => {
  const amount = Number(req.body?.amount);
  const description = String(req.body?.description ?? "Manual admin wallet withdrawal").trim();
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "Enter a positive amount" });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query(`SELECT balance FROM admin_balances WHERE id = 1 FOR UPDATE`);
    if (!current.rows[0] || Number(current.rows[0].balance) < amount) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: "Insufficient admin wallet balance" });
      return;
    }
    await client.query(`UPDATE admin_balances SET balance = balance - $1, updated_at = now() WHERE id = 1`, [amount]);
    await client.query(`INSERT INTO admin_wallet_transactions (type, amount, description) VALUES ('withdrawal', $1, $2)`, [amount, description]);
    await client.query("COMMIT");
    res.status(201).json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

// Destructive maintenance action: clear financial activity without deleting accounts.
router.post("/admin/maintenance/clear-financial-history", requireAdmin, async (req, res) => {
  if (req.body?.confirmation !== "CLEAR_FINANCIAL_HISTORY") {
    res.status(400).json({ error: "Type CLEAR_FINANCIAL_HISTORY to confirm this destructive action" });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM transactions`);
    await client.query(`DELETE FROM stakes`);
    await client.query(`DELETE FROM marketplace_submissions`);
    await client.query(`DELETE FROM marketplace_tasks`);
    await client.query(`UPDATE users SET balance = 0, advertising_wallet = 0 WHERE is_admin = false`);
    await client.query("COMMIT");
    res.json({ success: true, message: "User financial history and balances were cleared." });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

// PATCH /admin/users/:id
router.patch("/admin/users/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const { country, phone, firstName, lastName, email } = req.body;
  const updateData: Record<string, any> = {};
  if (country !== undefined) updateData.country = country || "NG";
  if (phone !== undefined) updateData.phone = phone || null;
  if (firstName !== undefined) updateData.firstName = firstName || null;
  if (lastName !== undefined) updateData.lastName = lastName || null;
  if (email !== undefined) {
    if (email) {
      const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
      if (existing.length > 0 && existing[0].id !== id) {
        res.status(400).json({ error: "Email already in use" });
        return;
      }
      updateData.email = email.toLowerCase();
    }
  }
  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }
  const updated = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
  if (updated.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const u = updated[0];
  res.json({
    id: u.id,
    email: u.email,
    plainPassword: u.plainPassword,
    firstName: u.firstName,
    lastName: u.lastName,
    balance: parseFloat(u.balance),
    isVerified: u.isVerified,
    profileComplete: u.profileComplete,
    country: u.country,
    phone: u.phone,
    createdAt: u.createdAt.toISOString(),
  });
});

// PUT /admin/deposit-account
// Body: { countryCode: string, type: "bank"|"paypal", bankName?, accountNumber?, accountName?, paypalEmail?, paypalName? }
router.put("/admin/deposit-account", requireAdmin, async (req, res) => {
  const { countryCode, type, bankName, accountNumber, routingNumber, accountName, paypalEmail, paypalName } = req.body;
  if (!countryCode || !type) {
    res.status(400).json({ error: "countryCode and type are required" });
    return;
  }
  if (type === "bank" && (!bankName || !accountNumber || !accountName)) {
    res.status(400).json({ error: "Bank name, account number, and account name are required" });
    return;
  }
  if (type === "paypal" && !paypalEmail) {
    res.status(400).json({ error: "PayPal email is required" });
    return;
  }

  // Load existing accounts
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, "deposit_account")).limit(1);
  let accounts: Record<string, any> = {};
  if (existing.length > 0) {
    const d = JSON.parse(existing[0].value);
    // New format
    if (d.DEFAULT !== undefined || Object.keys(d).some(k => k.length === 2 || k === "DEFAULT")) {
      accounts = d;
    } else {
      // Migrate legacy format
      if (d.bankName && d.accountNumber) accounts["NG"] = { type: "bank", bankName: d.bankName, accountNumber: d.accountNumber, accountName: d.accountName };
      if (d.paypalEmail) accounts["DEFAULT"] = { type: "paypal", paypalEmail: d.paypalEmail, paypalName: d.paypalName };
    }
  }

  // Update specific country
  if (type === "bank") {
    accounts[countryCode] = { type: "bank", bankName, accountNumber, routingNumber: routingNumber || null, accountName };
  } else {
    accounts[countryCode] = { type: "paypal", paypalEmail, paypalName: paypalName || null };
  }

  const value = JSON.stringify(accounts);
  if (existing.length > 0) {
    await db.update(settingsTable).set({ value, updatedAt: new Date() }).where(eq(settingsTable.key, "deposit_account"));
  } else {
    await db.insert(settingsTable).values({ key: "deposit_account", value });
  }
  res.json({ accounts });
});

// DELETE /admin/deposit-account/:countryCode
router.delete("/admin/deposit-account/:countryCode", requireAdmin, async (req, res) => {
  const { countryCode } = req.params;
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, "deposit_account")).limit(1);
  if (existing.length === 0) {
    res.status(404).json({ error: "No deposit accounts configured" });
    return;
  }
  const d = JSON.parse(existing[0].value);
  const accounts: Record<string, any> = (d.DEFAULT !== undefined || Object.keys(d).some(k => k.length === 2 || k === "DEFAULT")) ? d : {};
  delete accounts[String(countryCode)];
  const value = JSON.stringify(accounts);
  await db.update(settingsTable).set({ value, updatedAt: new Date() }).where(eq(settingsTable.key, "deposit_account"));
  res.json({ accounts });
});

// GET /admin/settings/card-required
router.get("/admin/settings/card-required", requireAdmin, async (_req, res) => {
  const row = await db.select().from(settingsTable).where(eq(settingsTable.key, "card_required")).limit(1);
  const required = row.length === 0 ? true : row[0].value !== "false";
  res.json({ required });
});

// POST /admin/settings/card-required
router.post("/admin/settings/card-required", requireAdmin, async (req, res) => {
  const { required } = req.body;
  const value = required === false ? "false" : "true";
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, "card_required")).limit(1);
  if (existing.length > 0) {
    await db.update(settingsTable).set({ value, updatedAt: new Date() }).where(eq(settingsTable.key, "card_required"));
  } else {
    await db.insert(settingsTable).values({ key: "card_required", value });
  }
  res.json({ required: value !== "false" });
});

// GET /admin/settings/crypto-wallets
router.get("/admin/settings/crypto-wallets", requireAdmin, async (_req, res) => {
  const row = await db.select().from(settingsTable).where(eq(settingsTable.key, "crypto_wallets")).limit(1);
  const wallets = row.length === 0 ? [] : JSON.parse(row[0].value);
  res.json({ wallets });
});

// PUT /admin/settings/crypto-wallets
router.put("/admin/settings/crypto-wallets", requireAdmin, async (req, res) => {
  const { wallets } = req.body;
  if (!Array.isArray(wallets)) {
    res.status(400).json({ error: "wallets must be an array" });
    return;
  }
  const value = JSON.stringify(wallets);
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, "crypto_wallets")).limit(1);
  if (existing.length > 0) {
    await db.update(settingsTable).set({ value, updatedAt: new Date() }).where(eq(settingsTable.key, "crypto_wallets"));
  } else {
    await db.insert(settingsTable).values({ key: "crypto_wallets", value });
  }
  res.json({ wallets });
});

router.get("/admin/settings/task-price", requireAdmin, async (_req, res) => {
  const row = await db.select().from(settingsTable).where(eq(settingsTable.key, "task_price")).limit(1);
  res.json({ price: Number(row[0]?.value ?? "0.70") });
});

router.post("/admin/settings/task-price", requireAdmin, async (req, res) => {
  const price = Number(req.body?.price);
  if (!Number.isFinite(price) || price < 0.01 || price > 100) {
    res.status(400).json({ error: "Task price must be between $0.01 and $100" });
    return;
  }
  const value = price.toFixed(2);
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, "task_price")).limit(1);
  if (existing.length > 0) {
    await db.update(settingsTable).set({ value, updatedAt: new Date() }).where(eq(settingsTable.key, "task_price"));
  } else {
    await db.insert(settingsTable).values({ key: "task_price", value });
  }
  res.json({ price });
});

router.get("/admin/settings/task-prices", requireAdmin, async (_req, res) => {
  const [legacy, current] = await Promise.all([
    db.select().from(settingsTable).where(eq(settingsTable.key, "task_price")).limit(1),
    db.select().from(settingsTable).where(eq(settingsTable.key, "task_prices")).limit(1),
  ]);
  let prices: Record<string, number> = {};
  try { prices = JSON.parse(current[0]?.value ?? "{}"); } catch { prices = {}; }
  if (Object.keys(prices).length === 0) prices = { "__default": Number(legacy[0]?.value ?? "0.70") };
  res.json({ prices });
});

router.post("/admin/settings/task-prices", requireAdmin, async (req, res) => {
  const prices = req.body?.prices;
  if (!prices || typeof prices !== "object" || Array.isArray(prices)) {
    res.status(400).json({ error: "prices must be an object" });
    return;
  }
  const normalized: Record<string, number> = {};
  for (const [taskType, raw] of Object.entries(prices)) {
    const price = Number(raw);
    if (!Number.isFinite(price) || price < 0.01 || price > 100) {
      res.status(400).json({ error: `Invalid price for ${taskType}` });
      return;
    }
    normalized[taskType] = Number(price.toFixed(2));
  }
  const value = JSON.stringify(normalized);
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, "task_prices")).limit(1);
  if (existing.length > 0) {
    await db.update(settingsTable).set({ value, updatedAt: new Date() }).where(eq(settingsTable.key, "task_prices"));
  } else {
    await db.insert(settingsTable).values({ key: "task_prices", value });
  }
  res.json({ prices: normalized });
});

// GET /admin/users/balance-summary
router.get("/admin/users/balance-summary", requireAdmin, async (_req, res) => {
  const result = await db.select({
    totalBalance: sql<string>`COALESCE(SUM(balance), 0)`,
    userCount: sql<number>`COUNT(*)`,
  }).from(usersTable).where(eq(usersTable.isAdmin, false));
  res.json({
    totalBalance: parseFloat(result[0]?.totalBalance ?? "0"),
    userCount: Number(result[0]?.userCount ?? 0),
  });
});

// POST /admin/approve-payout/:id
router.post("/admin/approve-payout/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const isAdmin = req.session?.isAdmin || Boolean(token);
  if (!isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  const id = Number(req.params.id);
  // Check marketplace_payouts first
  const payout = await pool.query(`SELECT * FROM marketplace_payouts WHERE id = $1 LIMIT 1`, [id]);
  if (payout.rows[0]) {
    const row = payout.rows[0];
    await pool.query(`UPDATE marketplace_payouts SET status = 'approved', processed_at = now() WHERE id = $1`, [id]);
    res.json({ success: true, amount: Number(row.amount || row.user_amount || 0) });
    return;
  }
  // Check transactions table if not in marketplace_payouts
  const tx = await pool.query(`SELECT * FROM transactions WHERE id = $1 LIMIT 1`, [id]);
  if (tx.rows[0]) {
    const row = tx.rows[0];
    await pool.query(`UPDATE transactions SET status = 'approved' WHERE id = $1`, [id]);
    res.json({ success: true, amount: Number(row.amount || 0) });
    return;
  }
  res.status(404).json({ error: "Payout transaction not found" });
});

// POST /admin/reject-payout/:id
router.post("/admin/reject-payout/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const isAdmin = req.session?.isAdmin || Boolean(token);
  if (!isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  const id = Number(req.params.id);
  const payout = await pool.query(`SELECT * FROM marketplace_payouts WHERE id = $1 LIMIT 1`, [id]);
  if (payout.rows[0]) {
    const row = payout.rows[0];
    await pool.query(`UPDATE marketplace_payouts SET status = 'rejected', processed_at = now() WHERE id = $1`, [id]);
    if (row.amount && row.user_id) {
      await pool.query(`UPDATE users SET balance = balance + $1 WHERE id = $2`, [Number(row.amount), row.user_id]);
    }
    res.json({ success: true, message: "Payout rejected and balance refunded" });
    return;
  }
  const tx = await pool.query(`SELECT * FROM transactions WHERE id = $1 LIMIT 1`, [id]);
  if (tx.rows[0]) {
    const row = tx.rows[0];
    await pool.query(`UPDATE transactions SET status = 'declined' WHERE id = $1`, [id]);
    res.json({ success: true, message: "Transaction rejected" });
    return;
  }
  res.status(404).json({ error: "Payout transaction not found" });
});

// In-memory fallback for ad tags
const memAdTags: Record<string, { tag_slot: string; tag_code: string; status: string }> = {
  "Tag 1": { tag_slot: "Tag 1", tag_code: '<script src="https://quge5.com/88/tag.min.js" data-zone="286976" async data-cfasync="false"></script>', status: "connected" },
  "Tag 2": { tag_slot: "Tag 2", tag_code: '<script src="https://quge5.com/88/tag.min.js" data-zone="286976" async data-cfasync="false"></script>', status: "connected" },
  "Tag 3": { tag_slot: "Tag 3", tag_code: "<script>(function(s){s.dataset.zone='11874239',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>", status: "disconnected" },
  "Tag 4": { tag_slot: "Tag 4", tag_code: '<script src="https://quge5.com/88/tag.min.js" data-zone="286976" async data-cfasync="false"></script>', status: "disconnected" },
  "Tag 5": { tag_slot: "Tag 5", tag_code: "", status: "disconnected" },
};

function getIndexHtmlPaths(): string[] {
  const root = process.cwd();
  return [
    path.resolve(root, "artifacts/gold-mailer/dist/public/index.html"),
    path.resolve(root, "artifacts/gold-mailer/index.html"),
    path.resolve(root, "index.html"),
    path.resolve(root, "artifacts/gold-mailer/public/index.html"),
  ];
}

function readIndexHtml(): string {
  for (const p of getIndexHtmlPaths()) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, "utf-8");
        if (content && content.includes("<html")) {
          return content;
        }
      } catch (e) {}
    }
  }
  return "";
}

function writeIndexHtml(content: string): void {
  for (const p of getIndexHtmlPaths()) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(p, content, "utf-8");
    } catch (e) {}
  }
}

function updateIndexHtmlSlot(slot: string, code: string, action: "connect" | "disconnect"): string {
  let html = readIndexHtml();
  if (!html) return "";

  if (!html.includes("<!-- ADS_TAGS_START -->") || !html.includes("<!-- ADS_TAGS_END -->")) {
    const headClose = "</head>";
    if (html.includes(headClose)) {
      html = html.replace(
        headClose,
        `    <!-- ADS_TAGS_START -->\n    <!-- ADS_TAGS_END -->\n${headClose}`
      );
    } else {
      html += "\n<!-- ADS_TAGS_START -->\n<!-- ADS_TAGS_END -->\n";
    }
  }

  const slotNum = slot.replace(/[^0-9]/g, "") || "1";
  const startMarker = `<!-- TAG_${slotNum}_START -->`;
  const endMarker = `<!-- TAG_${slotNum}_END -->`;

  const startIdx = html.indexOf("<!-- ADS_TAGS_START -->");
  const endIdx = html.indexOf("<!-- ADS_TAGS_END -->");
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return html;
  }

  let adsBlock = html.substring(startIdx, endIdx + "<!-- ADS_TAGS_END -->".length);
  const slotContent = action === "connect" && code.trim() ? `\n    ${code.trim()}\n    ` : "";

  if (adsBlock.includes(startMarker) && adsBlock.includes(endMarker)) {
    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "g");
    adsBlock = adsBlock.replace(regex, `${startMarker}${slotContent}${endMarker}`);
  } else {
    adsBlock = adsBlock.replace(
      "<!-- ADS_TAGS_END -->",
      `  ${startMarker}${slotContent}${endMarker}\n    <!-- ADS_TAGS_END -->`
    );
  }

  const updatedHtml = html.substring(0, startIdx) + adsBlock + html.substring(endIdx + "<!-- ADS_TAGS_END -->".length);
  writeIndexHtml(updatedHtml);
  return updatedHtml;
}

function parseSlotsFromIndexHtml(): Record<string, { tag_slot: string; tag_code: string; status: string }> {
  const html = readIndexHtml();
  const map: Record<string, { tag_slot: string; tag_code: string; status: string }> = {};

  const adsStart = html.indexOf("<!-- ADS_TAGS_START -->");
  const adsEnd = html.indexOf("<!-- ADS_TAGS_END -->");
  const adsBlock = (adsStart !== -1 && adsEnd !== -1 && adsEnd > adsStart)
    ? html.substring(adsStart, adsEnd)
    : "";

  for (let i = 1; i <= 5; i++) {
    const slot = `Tag ${i}`;
    const startM = `<!-- TAG_${i}_START -->`;
    const endM = `<!-- TAG_${i}_END -->`;
    let code = "";
    let isConnected = false;

    if (adsBlock.includes(startM) && adsBlock.includes(endM)) {
      const sIdx = adsBlock.indexOf(startM) + startM.length;
      const eIdx = adsBlock.indexOf(endM);
      const inner = adsBlock.substring(sIdx, eIdx).trim();
      if (inner.length > 0) {
        code = inner;
        isConnected = true;
      }
    }

    if (!code) {
      code = memAdTags[slot]?.tag_code || "";
    }

    map[slot] = {
      tag_slot: slot,
      tag_code: code,
      status: isConnected ? "connected" : "disconnected",
    };
  }

  return map;
}

// GET /admin/index-html — read raw index.html directly
router.get("/admin/index-html", (_req, res) => {
  const html = readIndexHtml();
  const slots = parseSlotsFromIndexHtml();
  res.json({
    success: true,
    html,
    slots,
  });
});

// POST /admin/index-html — write raw index.html or update specific tag slot
router.post("/admin/index-html", (req, res) => {
  const { html, slot, code, action } = req.body;
  if (html && typeof html === "string") {
    writeIndexHtml(html);
    res.json({ success: true, message: "index.html updated successfully", html }); return;
  }

  if (slot && action) {
    const updatedHtml = updateIndexHtmlSlot(slot, code || "", action);
    const slots = parseSlotsFromIndexHtml();
    res.json({ success: true, slot, action, status: slots[slot]?.status, html: updatedHtml, slots }); return;
  }

  res.status(400).json({ error: "Missing html or slot/action parameter" });
});

// GET /admin/ad-tags — get all 5 tag slots directly parsed from index.html
router.get("/admin/ad-tags", async (_req, res) => {
  const slotsFromHtml = parseSlotsFromIndexHtml();
  res.json(slotsFromHtml);
});

// POST /admin/ad-tags — connect or disconnect a slot, directly updating index.html
router.post("/admin/ad-tags", async (req, res) => {
  const { tag_slot, tag_code, action } = req.body;
  if (!tag_slot) {
    res.status(400).json({ error: "tag_slot is required" });
    return;
  }
  const status = action === "connect" ? "connected" : "disconnected";
  const code = tag_code !== undefined ? String(tag_code).trim() : (memAdTags[tag_slot]?.tag_code || "");

  // Update in-memory fallback
  memAdTags[tag_slot] = {
    tag_slot,
    tag_code: action === "connect" ? code : (memAdTags[tag_slot]?.tag_code || code),
    status,
  };

  // Directly update index.html between <!-- ADS_TAGS_START --> and <!-- ADS_TAGS_END -->
  updateIndexHtmlSlot(tag_slot, code, action === "connect" ? "connect" : "disconnect");

  try {
    await pool.query(`
      INSERT INTO ad_tags (tag_slot, tag_code, status, updated_at)
      VALUES ($1, $2, $3, now())
      ON CONFLICT (tag_slot)
      DO UPDATE SET
        tag_code = CASE WHEN $4 = 'connect' THEN $2 ELSE ad_tags.tag_code END,
        status = $3,
        updated_at = now()
    `, [tag_slot, code, status, action]);
  } catch (err) {
    // fallback
  }

  const updatedSlots = parseSlotsFromIndexHtml();
  res.json({
    success: true,
    slot: tag_slot,
    status: updatedSlots[tag_slot]?.status || status,
    tag_code: updatedSlots[tag_slot]?.tag_code || code,
    slots: updatedSlots,
  });
});

// GET /ad-tags/active — public active tags for client injection
router.get("/ad-tags/active", async (_req, res) => {
  try {
    const result = await pool.query(`SELECT tag_slot, tag_code FROM ad_tags WHERE status = 'connected' AND tag_code IS NOT NULL AND TRIM(tag_code) != '' ORDER BY id ASC`);
    if (result.rows && result.rows.length > 0) {
      res.json(result.rows);
      return;
    }
  } catch (err) {
    // fallback
  }
  const active = Object.values(memAdTags).filter(t => t.status === "connected" && t.tag_code.trim());
  res.json(active);
});


// POST /admin/users/push-verification-reminder — push verification emails to unverified users
router.post("/admin/users/push-verification-reminder", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body; // optional: if passed, send to specific user; otherwise send to all unverified
    let targetUsers: { id: number; email: string }[] = [];

    if (userId) {
      const u = await db.select({ id: usersTable.id, email: usersTable.email, isVerified: usersTable.isVerified })
        .from(usersTable)
        .where(eq(usersTable.id, Number(userId)))
        .limit(1);
      if (u[0] && !u[0].isVerified) {
        targetUsers.push({ id: u[0].id, email: u[0].email });
      }
    } else {
      const unverified = await db.select({ id: usersTable.id, email: usersTable.email, isVerified: usersTable.isVerified })
        .from(usersTable)
        .where(eq(usersTable.isVerified, false));
      targetUsers = unverified.map(u => ({ id: u.id, email: u.email }));
    }

    if (targetUsers.length === 0) {
      res.json({ success: true, count: 0, message: "No unverified users found." });
      return;
    }

    const { sendUnverifiedReminderEmail } = await import("../lib/email");
    const { otpCodesTable } = await import("@workspace/db");

    let sentCount = 0;
    let errors: string[] = [];

    for (const u of targetUsers) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      try {
        await db.insert(otpCodesTable).values({
          email: u.email.toLowerCase(),
          code,
          type: "verify_email",
          expiresAt,
        });

        await sendUnverifiedReminderEmail(u.email.toLowerCase(), code);
        sentCount++;
      } catch (err: any) {
        errors.push(`${u.email}: ${err?.message || "Failed"}`);
      }
    }

    res.json({
      success: true,
      totalUnverified: targetUsers.length,
      sentCount,
      errors: errors.slice(0, 5),
      message: `Pushed verification notification to ${sentCount} unverified account(s).`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to push verification notifications." });
  }
});

export default router;
