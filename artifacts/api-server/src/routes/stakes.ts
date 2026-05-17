import { Router } from "express";
import { db, stakesTable, usersTable, transactionsTable } from "@workspace/db";
import { eq, sql, and, sum } from "drizzle-orm";
import { requireAuth } from "../lib/auth-middleware";
import { getCountryConfig } from "../lib/currency";

const router = Router();

const STAKE_DAYS = 7;

// GET /stakes
router.get("/stakes", requireAuth, async (req, res) => {
  const stakes = await db.select().from(stakesTable).where(eq(stakesTable.userId, req.session.userId!));
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  res.json(stakes.map(s => {
    const end = new Date(s.endDate);
    const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyClaimedToday = s.lastDailyClaim ? s.lastDailyClaim >= todayStart : false;
    return {
      id: s.id,
      amount: parseFloat(s.amount),
      profit: parseFloat(s.profit),
      status: s.status,
      startDate: s.startDate.toISOString(),
      endDate: s.endDate.toISOString(),
      dailyClaimedToday,
      totalDailyClaimed: parseFloat(s.totalDailyClaimed),
      daysRemaining,
    };
  }));
});

// POST /stakes
router.post("/stakes", requireAuth, async (req, res) => {
  const amount = parseFloat(req.body.amount);

  // Fetch user first to get country config
  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (users.length === 0) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const cfg = getCountryConfig(users[0].country);

  if (isNaN(amount) || amount < cfg.minStake) {
    res.status(400).json({ error: `Minimum stake amount is ${cfg.symbol}${cfg.minStake.toLocaleString()}` });
    return;
  }
  if (amount > cfg.maxStake) {
    res.status(400).json({ error: `Maximum stake amount is ${cfg.symbol}${cfg.maxStake.toLocaleString()}` });
    return;
  }

  // Require at least minStake in approved deposits before staking
  const depositCheck = await db
    .select({ total: sum(transactionsTable.amount) })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, req.session.userId!),
        eq(transactionsTable.type, "deposit"),
        eq(transactionsTable.status, "approved"),
      ),
    );
  const totalDeposited = parseFloat(depositCheck[0]?.total ?? "0");
  if (totalDeposited < cfg.minStake) {
    res.status(403).json({ error: `You need at least ${cfg.symbol}${cfg.minStake.toLocaleString()} in approved deposits before you can stake.` });
    return;
  }

  const balance = parseFloat(users[0].balance);
  if (balance < amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + STAKE_DAYS);
  const profit = Math.floor((amount / cfg.minStake) * cfg.baseProfit);

  const inserted = await db.insert(stakesTable).values({
    userId: req.session.userId!,
    amount: amount.toString(),
    profit: profit.toString(),
    status: "active",
    endDate,
  }).returning();

  // Deduct from balance
  await db.update(usersTable).set({
    balance: sql`${usersTable.balance} - ${amount}`,
  }).where(eq(usersTable.id, req.session.userId!));

  const s = inserted[0];
  res.status(201).json({
    id: s.id,
    amount: parseFloat(s.amount),
    profit: parseFloat(s.profit),
    status: s.status,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
    dailyClaimedToday: false,
    totalDailyClaimed: 0,
    daysRemaining: STAKE_DAYS,
  });
});

// POST /stakes/:id/claim-daily
router.post("/stakes/:id/claim-daily", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const stakes = await db.select().from(stakesTable).where(eq(stakesTable.id, id)).limit(1);
  if (stakes.length === 0 || stakes[0].userId !== req.session.userId) {
    res.status(404).json({ error: "Stake not found" });
    return;
  }
  const stake = stakes[0];
  if (stake.status !== "active") {
    res.status(400).json({ error: "Stake is not active" });
    return;
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (stake.lastDailyClaim && stake.lastDailyClaim >= todayStart) {
    res.status(400).json({ error: "Daily reward already claimed today" });
    return;
  }

  // Get user's country config for daily reward amount
  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  const cfg = getCountryConfig(users[0]?.country);
  const dailyReward = cfg.dailyReward;

  await db.update(stakesTable).set({
    lastDailyClaim: now,
    totalDailyClaimed: (parseFloat(stake.totalDailyClaimed) + dailyReward).toString(),
  }).where(eq(stakesTable.id, id));

  await db.update(usersTable).set({
    balance: sql`${usersTable.balance} + ${dailyReward}`,
  }).where(eq(usersTable.id, req.session.userId!));

  const updatedUsers = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  res.json({
    message: `Daily reward of ${cfg.symbol}${dailyReward} claimed successfully!`,
    amount: dailyReward,
    newBalance: parseFloat(updatedUsers[0].balance),
  });
});

export default router;
