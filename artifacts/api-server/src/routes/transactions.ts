import { Router } from "express";
import { db, transactionsTable, usersTable, settingsTable, stakesTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth-middleware";
import { getCountryConfig } from "../lib/currency";

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

  // Fetch user first (needed for country check)
  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (users.length === 0) {
    res.status(401).json({ error: "User not found" });
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
    res.status(403).json({ error: "You must make a deposit of at least ₦1,000 before you can withdraw." });
    return;
  }

  // Nigerian users must also have at least one completed stake before withdrawing
  if (users[0].country === "NG") {
    const completedStakeCheck = await db
      .select({ total: count() })
      .from(stakesTable)
      .where(
        and(
          eq(stakesTable.userId, req.session.userId!),
          eq(stakesTable.status, "completed"),
        ),
      );
    if ((completedStakeCheck[0]?.total ?? 0) === 0) {
      res.status(403).json({ error: "Nigerian accounts must complete at least one stake before withdrawing." });
      return;
    }
  }
  const cfg = getCountryConfig(users[0].country);
  const FIRST_WITHDRAWAL_MIN = cfg.firstWithdrawMin;

  // First withdrawal must meet minimum
  const prevWithdrawals = await db
    .select({ total: count() })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, req.session.userId!),
        eq(transactionsTable.type, "withdrawal"),
        eq(transactionsTable.status, "approved"),
      ),
    );
  const isFirstWithdrawal = (prevWithdrawals[0]?.total ?? 0) === 0;
  if (isFirstWithdrawal && parseFloat(amount) < FIRST_WITHDRAWAL_MIN) {
    res.status(400).json({
      error: `Your first withdrawal must be at least ${cfg.symbol}${FIRST_WITHDRAWAL_MIN.toLocaleString()}. After your first approved withdrawal, you can withdraw any amount.`,
    });
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
// Returns { accounts: Record<countryCode, { type, bankName?, accountNumber?, accountName?, paypalEmail?, paypalName? }> }
router.get("/settings/deposit-account", async (req, res) => {
  const settings = await db.select().from(settingsTable).where(eq(settingsTable.key, "deposit_account")).limit(1);
  if (settings.length === 0) {
    res.json({ accounts: {} });
    return;
  }
  const d = JSON.parse(settings[0].value);
  // New format: already a country-keyed object (has DEFAULT or country codes as keys)
  if (d.DEFAULT !== undefined || Object.keys(d).some(k => k.length === 2 || k === "DEFAULT")) {
    res.json({ accounts: d });
    return;
  }
  // Legacy format: migrate on the fly
  const accounts: Record<string, any> = {};
  if (d.bankName && d.accountNumber) {
    accounts["NG"] = { type: "bank", bankName: d.bankName, accountNumber: d.accountNumber, accountName: d.accountName };
  }
  if (d.paypalEmail) {
    accounts["DEFAULT"] = { type: "paypal", paypalEmail: d.paypalEmail, paypalName: d.paypalName };
  }
  if (d.usBankName && d.usShowBank) {
    accounts["US"] = { type: "bank", bankName: d.usBankName, accountNumber: d.usAccountNumber, accountName: d.usAccountName };
  } else if (d.usPaypalEmail && d.usShowPaypal) {
    accounts["US"] = { type: "paypal", paypalEmail: d.usPaypalEmail, paypalName: d.usPaypalName };
  }
  res.json({ accounts });
});

export default router;
