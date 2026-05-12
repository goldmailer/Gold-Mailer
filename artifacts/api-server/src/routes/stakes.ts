import { Router } from "express";
import { db, stakesTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth-middleware";

const router = Router();

const MIN_STAKE = 2700;
const MAX_STAKE = 100000;
const STAKE_DAYS = 7;
const BASE_PROFIT = 8000; // profit for ₦2700 stake
const DAILY_REWARD = 100;

function calcProfit(amount: number): number {
  // Scale profit proportionally: ₦8000 profit for ₦2700
  return Math.floor((amount / MIN_STAKE) * BASE_PROFIT);
}

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
  if (isNaN(amount) || amount < MIN_STAKE) {
    res.status(400).json({ error: `Minimum stake amount is ₦${MIN_STAKE.toLocaleString()}` });
    return;
  }
  if (amount > MAX_STAKE) {
    res.status(400).json({ error: `Maximum stake amount is ₦${MAX_STAKE.toLocaleString()}` });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (users.length === 0) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const balance = parseFloat(users[0].balance);
  if (balance < amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + STAKE_DAYS);
  const profit = calcProfit(amount);

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

  await db.update(stakesTable).set({
    lastDailyClaim: now,
    totalDailyClaimed: (parseFloat(stake.totalDailyClaimed) + DAILY_REWARD).toString(),
  }).where(eq(stakesTable.id, id));

  await db.update(usersTable).set({
    balance: sql`${usersTable.balance} + ${DAILY_REWARD}`,
  }).where(eq(usersTable.id, req.session.userId!));

  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  res.json({
    message: `Daily reward of ₦${DAILY_REWARD} claimed successfully!`,
    amount: DAILY_REWARD,
    newBalance: parseFloat(users[0].balance),
  });
});

export default router;
