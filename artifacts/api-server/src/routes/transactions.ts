import { Router } from "express";
import { db, transactionsTable, usersTable, settingsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth-middleware";

const router = Router();

// POST /transactions/deposit
router.post("/transactions/deposit", requireAuth, async (req, res) => {
  const { amount, transactionId } = req.body;
  if (!amount || !transactionId) {
    res.status(400).json({ error: "Amount and transaction ID are required" });
    return;
  }
  const inserted = await db.insert(transactionsTable).values({
    userId: req.session.userId!,
    type: "deposit",
    amount: parseFloat(amount).toString(),
    transactionId,
    status: "pending",
  }).returning();
  const t = inserted[0];
  res.status(201).json({
    id: t.id,
    type: t.type,
    amount: parseFloat(t.amount),
    status: t.status,
    transactionId: t.transactionId,
    bankName: null,
    accountNumber: null,
    accountName: null,
    notes: null,
    createdAt: t.createdAt.toISOString(),
  });
});

// POST /transactions/withdraw
router.post("/transactions/withdraw", requireAuth, async (req, res) => {
  const { amount, bankName, accountNumber, accountName } = req.body;
  if (!amount || !bankName || !accountNumber || !accountName) {
    res.status(400).json({ error: "All withdrawal fields are required" });
    return;
  }

  // Require at least one approved deposit before withdrawing
  const depositCheck = await db
    .select({ total: count() })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, req.session.userId!),
        eq(transactionsTable.type, "deposit"),
        eq(transactionsTable.status, "approved"),
      ),
    );
  if ((depositCheck[0]?.total ?? 0) === 0) {
    res.status(403).json({ error: "You must make a deposit first before you can withdraw." });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (users.length === 0) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const balance = parseFloat(users[0].balance);
  if (balance < parseFloat(amount)) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }
  const inserted = await db.insert(transactionsTable).values({
    userId: req.session.userId!,
    type: "withdrawal",
    amount: parseFloat(amount).toString(),
    bankName,
    accountNumber,
    accountName,
    status: "pending",
  }).returning();
  const t = inserted[0];
  res.status(201).json({
    id: t.id,
    type: t.type,
    amount: parseFloat(t.amount),
    status: t.status,
    transactionId: null,
    bankName: t.bankName,
    accountNumber: t.accountNumber,
    accountName: t.accountName,
    notes: null,
    createdAt: t.createdAt.toISOString(),
  });
});

// GET /transactions
router.get("/transactions", requireAuth, async (req, res) => {
  const txs = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, req.session.userId!));
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

// GET /settings/deposit-account
router.get("/settings/deposit-account", async (req, res) => {
  const settings = await db.select().from(settingsTable).where(eq(settingsTable.key, "deposit_account")).limit(1);
  if (settings.length === 0) {
    res.json({ bankName: "", accountNumber: "", accountName: "" });
    return;
  }
  const data = JSON.parse(settings[0].value);
  res.json(data);
});

export default router;
