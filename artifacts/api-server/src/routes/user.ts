import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, stakesTable, transactionsTable } from "@workspace/db";
import { eq, sum, count, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth-middleware";

async function checkHasDeposited(userId: number): Promise<boolean> {
  const result = await db
    .select({ total: count() })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        eq(transactionsTable.type, "deposit"),
        eq(transactionsTable.status, "approved"),
      ),
    );
  return (result[0]?.total ?? 0) > 0;
}

const router = Router();

// PUT /user/profile
router.put("/user/profile", requireAuth, async (req, res) => {
  const { firstName, lastName, middleName, age, gender } = req.body;
  // Reject base64 data URLs — they are too large for the DB and a security risk
  let avatarUrl: string | null = req.body.avatarUrl || null;
  if (avatarUrl && avatarUrl.startsWith("data:")) avatarUrl = null;
  // Also cap any URL to 2000 chars
  if (avatarUrl && avatarUrl.length > 2000) avatarUrl = null;

  if (!firstName || !lastName) {
    res.status(400).json({ error: "First name and last name are required" });
    return;
  }
  const updated = await db
    .update(usersTable)
    .set({
      firstName,
      lastName,
      middleName: middleName || null,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      avatarUrl: avatarUrl || null,
      profileComplete: true,
    })
    .where(eq(usersTable.id, req.session.userId!))
    .returning();
  const user = updated[0];
  const hasDeposited = await checkHasDeposited(user.id);
  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    age: user.age,
    gender: user.gender,
    avatarUrl: user.avatarUrl,
    isVerified: user.isVerified,
    profileComplete: user.profileComplete,
    cardAdded: user.cardAdded,
    balance: parseFloat(user.balance),
    hasDeposited,
    referralCode: user.referralCode,
    createdAt: user.createdAt.toISOString(),
  });
});

// POST /user/change-password
router.post("/user/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new password are required" });
    return;
  }
  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (users.length === 0) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const valid = await bcrypt.compare(currentPassword, users[0].passwordHash);
  if (!valid) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash, plainPassword: newPassword }).where(eq(usersTable.id, req.session.userId!));
  res.json({ message: "Password changed successfully" });
});

// POST /user/change-email
router.post("/user/change-email", requireAuth, async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) {
    res.status(400).json({ error: "New email is required" });
    return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, newEmail.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already in use" });
    return;
  }
  await db.update(usersTable).set({ email: newEmail.toLowerCase() }).where(eq(usersTable.id, req.session.userId!));
  res.json({ message: "Email updated successfully" });
});

// GET /user/dashboard
router.get("/user/dashboard", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (users.length === 0) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const user = users[0];

  const activeStakes = await db
    .select()
    .from(stakesTable)
    .where(eq(stakesTable.userId, userId));

  const activeCount = activeStakes.filter(s => s.status === "active").length;

  const totalStaked = activeStakes
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + parseFloat(s.amount), 0);

  const totalProfit = activeStakes
    .reduce((sum, s) => sum + parseFloat(s.profit) + parseFloat(s.totalDailyClaimed), 0);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dailyRewardAvailable = activeStakes
    .filter(s => s.status === "active")
    .some(s => !s.lastDailyClaim || s.lastDailyClaim < todayStart);

  const pendingTransactions = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId));

  const pendingDeposits = pendingTransactions.filter(t => t.type === "deposit" && t.status === "pending").length;
  const pendingWithdrawals = pendingTransactions.filter(t => t.type === "withdrawal" && t.status === "pending").length;

  res.json({
    balance: parseFloat(user.balance),
    totalStaked,
    totalProfit,
    activeStakes: activeCount,
    dailyRewardAvailable,
    pendingDeposits,
    pendingWithdrawals,
  });
});

// GET /user/referral
router.get("/user/referral", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (users.length === 0) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const user = users[0];
  const code = user.referralCode;

  let totalReferrals = 0;
  if (code) {
    const rows = await db
      .select({ cnt: count() })
      .from(usersTable)
      .where(eq(usersTable.referredBy, code));
    totalReferrals = Number(rows[0]?.cnt ?? 0);
  }

  const BONUS_PER_REFERRAL = 500;
  res.json({
    referralCode: code ?? null,
    totalReferrals,
    totalEarned: totalReferrals * BONUS_PER_REFERRAL,
  });
});

// GET /user/referrals — list of users referred by the current user
router.get("/user/referrals", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const me = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (me.length === 0) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const code = me[0].referralCode;

  let referrals: Array<{ email: string; joinedAt: string }> = [];
  if (code) {
    const rows = await db
      .select({ email: usersTable.email, createdAt: usersTable.createdAt })
      .from(usersTable)
      .where(eq(usersTable.referredBy, code));
    referrals = rows.map(r => ({
      email: r.email,
      joinedAt: r.createdAt.toISOString(),
    }));
  }

  res.json({
    referralCode: code ?? null,
    referrals,
    totalReferrals: referrals.length,
  });
});

export default router;
