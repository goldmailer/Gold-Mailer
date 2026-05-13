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
  res.json(users.map(u => ({
    id: u.id,
    email: u.email,
    plainPassword: u.plainPassword,
    firstName: u.firstName,
    lastName: u.lastName,
    balance: parseFloat(u.balance),
    isVerified: u.isVerified,
    profileComplete: u.profileComplete,
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

// PUT /admin/deposit-account
router.put("/admin/deposit-account", requireAdmin, async (req, res) => {
  const { bankName, accountNumber, accountName } = req.body;
  if (!bankName || !accountNumber || !accountName) {
    res.status(400).json({ error: "All deposit account fields are required" });
    return;
  }
  const value = JSON.stringify({ bankName, accountNumber, accountName });
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, "deposit_account")).limit(1);
  if (existing.length > 0) {
    await db.update(settingsTable).set({ value, updatedAt: new Date() }).where(eq(settingsTable.key, "deposit_account"));
  } else {
    await db.insert(settingsTable).values({ key: "deposit_account", value });
  }
  res.json({ bankName, accountNumber, accountName });
});

export default router;
