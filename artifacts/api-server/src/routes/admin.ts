import { Router } from "express";
import { db, usersTable, transactionsTable, settingsTable, stakesTable } from "@workspace/db";
import { eq, ne, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth-middleware";

const router = Router();

// POST /admin/pin-login — create a server-side admin session via PIN
router.post("/admin/pin-login", (req, res) => {
  const { pin } = req.body;
  if (!pin || pin !== "2006") {
    res.status(401).json({ error: "Incorrect PIN. Access denied." });
    return;
  }
  req.session.isAdmin = true;
  res.json({ success: true });
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
  const id = parseInt(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ message: "User deleted successfully" });
});

// POST /admin/users/:id/balance
router.post("/admin/users/:id/balance", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
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
  const id = parseInt(req.params.id);
  const txs = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id)).limit(1);
  if (txs.length === 0) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  const tx = txs[0];
  const updated = await db.update(transactionsTable).set({ status: "approved" }).where(eq(transactionsTable.id, id)).returning();

  // Credit balance for deposits, deduct for withdrawals
  if (tx.type === "deposit") {
    await db.update(usersTable).set({
      balance: sql`${usersTable.balance} + ${parseFloat(tx.amount)}`,
    }).where(eq(usersTable.id, tx.userId));
  } else if (tx.type === "withdrawal") {
    await db.update(usersTable).set({
      balance: sql`${usersTable.balance} - ${parseFloat(tx.amount)}`,
    }).where(eq(usersTable.id, tx.userId));
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

// POST /admin/transactions/:id/decline
router.post("/admin/transactions/:id/decline", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
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

// PATCH /admin/users/:id
router.patch("/admin/users/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
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
  const { countryCode, type, bankName, accountNumber, accountName, paypalEmail, paypalName } = req.body;
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
    accounts[countryCode] = { type: "bank", bankName, accountNumber, accountName };
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
  delete accounts[countryCode];
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

export default router;
